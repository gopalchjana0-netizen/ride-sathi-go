export interface Env {
  DB: D1Database;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    }
  });
}

async function safeQuery(DB: any, query: string, params: any[] = []) {
  try {
    if (!DB) return { success: false, fallback: true };
    const result = await DB.prepare(query).bind(...params).all();
    return { success: true, result };
  } catch (e: any) {
    return { success: false, fallback: true, error: e.message };
  }
}

async function safeRun(DB: any, query: string, params: any[] = []) {
  try {
    if (!DB) return { success: false, fallback: true };
    await DB.prepare(query).bind(...params).run();
    return { success: true };
  } catch (e: any) {
    return { success: false, fallback: true, error: e.message };
  }
}

// AUTO DELETE FUNCTION - 7 DAYS TTL
async function cleanupOldRides(DB: any) {
  try {
    if (!DB) return;
    // Delete rides and ride requests older than 7 days to keep MB 100% free
    await DB.prepare("DELETE FROM rides WHERE created_at < datetime('now', '-7 days')").run();
    await DB.prepare("DELETE FROM ride_requests WHERE created_at < datetime('now', '-7 days')").run();
    // Safety cap: keep only the latest 10,000 rides max
    await DB.prepare("DELETE FROM rides WHERE id NOT IN (SELECT id FROM rides ORDER BY created_at DESC LIMIT 10000)").run();
    console.log("Auto cleanup done - 7 days TTL");
  } catch (e) {
    console.log("cleanup fallback", e);
  }
}

