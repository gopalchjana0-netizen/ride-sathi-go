/**
 * RIDE SATHI GO - Cuelinks Automated Offers Synchronization Engine
 * Publisher ID: 276694 | Channel ID: 324245 | SubID: ridesathigo
 * ₹0.00 Cost Forever - Static CDN Feed Generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CUELINKS_API_TOKEN = '7d_vGYjqFdfJLGg6XEwV8c2ukN1FA-Ewp5gDGz747Qw';
const CHANNEL_ID = '324245';
const PUB_ID = '276694';
const SUB_ID = 'ridesathigo';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function mapCategory(cuelinksCats, title, campaign) {
  const catStr = (Object.values(cuelinksCats || {}).join(' ') + ' ' + (title || '') + ' ' + (campaign || '')).toLowerCase();

  const rechargeRegex = /\b(recharge|prepaid recharge|prepaid mobile|postpaid bill|dth|electricity bill|electric bill|utility bill|water bill|gas bill|fastag|broadband bill|airtel|jio|bsnl|vodafone|tataplay)\b/i;
  if (rechargeRegex.test(catStr)) {
    return 'Recharge';
  }
  if (catStr.includes('travel') || catStr.includes('flight') || catStr.includes('hotel') || catStr.includes('bus') || catStr.includes('ticket') || catStr.includes('air') || catStr.includes('klook')) {
    return 'Travel';
  }
  if (catStr.includes('food') || catStr.includes('dining') || catStr.includes('pizza') || catStr.includes('burger') || catStr.includes('restaurant') || catStr.includes('swiggy') || catStr.includes('zomato') || catStr.includes('kfc') || catStr.includes('domino')) {
    return 'Food';
  }
  if (catStr.includes('grocery') || catStr.includes('blinkit') || catStr.includes('zepto') || catStr.includes('supermarket')) {
    return 'Grocery';
  }
  if (catStr.includes('electronic') || catStr.includes('mobile') || catStr.includes('gadget') || catStr.includes('laptop') || catStr.includes('earphone') || catStr.includes('smartwatch') || catStr.includes('croma') || catStr.includes('boat') || catStr.includes('noise')) {
    return 'Electronics';
  }
  if (catStr.includes('health') || catStr.includes('medicine') || catStr.includes('pharmacy') || catStr.includes('ayur') || catStr.includes('nutrition') || catStr.includes('1mg') || catStr.includes('apollo') || catStr.includes('netmeds')) {
    return 'Health';
  }
  if (catStr.includes('beauty') || catStr.includes('makeup') || catStr.includes('skincare') || catStr.includes('cosmetic') || catStr.includes('nykaa') || catStr.includes('mamaearth') || catStr.includes('purplle')) {
    return 'Beauty';
  }
  return 'Shopping';
}

function fetchPage(page) {
  return new Promise((resolve) => {
    const req = https.get({
      hostname: 'www.cuelinks.com',
      path: '/api/v2/offers.json?page=' + page + '&per_page=100',
      headers: {
        'Authorization': 'Bearer ' + CUELINKS_API_TOKEN,
        'Accept': 'application/json',
        'User-Agent': 'RideSathiGo-Sync/1.0'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.warn('Page ' + page + ' request error:', err.message);
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Evergreen Top Indian Brands & High-Commission Recharge Catalog
const evergreenTopBrands = [
  // 📱 Mobile Recharge, DTH & Utility Bills
  { b: 'Jio Recharge', d: 'Up to ₹50 Cashback on Jio Unlimited 5G & Data Packs', c: 'JIO50', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', rank: 1 },
  { b: 'Airtel Recharge', d: 'Flat ₹40 Cashback on Airtel 1.5GB/2GB Daily Plans', c: 'AIRTEL40', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', rank: 2 },
  { b: 'Vi Recharge', d: 'Hero Unlimited Midnight Data Plans + Flat ₹30 Cashback', c: 'VI30', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', rank: 3 },
  { b: 'BSNL Mobile', d: 'Affordable 3G/4G Validity Plans + Extra Discount', c: 'BSNL20', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', badge: 'Validity', rank: 4 },
  { b: 'WBSEDCL Electricity', d: 'পশ্চিমবঙ্গ বিদ্যুৎ বিল পেমেন্টে পান নিশ্চিত ₹৫০ পর্যন্ত ক্যাশব্যাক', c: 'BILL50', cat: 'Recharge', l: 'https://www.amazon.in/b?node=14322429031', badge: 'WB Bill', rank: 5 },
  { b: 'DTH Recharge', d: 'Tata Play, Airtel DTH, Dish TV রিচার্জে ক্যাশব্যাক ও ছাড়', c: 'DTHSAVE', cat: 'Recharge', l: 'https://www.amazon.in/b?node=14322430031', badge: 'DTH', rank: 6 },
  { b: 'Fastag Recharge', d: 'Paytm, SBI, ICICI ও সকল ব্যাংকের Fastag রিচার্জ ক্যাশব্যাক', c: 'FASTAG10', cat: 'Recharge', l: 'https://www.amazon.in/b?node=21488168031', badge: 'Fastag', rank: 7 },
  { b: 'Amazon Pay Bills', d: 'All Mobile Recharge, DTH & Utility Bill Payment Hub', c: 'AMZPAY', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', badge: 'All in One', rank: 8 },

  // 🛍️ Mega Shopping
  { b: 'Amazon', d: 'Up to 80% OFF on Mobiles, Fashion & Electronics', c: 'AMZ80', cat: 'Shopping', l: 'https://www.amazon.in', badge: 'Trending', rank: 9 },
  { b: 'Flipkart', d: 'Big Saving Days: Up to 80% OFF on Top Products', c: 'FLIP50', cat: 'Shopping', l: 'https://www.flipkart.com', badge: 'Top Deal', rank: 10 },
  { b: 'Myntra', d: 'Flat 30% to 70% OFF on Branded Fashion & Shoes', c: 'MYNTRA30', cat: 'Shopping', l: 'https://www.myntra.com', badge: 'Fashion', rank: 11 },
  { b: 'Ajio', d: 'Min 50-70% OFF on Trends & Exclusive Brands', c: 'AJIO50', cat: 'Shopping', l: 'https://www.ajio.com', badge: 'Hot', rank: 12 },
  { b: 'MakeMyTrip', d: 'Flat ₹2,000 OFF on Domestic Flights & Hotels', c: 'MMT2000', cat: 'Travel', l: 'https://www.makemytrip.com', badge: 'Flight/Hotel', rank: 13 },
  { b: 'RedBus', d: 'Flat 20% OFF on West Bengal Bus Bookings', c: 'REDBUS20', cat: 'Travel', l: 'https://www.redbus.in', badge: 'Bus', rank: 14 },
  { b: 'Swiggy', d: 'Flat 50% OFF + Instant Delivery on Food & Instamart', c: 'SWIGGY50', cat: 'Food', l: 'https://www.swiggy.com', badge: 'Top Food', rank: 15 },
  { b: 'Zomato', d: '60% OFF up to ₹120 on Online Food Orders', c: 'ZOMATO60', cat: 'Food', l: 'https://www.zomato.com', badge: 'Food', rank: 16 },
  { b: 'Blinkit', d: 'Instant 10-Min Delivery + Flat ₹50 OFF', c: 'BLINKIT50', cat: 'Grocery', l: 'https://blinkit.com', badge: '10 Mins', rank: 17 },
  { b: 'Tata 1mg', d: 'Flat 20% OFF on Prescription Medicines & Health Checkups', c: '1MG20', cat: 'Health', l: 'https://www.1mg.com', badge: 'Medicines', rank: 18 },
  { b: 'Nykaa', d: 'Up to 50% OFF on Top Cosmetics, Skincare & Fragrance', c: 'NYKAA50', cat: 'Beauty', l: 'https://www.nykaa.com', badge: 'Beauty', rank: 19 },
  { b: 'boAt Lifestyle', d: 'Flat 10% OFF on Wireless Earphones & Smartwatches', c: 'BOAT10', cat: 'Electronics', l: 'https://www.boat-lifestyle.com', badge: 'Audio', rank: 20 }
];

async function syncOffers() {
  console.log('=== Starting Cuelinks Live Offers Synchronization ===');
  console.log('Channel ID:', CHANNEL_ID, '| Publisher ID:', PUB_ID);

  let rawOffers = [];
  let page = 1;
  const maxPages = 15; // Up to 1500 offers

  while (page <= maxPages) {
    process.stdout.write(`Fetching page ${page}... `);
    const data = await fetchPage(page);
    if (!data || !data.offers || data.offers.length === 0) {
      console.log('No more offers.');
      break;
    }
    rawOffers.push(...data.offers);
    console.log(`got ${data.offers.length} offers (total: ${rawOffers.length})`);
    if (data.total_count && rawOffers.length >= data.total_count) break;
    page++;
  }

  console.log(`\nTotal raw offers fetched from Cuelinks: ${rawOffers.length}`);

  // Process and normalize Cuelinks live offers
  const processedCuelinksOffers = [];
  const seenDeals = new Set();

  for (const o of rawOffers) {
    if (o.status && o.status !== 'live') continue;

    const brand = o.campaign || 'Partner Store';
    const cleanTitle = stripHtml(o.title || o.description || '');
    const cleanDesc = stripHtml(o.description || o.title || '');
    const coupon = (o.coupon_code || '').trim() || 'FLAT DEAL';
    const cat = mapCategory(o.categories, cleanTitle, brand);
    const destUrl = o.url || 'https://www.cuelinks.com';

    // Build tracking URL with Channel ID 324245 & SubID ridesathigo
    let affiliateUrl = o.affiliate_url || '';
    if (affiliateUrl) {
      if (!affiliateUrl.includes('cid=')) {
        affiliateUrl += `&cid=${CHANNEL_ID}&subid=${SUB_ID}`;
      }
    } else {
      affiliateUrl = `https://linksredirect.com/?cid=${CHANNEL_ID}&subid=${SUB_ID}&url=${encodeURIComponent(destUrl)}`;
    }

    const dedupeKey = (brand + '_' + coupon + '_' + cleanTitle.substring(0, 30)).toLowerCase();
    if (seenDeals.has(dedupeKey)) continue;
    seenDeals.add(dedupeKey);

    let badge = 'Verified';
    if (coupon !== 'FLAT DEAL') badge = 'Coupon';
    else if (cleanTitle.toLowerCase().includes('% off')) badge = 'Discount';
    else if (cat === 'Travel') badge = 'Travel';
    else if (cat === 'Food') badge = 'Food';

    processedCuelinksOffers.push({
      b: brand,
      d: cleanTitle || cleanDesc || 'Special Discount Deal',
      c: coupon,
      cat: cat,
      l: destUrl,
      aff: affiliateUrl,
      img: o.image_url || '',
      badge: badge,
      rank: coupon !== 'FLAT DEAL' ? 20 : 30
    });
  }

  // Combine Evergreen Top Brands + Fresh Cuelinks Deals
  const finalCatalog = [];

  // Add evergreen brands first with affiliate URLs
  for (const eb of evergreenTopBrands) {
    const aff = `https://linksredirect.com/?cid=${CHANNEL_ID}&subid=${SUB_ID}&url=${encodeURIComponent(eb.l)}`;
    finalCatalog.push({
      ...eb,
      aff: aff
    });
  }

  // Add Cuelinks live offers sorted by presence of coupon code
  processedCuelinksOffers.sort((a, b) => {
    if (a.c !== 'FLAT DEAL' && b.c === 'FLAT DEAL') return -1;
    if (a.c === 'FLAT DEAL' && b.c !== 'FLAT DEAL') return 1;
    return 0;
  });

  // Include top 250 best live offers to keep file size compact and lightning-fast
  finalCatalog.push(...processedCuelinksOffers.slice(0, 250));

  console.log(`Final curated offers count: ${finalCatalog.length}`);

  const outputData = {
    updated_at: new Date().toISOString(),
    channel_id: CHANNEL_ID,
    publisher_id: PUB_ID,
    total_offers: finalCatalog.length,
    offers: finalCatalog
  };

  const jsonStr = JSON.stringify(outputData, null, 2);

  // Write to root offers.json and public/offers.json
  const rootPath = path.join(__dirname, 'offers.json');
  fs.writeFileSync(rootPath, jsonStr, 'utf8');
  console.log(`Saved -> ${rootPath}`);

  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'offers.json');
    fs.writeFileSync(publicPath, jsonStr, 'utf8');
    console.log(`Saved -> ${publicPath}`);
  }

  console.log('=== Offers Synchronization Completed Successfully! ===');
}

syncOffers().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
