const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = "https://ride-sathi-go-default-rtdb.asia-southeast1.firebasedatabase.app";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      databaseURL: DATABASE_URL
    });
  } catch(e) {
    admin.initializeApp();
  }
}

function getDb() {
  return admin.database();
}

// Target nodes to backup
const BACKUP_NODES = ['rides', 'completed_rides', 'ride_requests', 'accepted_rides'];


// === STRICT ENGLISH-ONLY CONVERTERS FOR GOOGLE SHEET ===
function toEnglishDigits(str) {
  if (str === null || str === undefined) return '';
  const bn = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
  return String(str).replace(/[০-৯]/g, d => bn[d] || d);
}

function toEnglishOnly(str) {
  if (str === null || str === undefined) return '';
  let s = toEnglishDigits(str);
  return s.replace(/[\u0980-\u09FF]/g, '').trim();
}

function cleanStatusEnglish(status) {
  if (!status) return 'COMPLETED';
  let st = String(status).toUpperCase();
  if (st.includes('COMPLET') || st.includes('সম্পন্ন')) return 'COMPLETED';
  if (st.includes('ACCEPT') || st.includes('গৃহীত')) return 'ACCEPTED';
  if (st.includes('CANCEL') || st.includes('বাতিল')) return 'CANCELLED';
  if (st.includes('REJECT') || st.includes('প্রত্যাখ্যাত')) return 'REJECTED';
  if (st.includes('PEND') || st.includes('অপেক্ষারত')) return 'PENDING';
  let clean = toEnglishOnly(st);
  return clean || 'COMPLETED';
}

function cleanCityEnglish(city) {
  if (!city) return 'Kolkata';
  let c = String(city).trim();
  if (c.includes('কাকদ্বীপ') || c.toLowerCase().includes('kakdwip')) return 'Kakdwip';
  if (c.includes('নামখানা') || c.toLowerCase().includes('namkhana')) return 'Namkhana';
  if (c.includes('ডায়মন্ড') || c.toLowerCase().includes('diamond')) return 'Diamond Harbour';
  if (c.includes('কলকাতা') || c.toLowerCase().includes('kolkata')) return 'Kolkata';
  if (c.includes('মেদিনীপুর') || c.toLowerCase().includes('medinipur')) return 'Medinipur';
  if (c.includes('দীঘা') || c.toLowerCase().includes('digha')) return 'Digha';
  if (c.includes('শিলিগুড়ি') || c.toLowerCase().includes('siliguri')) return 'Siliguri';
  let eng = toEnglishOnly(c);
  return eng || 'Kolkata';
}

function cleanPhoneEnglish(phone) {
  if (!phone) return '';
  let p = toEnglishDigits(phone);
  return p.replace(/[^0-9]/g, '').slice(-10);
}

// Sheet column headers: date, time, city, customer_mobile, driver_mobile, fare, status, ride_id
const SHEET_HEADERS = ['date', 'time', 'city', 'customer_mobile', 'driver_mobile', 'fare', 'status', 'ride_id'];

/**
 * Helper to initialize Google Sheets API Client
 */
async function getSheetsClient() {
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  let auth;

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (sa.private_key && !sa.private_key.includes('YOUR_PRIVATE_KEY_HERE')) {
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
      }
    } catch(e) {}
  }

  if (!auth) {
    auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * Retrieve Sheet ID from Environment, Config, or Realtime Database
 */
async function getGoogleSheetId() {
  // 1. Check process.env
  if (process.env.GOOGLE_SHEET_ID) return process.env.GOOGLE_SHEET_ID;

  // 2. Check functions.config()
  try {
    const cfg = functions.config();
    if (cfg && cfg.sheets && cfg.sheets.id) return cfg.sheets.id;
  } catch(e) {}

  // 3. Check Realtime Database settings
  try {
    const db = getDb();
    const snap = await db.ref('settings/google_sheets/sheet_id').once('value');
    if (snap.exists() && snap.val()) return String(snap.val()).trim();
  } catch(e) {}

  return null;
}

/**
 * Ensure a Sheet Tab exists, and create headers if newly created
 */
async function ensureSheetTabExists(sheets, spreadsheetId, sheetTitle) {
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = res.data.sheets || [];
    const found = sheetsList.find(s => s.properties && s.properties.title === sheetTitle);

    if (!found) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle }
              }
            }
          ]
        }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [SHEET_HEADERS] }
      });
    }
  } catch(err) {
    console.warn(`[ensureSheetTabExists] Tab notice (${sheetTitle}):`, err.message);
  }
}