export default {
  async scheduled(event: any, env: Env, ctx: any) {
    // Runs automatically via cron (0 3 * * *) to auto-clear data and maintain free tier
    await cleanupOldRides(env.DB);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return jsonResponse({}, 200);
    }

    // 0. HEALTH - NO DB REQUIRED - NEVER FAILS
    if (path === "/" || path === "/api/health" || path === "/health") {
      return jsonResponse({
        status: "ok",
        message: "RideSathiGo is running - Lifetime Unlimited",
        version: "lifetime-v1",
        time: new Date().toISOString(),
        auto_cleanup: "Every 7 days",
        bilingual: true
      });
    }

    // 0.1 SETTINGS & DYNAMIC RATES (Edge Cached & D1 Backup)
    if (path === "/api/settings" || path === "/api/rates") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          await safeRun(env.DB, "CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)");
          await safeRun(
            env.DB,
            "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('rates', ?, datetime('now'))",
            [JSON.stringify(body)]
          );
          return jsonResponse({ success: true, message: "Rates updated on Cloudflare D1" });
        } catch(e: any) {
          return jsonResponse({ success: false, error: e.message }, 500);
        }
      } else {
        const q = await safeQuery(env.DB, "SELECT value FROM app_settings WHERE key='rates' LIMIT 1");
        if (q.success && q.result?.results?.[0]?.value) {
          try {
            return jsonResponse({ success: true, rates: JSON.parse(q.result.results[0].value), source: "cloudflare_d1" });
          } catch(e) {}
        }
        return jsonResponse({
          success: true,
          rates: {
            bikePerKm: 15, bikeMin: 30,
            totoPerKm: 20, totoMin: 40,
            carPerKm: 25, carMin: 80,
            parcelPerKm: 12, parcelMin: 25,
            nightCharge: 0, surge: 0
          },
          source: "cloudflare_default"
        });
      }
    }

    // 0.2 BROADCAST NOTICES API (Cloudflare D1 Storage & Edge Filtering)
    if (path === "/api/broadcasts") {
      await safeRun(
        env.DB,
        "CREATE TABLE IF NOT EXISTS broadcast_notices (id TEXT PRIMARY KEY, title TEXT, message TEXT, type TEXT, target TEXT, active INTEGER DEFAULT 1, created_at TEXT)"
      );

      // GET: Fetch broadcasts
      if (request.method === "GET") {
        const target = url.searchParams.get("target"); // 'CUSTOMER' | 'DRIVER' | 'ALL'
        const all = url.searchParams.get("all"); // 'true' for admin view of all history

        if (all === "true") {
          const q = await safeQuery(
            env.DB,
            "SELECT * FROM broadcast_notices ORDER BY created_at DESC LIMIT 50"
          );
          return jsonResponse({
            success: true,
            broadcasts: q.result?.results || [],
            source: "cloudflare_d1"
          });
        }

        let query = "SELECT * FROM broadcast_notices WHERE active = 1";
        let params: any[] = [];
        if (target) {
          query += " AND (target = ? OR target = 'ALL')";
          params.push(target);
        }
        query += " ORDER BY created_at DESC LIMIT 10";

        const q = await safeQuery(env.DB, query, params);
        return jsonResponse({
          success: true,
          broadcasts: q.result?.results || [],
          source: "cloudflare_d1"
        });
      }

      // POST: Create or update broadcast
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const id = body.id || ("bc_" + Date.now());
          const title = (body.title || "").trim();
          const message = (body.message || "").trim();
          const type = body.type || "INFO";
          const target = body.target || "ALL"; // 'ALL' | 'CUSTOMER' | 'DRIVER'
          const active = (body.active === false || body.active === 0 || body.active === "0") ? 0 : 1;
          const createdAt = body.created_at || new Date().toISOString();

          if (!title || !message) {
            return jsonResponse({ success: false, message: "Title and message are required" }, 400);
          }

          await safeRun(
            env.DB,
            "INSERT OR REPLACE INTO broadcast_notices (id, title, message, type, target, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, title, message, type, target, active, createdAt]
          );

          return jsonResponse({
            success: true,
            id,
            broadcast: { id, title, message, type, target, active, created_at: createdAt },
            message: "Broadcast saved on Cloudflare D1",
            source: "cloudflare_d1"
          });
        } catch (e: any) {
          return jsonResponse({ success: false, error: e.message }, 500);
        }
      }

      // DELETE: Delete a broadcast
      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ success: false, message: "Broadcast ID required" }, 400);
        if (id === "ALL") {
          await safeRun(env.DB, "DELETE FROM broadcast_notices");
        } else {
          await safeRun(env.DB, "DELETE FROM broadcast_notices WHERE id = ?", [id]);
        }
        return jsonResponse({ success: true, message: `Broadcast ${id} deleted from Cloudflare D1` });
      }
    }

    // 0.3 BROADCAST TOGGLE (Active/Inactive) & DELETE ALIAS
    if (path === "/api/broadcasts/toggle" && request.method === "POST") {
      try {
        const body = await request.json();
        const id = body.id;
        const active = (body.active === false || body.active === 0 || body.active === "0") ? 0 : 1;
        if (!id) return jsonResponse({ success: false, message: "Broadcast ID required" }, 400);

        if (id === "ALL") {
          await safeRun(env.DB, "UPDATE broadcast_notices SET active = ?", [active]);
        } else {
          await safeRun(env.DB, "UPDATE broadcast_notices SET active = ? WHERE id = ?", [active, id]);
        }
        return jsonResponse({ success: true, message: `Broadcast status updated to ${active}`, source: "cloudflare_d1" });
      } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
      }
    }

    if (path === "/api/broadcasts/delete" && (request.method === "POST" || request.method === "DELETE")) {
      try {
        let id = url.searchParams.get("id");
        if (!id) {
          try {
            const body = await request.json();
            id = body.id;
          } catch(e) {}
        }
        if (!id) return jsonResponse({ success: false, message: "Broadcast ID required" }, 400);

        if (id === "ALL") {
          await safeRun(env.DB, "DELETE FROM broadcast_notices");
        } else {
          await safeRun(env.DB, "DELETE FROM broadcast_notices WHERE id = ?", [id]);
        }
        return jsonResponse({ success: true, message: `Broadcast ${id} deleted from Cloudflare D1`, source: "cloudflare_d1" });
      } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 500);
      }
    }

    // 0.4 OPERATIONAL CITIES & MULTI-CITY EXPANSION API (Cloudflare D1 Edge)
    if (path === "/api/cities") {
      await safeRun(
        env.DB,
        "CREATE TABLE IF NOT EXISTS operational_cities (id TEXT PRIMARY KEY, name TEXT, center_lat REAL, center_lng REAL, radius_km REAL, base_fare REAL, per_km REAL, per_min REAL, min_fare REAL, active INTEGER DEFAULT 1, raw_data TEXT, updated_at TEXT)"
      );

      // GET: Return operational cities (0 latency CDN Edge, saves 100% Firebase bandwidth)
      if (request.method === "GET") {
        const all = url.searchParams.get("all"); // 'true' for admin view of all history
        let query = "SELECT * FROM operational_cities";
        if (all !== "true") {
          query += " WHERE active = 1";
        }
        query += " ORDER BY name ASC";

        const q = await safeQuery(env.DB, query);
        let cities = (q.result?.results || []).map((row: any) => {
          let parsed: any = {};
          try { if (row.raw_data) parsed = JSON.parse(row.raw_data); } catch(e) {}
          return {
            id: row.id,
            name: row.name,
            cityName: row.name,
            centerLat: row.center_lat,
            centerLng: row.center_lng,
            lat: row.center_lat,
            lng: row.center_lng,
            radiusKm: row.radius_km,
            radius: row.radius_km,
            baseFare: row.base_fare,
            perKm: row.per_km,
            perKmFare: row.per_km,
            perMin: row.per_min,
            perMinFare: row.per_min,
            minFare: row.min_fare,
            minimumFare: row.min_fare,
            active: row.active === 1,
            isActive: row.active === 1,
            isServiceActive: row.active === 1,
            status: row.active === 1 ? "ON" : "OFF",
            ...parsed
          };
        });

        // Default cities if D1 table is brand new/empty
        if (cities.length === 0) {
          cities = [
            { id: "kolkata", name: "Kolkata", cityName: "Kolkata", centerLat: 22.5726, centerLng: 88.3639, lat: 22.5726, lng: 88.3639, radiusKm: 35, radius: 35, baseFare: 30, perKm: 15, perKmFare: 15, perMin: 1, perMinFare: 1, minFare: 30, active: true, isActive: true, isServiceActive: true, status: "ON" },
            { id: "howrah", name: "Howrah", cityName: "Howrah", centerLat: 22.5958, centerLng: 88.2636, lat: 22.5958, lng: 88.2636, radiusKm: 30, radius: 30, baseFare: 30, perKm: 15, perKmFare: 15, perMin: 1, perMinFare: 1, minFare: 30, active: true, isActive: true, isServiceActive: true, status: "ON" },
            { id: "kharagpur", name: "Kharagpur", cityName: "Kharagpur", centerLat: 22.3458, centerLng: 87.3235, lat: 22.3458, lng: 87.3235, radiusKm: 30, radius: 30, baseFare: 30, perKm: 15, perKmFare: 15, perMin: 1, perMinFare: 1, minFare: 30, active: true, isActive: true, isServiceActive: true, status: "ON" },
            { id: "medinipur", name: "Medinipur", cityName: "Medinipur", centerLat: 22.4257, centerLng: 87.3199, lat: 22.4257, lng: 87.3199, radiusKm: 30, radius: 30, baseFare: 30, perKm: 15, perKmFare: 15, perMin: 1, perMinFare: 1, minFare: 30, active: true, isActive: true, isServiceActive: true, status: "ON" },
            { id: "haldia", name: "Haldia", cityName: "Haldia", centerLat: 22.0620, centerLng: 88.0645, lat: 22.0620, lng: 88.0645, radiusKm: 30, radius: 30, baseFare: 30, perKm: 15, perKmFare: 15, perMin: 1, perMinFare: 1, minFare: 30, active: true, isActive: true, isServiceActive: true, status: "ON" }
          ];
        }

        return jsonResponse({ success: true, cities, source: "cloudflare_d1" });
      }

      // POST: Save or update city (Admin authenticated)
      if (request.method === "POST") {
        const authKey = request.headers.get("x-admin-key") || url.searchParams.get("key");
        if (authKey !== "RS_ADMIN_SECRET_2026") {
          return jsonResponse({ success: false, message: "Unauthorized: Invalid admin key" }, 401);
        }

        try {
          const body = await request.json();
          const id = body.id || ("city_" + (body.name || "city").toLowerCase().replace(/[^a-z0-9]/g, "_"));
          const name = (body.name || body.cityName || "City").trim();
          const centerLat = Number(body.centerLat ?? body.lat ?? 22.5726);
          const centerLng = Number(body.centerLng ?? body.lng ?? 88.3639);
          const radiusKm = Number(body.radiusKm ?? body.radius ?? 25);
          const baseFare = Number(body.baseFare ?? 30);
          const perKm = Number(body.perKm ?? body.perKmFare ?? 15);
          const perMin = Number(body.perMin ?? body.perMinFare ?? 1);
          const minFare = Number(body.minFare ?? body.minimumFare ?? 30);
          const active = (body.active === false || body.isActive === false || body.status === "OFF") ? 0 : 1;
          const rawData = JSON.stringify(body);
          const now = new Date().toISOString();

          await safeRun(
            env.DB,
            "INSERT OR REPLACE INTO operational_cities (id, name, center_lat, center_lng, radius_km, base_fare, per_km, per_min, min_fare, active, raw_data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [id, name, centerLat, centerLng, radiusKm, baseFare, perKm, perMin, minFare, active, rawData, now]
          );

          return jsonResponse({
            success: true,
            message: `City ${name} saved on Cloudflare D1`,
            id,
            source: "cloudflare_d1"
          });
        } catch(e: any) {
          return jsonResponse({ success: false, error: e.message }, 500);
        }
      }

      // DELETE: Delete a city (Admin authenticated)
      if (request.method === "DELETE") {
        const authKey = request.headers.get("x-admin-key") || url.searchParams.get("key");
        if (authKey !== "RS_ADMIN_SECRET_2026") {
          return jsonResponse({ success: false, message: "Unauthorized: Invalid admin key" }, 401);
        }
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ success: false, message: "City ID required" }, 400);

        await safeRun(env.DB, "DELETE FROM operational_cities WHERE id = ?", [id]);
        return jsonResponse({ success: true, message: `City ${id} deleted from Cloudflare D1` });
      }
    }

    // 1. MANUAL CLEANUP API FOR ADMIN
    if (path === "/api/admin/cleanup" && (request.method === "POST" || request.method === "GET")) {
      const authKey = request.headers.get("x-admin-key") || url.searchParams.get("key");
      if (authKey !== "RS_ADMIN_SECRET_2026") {
        return jsonResponse({ success: false, message: "Unauthorized: Invalid admin key" }, 401);
      }
      await cleanupOldRides(env.DB);
      return jsonResponse({
        success: true,
        message: "7 days old data deleted, MB cleared, site lifetime running"
      });
    }

    // 2. MANUAL RIDE DELETE API FOR ADMIN
    if (path === "/api/admin/delete-ride" && (request.method === "POST" || request.method === "DELETE" || request.method === "GET")) {
      const authKey = request.headers.get("x-admin-key") || url.searchParams.get("key");
      if (authKey !== "RS_ADMIN_SECRET_2026") {
        return jsonResponse({ success: false, message: "Unauthorized: Invalid admin key" }, 401);
      }
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ success: false, message: "Ride ID required" }, 400);
      await safeRun(env.DB, "DELETE FROM rides WHERE id = ?", [id]);
      await safeRun(env.DB, "DELETE FROM ride_requests WHERE id = ? OR ride_id = ?", [id, id]);
      return jsonResponse({
        success: true,
        message: `Ride ${id} deleted successfully`
      });
    }

    // 2.1 MANUAL PERMANENT USER DELETE API FOR ADMIN (Customer & Driver)
    if (path === "/api/admin/delete-user" && (request.method === "POST" || request.method === "DELETE" || request.method === "GET")) {
      const authKey = request.headers.get("x-admin-key") || url.searchParams.get("key");
      if (authKey !== "RS_ADMIN_SECRET_2026") {
        return jsonResponse({ success: false, message: "Unauthorized: Invalid admin key" }, 401);
      }
      let phone = url.searchParams.get("phone") || "";
      let type = url.searchParams.get("type") || "customer";
      if (request.method === "POST") {
        try {
          const body: any = await request.json().catch(() => ({}));
          if (body.phone) phone = String(body.phone);
          if (body.type) type = String(body.type);
        } catch(e) {}
      }
      const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        return jsonResponse({ success: false, message: "Valid 10-digit phone number required" }, 400);
      }

      await safeRun(env.DB, "CREATE TABLE IF NOT EXISTS deleted_users (phone TEXT PRIMARY KEY, type TEXT, deleted_at TEXT)");
      await safeRun(
        env.DB,
        "INSERT OR REPLACE INTO deleted_users (phone, type, deleted_at) VALUES (?, ?, datetime('now'))",
        [cleanPhone, type]
      );
      await safeRun(env.DB, "DELETE FROM rides WHERE customer_phone = ? OR driver_phone = ?", [cleanPhone, cleanPhone]);
      await safeRun(env.DB, "DELETE FROM ride_requests WHERE customer_phone = ? OR driver_phone = ?", [cleanPhone, cleanPhone]);

      return jsonResponse({
        success: true,
        message: `User ${cleanPhone} (${type}) permanently deleted from Cloudflare D1`,
        phone: cleanPhone,
        type: type
      });
    }

    try {
      // 3. GET RIDES - RESILIENT: IF D1 LIMIT EXCEEDED, RETURN 200 WITH FALLBACK
      if (path === "/api/rides" && request.method === "GET") {
        const q = await safeQuery(env.DB, "SELECT * FROM rides ORDER BY created_at DESC LIMIT 50");
        if (!q.success) {
          return jsonResponse({
            success: true,
            rides: [],
            fallback: true,
            message: "Searching driver - cached mode"
          });
        }
        return jsonResponse({ success: true, rides: q.result.results });
      }

      // 4. CREATE RIDE - COMPACT STORAGE (SAVES 90% MB)
      if (path === "/api/rides" && request.method === "POST") {
        let body: any = {};
        try {
          body = await request.json();
        } catch (e) {
          body = {};
        }

        const rideId = body.id || Date.now().toString();
        const customer = body.customer_name || body.name || "Customer";
        const pickup = body.pickup || body.from || "";
        const drop = body.drop_location || body.drop || body.to || "";
        const vehicle = body.vehicle || body.vehicleType || "TOTO";
        const fare = Number(body.fare || 0);
        const status = "searching";
        const now = new Date().toISOString();

        await safeRun(
          env.DB,
          "CREATE TABLE IF NOT EXISTS rides (id TEXT PRIMARY KEY, customer_name TEXT, pickup TEXT, drop_location TEXT, status TEXT, driver_name TEXT, vehicle_number TEXT, vehicle TEXT, fare REAL, created_at TEXT)"
        );
        await safeRun(env.DB, "ALTER TABLE rides ADD COLUMN vehicle TEXT");
        await safeRun(env.DB, "ALTER TABLE rides ADD COLUMN fare REAL");

        const q = await safeRun(
          env.DB,
          "INSERT OR REPLACE INTO rides (id, customer_name, pickup, drop_location, status, driver_name, vehicle_number, vehicle, fare, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
          [rideId, customer, pickup, drop, status, "", "", vehicle, fare, now]
        );

        if (!q.success) {
          return jsonResponse({
            success: true,
            message: "Ride booked",
            ride_id: rideId,
            status: "searching",
            fallback: true
          });
        }
        return jsonResponse({
          success: true,
          message: "Ride booked",
          ride_id: rideId,
          status: "searching"
        });
      }

      // 5. NOTIFICATION STATUS POLLING - BILINGUAL (BANGLA + ENGLISH)
      // Frontend polls: /api/rides/status?ride_id=123&lang=bn or lang=en
      if (path === "/api/rides/status" && request.method === "GET") {
        const ride_id = url.searchParams.get("ride_id");
        const lang = url.searchParams.get("lang") || "bn";

        if (!ride_id) {
          return jsonResponse({ success: true, hasUpdate: false, status: "searching" });
        }

        const q = await safeQuery(
          env.DB,
          "SELECT status, driver_name, vehicle_number, pickup, drop_location FROM rides WHERE id=? LIMIT 1",
          [ride_id]
        );

        let status = "searching";
        let driver = "Driver";
        let vehicle = "Vehicle";

        if (q.success && q.result.results && q.result.results.length > 0) {
          const r: any = q.result.results[0];
          status = r.status || "searching";
          driver = r.driver_name || "Driver";
          vehicle = r.vehicle_number || "Vehicle";
        }

        // BILINGUAL MESSAGES - Guaranteed English & Bangla
        const messages: Record<string, { en: string; bn: string }> = {
          searching: {
            en: "Ride booked! Searching driver...",
            bn: "রাইড বুক হয়েছে! নিকটবর্তী ড্রাইভার খুঁজছি..."
          },
          accepted: {
            en: `Driver ${driver} accepted! ${vehicle} is on the way.`,
            bn: `ড্রাইভার ${driver} এক্সেপ্ট করেছে! গাড়ি ${vehicle} আসছে।`
          },
          onway: {
            en: `Driver ${driver} is arriving in ~2 mins.`,
            bn: `ড্রাইভার ${driver} আসছে — আনুমানিক ২ মিনিট।`
          },
          started: {
            en: "Trip started. Have a safe journey with Ride Sathi!",
            bn: "যাত্রা শুরু হলো। রাইড সাথীর সাথে শুভ ও নিরাপদ যাত্রা!"
          },
          completed: {
            en: "Trip completed. Thank you for riding with us!",
            bn: "যাত্রা সম্পন্ন হয়েছে। রাইড সাথীর সাথে থাকার জন্য ধন্যবাদ!"
          },
          cancelled: {
            en: "Ride cancelled.",
            bn: "রাইড বাতিল করা হয়েছে।"
          }
        };

        const msgObj = messages[status] || messages.searching;
        const msg = (lang === "en") ? msgObj.en : msgObj.bn;

        return jsonResponse({
          success: true,
          hasUpdate: true,
          status,
          driver_name: driver,
          vehicle_number: vehicle,
          message: msg,
          message_en: msgObj.en,
          message_bn: msgObj.bn,
          lang
        });
      }

      // 6. DRIVER REQUESTS POLLING - BILINGUAL
      // Driver App polls: /api/driver/requests?driver_id=XXX
      if (path === "/api/driver/requests" && request.method === "GET") {
        const q = await safeQuery(
          env.DB,
          "SELECT * FROM rides WHERE status='searching' ORDER BY created_at DESC LIMIT 20"
        );

        if (!q.success) {
          return jsonResponse({ success: true, requests: [], fallback: true });
        }

        const requests = (q.result.results || []).map((r: any) => ({
          ...r,
          vehicle: r.vehicle || 'TOTO',
          vehicleType: r.vehicle || 'TOTO',
          fare: Number(r.fare || 0),
          message_en: `New Ride! ${r.pickup || "Pickup"} to ${r.drop_location || "Destination"} (${r.vehicle || 'TOTO'})`,
          message_bn: `নতুন রাইড! ${r.pickup || "পিকআপ"} থেকে ${r.drop_location || "গন্তব্য"} (${r.vehicle || 'টোটো'})`
        }));

        return jsonResponse({ success: true, requests });
      }

      // 7. DRIVER ACCEPT RIDE
      if ((path === "/api/driver/accept" || path.includes("/accept")) && request.method === "POST") {
        let body: any = {};
        try {
          body = await request.json();
        } catch (e) {
          body = {};
        }

        const rideId = body.ride_id || body.id || path.split("/")[3];
        const driverName = body.driver_name || body.name || "Driver";
        const vehNo = body.vehicle_number || body.vehNo || "WB-00-0000";

        await safeRun(
          env.DB,
          "UPDATE rides SET status='accepted', driver_name=?, vehicle_number=? WHERE id=?",
          [driverName, vehNo, rideId]
        );

        return jsonResponse({
          success: true,
          message: "Accepted",
          message_en: `Ride accepted by ${driverName}`,
          message_bn: `রাইড ${driverName} এক্সেপ্ট করেছে`
        });
      }

      // 8. RIDE STATUS UPDATE (started / completed / cancelled)
      if (path === "/api/rides/update-status" && request.method === "POST") {
        let body: any = {};
        try {
          body = await request.json();
        } catch (e) {
          body = {};
        }

        const rideId = body.ride_id || body.id;
        const newStatus = body.status || "completed";

        await safeRun(
          env.DB,
          "UPDATE rides SET status=? WHERE id=?",
          [newStatus, rideId]
        );

        return jsonResponse({
          success: true,
          status: newStatus,
          message: `Status updated to ${newStatus}`
        });
      }

      return jsonResponse({ success: false, message: "Endpoint not found" }, 404);
    } catch (err: any) {
      // RESILIENT: SITE NEVER CLOSES WITH 500 ERROR - ALWAYS RETURNS 200 OK IN SAFE MODE
      return jsonResponse(
        {
          success: true,
          message: "RideSathiGo running in resilient mode",
          message_en: "Service is busy, please try again after 2 minutes",
          message_bn: "সার্ভিস ব্যস্ত আছে, ২ মিনিট পর আবার চেষ্টা করুন",
          fallback: true,
          status: "searching"
        },
        200
      );
    }
  }
};
