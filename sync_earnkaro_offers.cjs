/**
 * RIDE SATHI GO - EarnKaro Automated Offers & Deals Engine
 * Partner Account: support.ridesathi@gmail.com | Mobile: +91 8768447312
 * EarnKaro Publisher ID: 1621383
 * Verified Profit Links:
 *  - Flipkart: https://fktr.in/2Plll5H
 *  - Ajio: https://ajiio.in/mVjMdFC
 *  - Myntra: https://myntr.it/Iw5sddw
 *  - JioMart: https://bitli.in/MEtejet
 */

const fs = require('fs');
const path = require('path');

const PUBLISHER_ID = '1621383';
const FLIPKART_AFF = 'https://fktr.in/2Plll5H';
const AJIO_AFF = 'https://ajiio.in/mVjMdFC';
const MYNTRA_AFF = 'https://myntr.it/Iw5sddw';
const JIOMART_AFF = 'https://bitli.in/MEtejet';

const earnkaroCatalog = [
  // 🛍️ Verified High-Converting Stores (100% Tracking with Partner ID 1621383)
  { b: 'Flipkart', d: 'Big Saving Days: Up to 80% OFF on Mobiles & Appliances', c: 'FLIP50', cat: 'Shopping', l: 'https://www.flipkart.com', aff: FLIPKART_AFF, badge: 'Top Deal', profit: 'Up to 10% Profit', rank: 1 },
  { b: 'Myntra', d: 'Flat 30% to 70% OFF on Branded Clothing & Footwear', c: 'MYNTRA30', cat: 'Shopping', l: 'https://www.myntra.com', aff: MYNTRA_AFF, badge: 'Fashion', profit: 'Flat 8.5% Profit', rank: 2 },
  { b: 'Ajio', d: 'Min 50-70% OFF on Trends & Exclusive Fashion Brands', c: 'AJIO50', cat: 'Shopping', l: 'https://www.ajio.com', aff: AJIO_AFF, badge: 'Hot', profit: 'Up to 9% Profit', rank: 3 },
  { b: 'JioMart', d: 'Smart Superstore: Extra Discount on Groceries, Essentials & Electronics', c: 'JIOMART', cat: 'Grocery', l: 'https://www.jiomart.com', aff: JIOMART_AFF, badge: 'Grocery', profit: 'Instant Profit', rank: 4 },
  { b: 'Shopsy by Flipkart', d: 'Budget Shopping Under ₹99: Clothes, Footwear & Accessories', c: 'SHOPSY20', cat: 'Shopping', l: 'https://www.shopsy.in', aff: FLIPKART_AFF, badge: 'Super Saver', profit: 'Flat 10% Profit', rank: 5 },

  // 📱 Mobile Recharge, DTH & Utility Bills
  { b: 'Jio Recharge', d: 'Up to ₹50 Cashback on Jio Unlimited 5G & Data Packs', c: 'JIO50', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', aff: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', profit: 'Up to ₹50 Profit', rank: 6 },
  { b: 'Airtel Recharge', d: 'Flat ₹40 Cashback on Airtel 1.5GB/2GB Daily Plans', c: 'AIRTEL40', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', aff: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', profit: 'Flat ₹40 Profit', rank: 7 },
  { b: 'Vi Recharge', d: 'Hero Unlimited Midnight Data Plans + Flat ₹30 Cashback', c: 'VI30', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', aff: 'https://www.amazon.in/hpc/recharge', badge: 'Prepaid', profit: 'Flat ₹30 Profit', rank: 8 },
  { b: 'BSNL Mobile', d: 'Affordable 3G/4G Validity Plans + Extra Discount', c: 'BSNL20', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', aff: 'https://www.amazon.in/hpc/recharge', badge: 'Validity', profit: 'Extra Cashback', rank: 9 },
  { b: 'WBSEDCL Electricity', d: 'পশ্চিমবঙ্গ বিদ্যুৎ বিল পেমেন্টে পান নিশ্চিত ক্যাশব্যাক ও ছাড়', c: 'BILL50', cat: 'Recharge', l: 'https://www.amazon.in/b?node=14322429031', aff: 'https://www.amazon.in/b?node=14322429031', badge: 'WB Bill', profit: 'Up to ₹50 Profit', rank: 10 },
  { b: 'DTH Recharge', d: 'Tata Play, Airtel DTH, Dish TV রিচার্জে ক্যাশব্যাক ও ছাড়', c: 'DTHSAVE', cat: 'Recharge', l: 'https://www.amazon.in/b?node=14322430031', aff: 'https://www.amazon.in/b?node=14322430031', badge: 'DTH', profit: 'Best Cashback', rank: 11 },
  { b: 'Fastag Recharge', d: 'Paytm, SBI, ICICI ও সকল ব্যাংকের Fastag রিচার্জ ক্যাশব্যাক', c: 'FASTAG10', cat: 'Recharge', l: 'https://www.amazon.in/b?node=21488168031', aff: 'https://www.amazon.in/b?node=21488168031', badge: 'Fastag', profit: 'Instant Credit', rank: 12 },
  { b: 'Amazon Pay Bills', d: 'All Mobile Recharge, DTH & Utility Bill Payment Hub', c: 'AMZPAY', cat: 'Recharge', l: 'https://www.amazon.in/hpc/recharge', aff: 'https://www.amazon.in/hpc/recharge', badge: 'All in One', profit: 'High Cashback', rank: 13 },

  // 🛍️ Other Shopping
  { b: 'Amazon India', d: 'Up to 80% OFF on Mobiles, Fashion, Kitchen & Electronics', c: 'AMZ80', cat: 'Shopping', l: 'https://www.amazon.in', aff: 'https://www.amazon.in', badge: 'Trending', profit: 'Up to 8.5% Profit', rank: 14 },
  { b: 'Meesho', d: 'Extra 15% OFF on Budget Fashion, Home Essentials & Daily Needs', c: 'MEESHO15', cat: 'Shopping', l: 'https://www.meesho.com', aff: 'https://www.meesho.com', badge: 'Budget', profit: 'Up to 15% Profit', rank: 15 },
  { b: 'Tata CLiQ', d: 'Up to 60% OFF on Luxury Fashion, Tech & Accessories', c: 'TATACLIQ', cat: 'Shopping', l: 'https://www.tatacliq.com', aff: 'https://www.tatacliq.com', badge: 'Luxury', profit: 'Up to 6% Profit', rank: 16 },

  // 🧳 Travel & Bus Booking
  { b: 'MakeMyTrip', d: 'Flat ₹2,000 OFF on Domestic Flights & Hotel Bookings', c: 'MMT2000', cat: 'Travel', l: 'https://www.makemytrip.com', aff: 'https://www.makemytrip.com', badge: 'Flight/Hotel', profit: 'Up to ₹200 Profit', rank: 17 },
  { b: 'RedBus', d: 'Flat 20% OFF on West Bengal & Interstate Bus Bookings', c: 'REDBUS20', cat: 'Travel', l: 'https://www.redbus.in', aff: 'https://www.redbus.in', badge: 'Bus', profit: 'Flat ₹40 Profit', rank: 18 },
  { b: 'Goibibo', d: 'Flat 12% OFF on Hotels, Bus & Train Ticket Reservations', c: 'GOIBIBO12', cat: 'Travel', l: 'https://www.goibibo.com', aff: 'https://www.goibibo.com', badge: 'Travel', profit: 'Up to ₹150 Profit', rank: 19 },
  { b: 'OYO Rooms', d: 'Up to 45% OFF on Verified Hotel & Homestay Bookings', c: 'OYO45', cat: 'Travel', l: 'https://www.oyorooms.com', aff: 'https://www.oyorooms.com', badge: 'Stay', profit: 'Flat 10% Profit', rank: 20 },
  { b: 'EaseMyTrip', d: 'Zero Convenience Fee on Flight & Train Ticket Bookings', c: 'EMTZERO', cat: 'Travel', l: 'https://www.easemytrip.com', aff: 'https://www.easemytrip.com', badge: '0 Fee', profit: 'Up to ₹100 Profit', rank: 21 },
  { b: 'AbhiBus', d: 'Flat ₹150 OFF on Online Bus Ticket Reservations', c: 'ABHIBUS150', cat: 'Travel', l: 'https://www.abhibus.com', aff: 'https://www.abhibus.com', badge: 'Bus', profit: 'Flat ₹35 Profit', rank: 22 },

  // 🍔 Food & Dining
  { b: 'Swiggy', d: 'Flat 50% OFF + Instant Delivery on Food & Instamart', c: 'SWIGGY50', cat: 'Food', l: 'https://www.swiggy.com', aff: 'https://www.swiggy.com', badge: 'Top Food', profit: 'Up to ₹50 Profit', rank: 23 },
  { b: 'Zomato', d: '60% OFF up to ₹120 on Online Food Orders', c: 'ZOMATO60', cat: 'Food', l: 'https://www.zomato.com', aff: 'https://www.zomato.com', badge: 'Food', profit: 'Best Savings', rank: 24 },
  { b: "Domino's Pizza", d: 'Flat ₹100 OFF on Orders above ₹399', c: 'DOMINOS100', cat: 'Food', l: 'https://www.dominos.co.in', aff: 'https://www.dominos.co.in', badge: 'Pizza', profit: 'Flat ₹30 Profit', rank: 25 },
  { b: 'KFC India', d: 'Flat ₹100 OFF on ₹499+ Hot & Crispy Chicken Buckets', c: 'KFCSAVE', cat: 'Food', l: 'https://online.kfc.co.in', aff: 'https://online.kfc.co.in', badge: 'Fast Food', profit: 'Exclusive Deal', rank: 26 },
  { b: 'Pizza Hut', d: 'Up to 50% OFF on Tasty Pan Pizzas & Meals', c: 'HUT50', cat: 'Food', l: 'https://www.pizzahut.co.in', aff: 'https://www.pizzahut.co.in', badge: 'Pizza', profit: 'Flat ₹25 Profit', rank: 27 },

  // 🛒 Grocery & Quick Delivery
  { b: 'Blinkit', d: 'Instant 10-Minute Grocery Delivery + Flat ₹50 OFF', c: 'BLINKIT50', cat: 'Grocery', l: 'https://blinkit.com', aff: 'https://blinkit.com', badge: '10 Mins', profit: 'Instant Delivery', rank: 28 },
  { b: 'Zepto', d: 'Flat 20% OFF on Fresh Vegetables, Fruits & Groceries', c: 'ZEPTO20', cat: 'Grocery', l: 'https://www.zeptonow.com', aff: 'https://www.zeptonow.com', badge: 'Instant', profit: 'Flat ₹40 Profit', rank: 29 },
  { b: 'BigBasket', d: 'Up to 40% OFF on Monthly Ration, Rice, Oil & Spices', c: 'BB40', cat: 'Grocery', l: 'https://www.bigbasket.com', aff: JIOMART_AFF, badge: 'Supermarket', profit: 'Up to 5% Profit', rank: 30 },

  // ⚡ Electronics & Gadgets
  { b: 'boAt Lifestyle', d: 'Flat 10% OFF on Wireless Earphones, Airdopes & Speakers', c: 'BOAT10', cat: 'Electronics', l: 'https://www.boat-lifestyle.com', aff: 'https://www.boat-lifestyle.com', badge: 'Audio', profit: 'Flat 8% Profit', rank: 31 },
  { b: 'Noise', d: 'Flat ₹200 OFF on ColorFit Smartwatches & Earbuds', c: 'NOISE200', cat: 'Electronics', l: 'https://www.gonoise.com', aff: 'https://www.gonoise.com', badge: 'Gadgets', profit: 'Flat 7.5% Profit', rank: 32 },
  { b: 'Croma', d: 'Up to ₹5,000 Instant Bank Discount on Laptops, TVs & ACs', c: 'CROMA5000', cat: 'Electronics', l: 'https://www.croma.com', aff: 'https://www.croma.com', badge: 'Electronics', profit: 'Up to 2.5% Profit', rank: 33 },
  { b: 'Reliance Digital', d: 'Instant 10% OFF on Smart Mobiles & Appliances', c: 'RELIANCE10', cat: 'Electronics', l: 'https://www.reliancedigital.in', aff: 'https://www.reliancedigital.in', badge: 'Tech', profit: 'Top Bank Offers', rank: 34 },
  { b: 'Fire-Boltt', d: 'Flat 10% OFF on Bluetooth Calling Smartwatches', c: 'BOLTT10', cat: 'Electronics', l: 'https://www.fireboltt.com', aff: 'https://www.fireboltt.com', badge: 'Smartwatch', profit: 'Flat 7% Profit', rank: 35 },

  // 💊 Health & Pharmacy
  { b: 'Tata 1mg', d: 'Flat 20% OFF on Genuine Prescription Medicines & Lab Tests', c: '1MG20', cat: 'Health', l: 'https://www.1mg.com', aff: 'https://www.1mg.com', badge: 'Medicines', profit: 'Up to 12% Profit', rank: 36 },
  { b: 'Apollo 24|7', d: 'Flat 25% OFF on Online Medicines with 2-Hour Delivery', c: 'APOLLO25', cat: 'Health', l: 'https://www.apollo247.com', aff: 'https://www.apollo247.com', badge: 'Doctor/Meds', profit: 'Up to 10% Profit', rank: 37 },
  { b: 'Netmeds', d: 'Flat 20% OFF + 10% NMS SuperCash on Health Essentials', c: 'NETMEDS20', cat: 'Health', l: 'https://www.netmeds.com', aff: 'https://www.netmeds.com', badge: 'Pharmacy', profit: 'Flat 8% Profit', rank: 38 },
  { b: 'PharmEasy', d: 'Flat 22% OFF on Medicine Orders with Free Delivery', c: 'PHARM22', cat: 'Health', l: 'https://pharmeasy.in', aff: 'https://pharmeasy.in', badge: 'Health', profit: 'Up to 9% Profit', rank: 39 },

  // ✨ Beauty & Care
  { b: 'Nykaa', d: 'Up to 50% OFF on Top Cosmetics, Skincare & Fragrance', c: 'NYKAA50', cat: 'Beauty', l: 'https://www.nykaa.com', aff: 'https://www.nykaa.com', badge: 'Beauty', profit: 'Flat 8% Profit', rank: 40 },
  { b: 'Mamaearth', d: 'Flat 20% OFF on Natural Toxin-Free Skincare & Babycare', c: 'MAMA20', cat: 'Beauty', l: 'https://mamaearth.in', aff: 'https://mamaearth.in', badge: 'Skincare', profit: 'Flat 12% Profit', rank: 41 },
  { b: 'Purplle', d: 'Flat ₹100 OFF on Makeup, Lipsticks & Hair Essentials', c: 'PURPLLE100', cat: 'Beauty', l: 'https://www.purplle.com', aff: 'https://www.purplle.com', badge: 'Cosmetics', profit: 'Up to 10% Profit', rank: 42 },
  { b: 'WOW Skin Science', d: 'Flat 20% OFF on Apple Cider Vinegar Shampoo & Care', c: 'WOW20', cat: 'Beauty', l: 'https://www.buywow.in', aff: 'https://www.buywow.in', badge: 'Organic', profit: 'Flat 15% Profit', rank: 43 }
];

function syncOffers() {
  console.log('=== Building EarnKaro Verified Offers Feed ===');
  console.log('Publisher ID:', PUBLISHER_ID);
  console.log('Partner Account: support.ridesathi@gmail.com | Mobile: +91 8768447312');
  console.log('Verified Profit Links:');
  console.log(' - Flipkart:', FLIPKART_AFF);
  console.log(' - Ajio:', AJIO_AFF);
  console.log(' - Myntra:', MYNTRA_AFF);
  console.log(' - JioMart:', JIOMART_AFF);

  const outputData = {
    updated_at: new Date().toISOString(),
    platform: 'EarnKaro',
    publisher_id: PUBLISHER_ID,
    partner_account: 'support.ridesathi@gmail.com',
    partner_mobile: '8768447312',
    verified_links: {
      flipkart: FLIPKART_AFF,
      ajio: AJIO_AFF,
      myntra: MYNTRA_AFF,
      jiomart: JIOMART_AFF
    },
    total_offers: earnkaroCatalog.length,
    offers: earnkaroCatalog
  };

  const jsonStr = JSON.stringify(outputData, null, 2);

  const rootPath = path.join(__dirname, 'offers.json');
  fs.writeFileSync(rootPath, jsonStr, 'utf8');
  console.log(`Saved -> ${rootPath}`);

  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'offers.json');
    fs.writeFileSync(publicPath, jsonStr, 'utf8');
    console.log(`Saved -> ${publicPath}`);
  }

  console.log('=== EarnKaro Offers Feed Generated Successfully! ===');
}

syncOffers();