/**
 * Main Backup & Purge Engine
 */
async function executeBackupAndClean() {
  const spreadsheetId = await getGoogleSheetId();
  if (!spreadsheetId) {
    const msg = 'ERROR: No Google Sheet ID configured! Set in admin.html or functions:config:set sheets.id="YOUR_ID"';
    console.error(msg);
    return { success: false, message: msg };
  }

  console.log(`Starting Google Sheet Backup for Sheet ID: ${spreadsheetId} (Owner: support.ridesathi@gmail.com)`);

  const db = getDb();
  const sheets = await getSheetsClient();
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // Older than 7 days
  const results = {};

  for (const node of BACKUP_NODES) {
    await ensureSheetTabExists(sheets, spreadsheetId, node);

    const snap = await db.ref(node).once('value');
    const data = snap.val() || {};
    const rowsToBackup = [];
    const keysToDelete = [];

    for (const [key, item] of Object.entries(data)) {
      if (!item || typeof item !== 'object') continue;

      let itemTime = 0;
      if (item.time) {
        itemTime = typeof item.time === 'number' ? item.time : new Date(item.time).getTime();
      } else if (item.completedAt) {
        itemTime = typeof item.completedAt === 'number' ? item.completedAt : new Date(item.completedAt).getTime();
      } else if (item.date) {
        itemTime = new Date(item.date).getTime();
      }

      if (itemTime && !isNaN(itemTime) && itemTime < cutoff) {
        const dObj = new Date(itemTime);
        // Clean ISO/English date: YYYY-MM-DD
        const dateStr = dObj.toISOString().slice(0, 10);
        // Clean 24-hour time: HH:MM:SS
        const timeStr = dObj.toTimeString().slice(0, 8);
        const cityStr = cleanCityEnglish(item.city);
        const custMobile = cleanPhoneEnglish(item.customerPhone || item.customerMobile || item.mobile || item.phone);
        const driverMobile = cleanPhoneEnglish(item.driverPhone || item.driverMobile);
        const fareVal = Number(item.fare || 0);
        const statusVal = cleanStatusEnglish(item.status);
        const rideId = toEnglishOnly(item.id || item.rideId || key);

        // Strict English-only row
        rowsToBackup.push([
          dateStr,
          timeStr,
          cityStr,
          custMobile,
          driverMobile,
          fareVal,
          statusVal,
          rideId
        ]);

        // Only delete status=completed rides
        if (statusVal === 'COMPLETED') {
          keysToDelete.push(key);
        }
      }
    }

    if (rowsToBackup.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${node}!A:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rowsToBackup }
      });
      console.log(`[Backup] Appended ${rowsToBackup.length} rows to tab "${node}"`);
    }

    let deletedCount = 0;
    for (const key of keysToDelete) {
      await db.ref(`${node}/${key}`).remove();
      deletedCount++;
    }

    results[node] = {
      backedUp: rowsToBackup.length,
      deleted: deletedCount
    };
  }

  await db.ref('settings/google_sheets/last_backup').set({
    timestamp: Date.now(),
    date: new Date().toISOString(),
    spreadsheetId: spreadsheetId,
    results: results
  });

  console.log('Backup & Cleanup completed successfully:', JSON.stringify(results));
  return { success: true, spreadsheetId, results };
}

/**
 * Scheduled Cloud Function: Runs daily at 2:00 AM IST
 */
exports.deleteOldRidesAndBackup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('[deleteOldRidesAndBackup] 2 AM Scheduled trigger started.');
    try {
      const res = await executeBackupAndClean();
      return res;
    } catch(err) {
      console.error('[deleteOldRidesAndBackup] Execution failed:', err);
      throw err;
    }
  });

/**
 * HTTP Callable Cloud Function: Allows manual trigger anytime from Admin Panel
 */
exports.manualBackupOldRides = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const result = await executeBackupAndClean();
    res.status(200).json(result);
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
