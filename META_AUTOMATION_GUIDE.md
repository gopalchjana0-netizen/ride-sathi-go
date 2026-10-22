# 🚀 RIDE SATHI — Meta (Facebook & Instagram) Automation Setup Guide

এই গাইডের মাধ্যমে আপনি খুব সহজে আপনার **Ride Sathi Facebook Page** এবং **Instagram Business Account**-এ প্রতিদিন অটোমেটিক পোস্ট এবং কাস্টমারদের কমেন্টে স্বয়ংক্রিয় রিপ্লাই (Auto-Reply) চালু করতে পারবেন।

---

## 📋 প্রজেক্টের বট ফাইলসমূহ:
- **বট স্ক্রিপ্ট:** `social_bot/meta_bot.cjs`
- **কনফিগ ফাইল:** `social_bot/.env` (তৈরি করতে হবে)
- **নমুনা কনফিগ:** `social_bot/.env.example`

---

## 🔑 ধাপ ১: মেটা ডেভেলপার অ্যাকাউন্ট ও টোকেন সংগ্রহ (Meta API Keys)

১. [Meta for Developers (developers.facebook.com)](https://developers.facebook.com/) এ যান এবং আপনার ফেসবুক আইডি দিয়ে লগইন করুন।  
২. **My Apps** > **Create App** এ ক্লিক করে **Business** বা **Other** টাইপ সিলেক্ট করুন।  
৩. আপনার অ্যাপের ভেতরে **Graph API Explorer** টুল ওপেন করুন।  
৪. নিম্নলিখিত পারমিশনগুলো (Permissions) যুক্ত করুন:
   - `pages_manage_posts` (পেজে স্বয়ংক্রিয় পোস্ট করার জন্য)
   - `pages_read_engagement` (কমেন্ট পড়ার জন্য)
   - `pages_manage_engagement` (কমেন্টে স্বয়ংক্রিয় রিপ্লাই দেওয়ার জন্য)
   - `instagram_basic` এবং `instagram_content_publish` (ইনস্টাগ্রাম পোস্টের জন্য)
৫. **Generate Access Token** ক্লিক করুন এবং এটিকে **Page Access Token (Never Expire / Long-Lived Token)** হিসেবে রূপান্তর করুন।  
৬. আপনার ফেসবুক পেজের **Page ID** এবং ইনস্টাগ্রাম বিজনেস অ্যাকাউন্টের **Account ID** কপি করুন।

---

## ⚙️ ধাপ ২: `.env` ফাইল কনফিগারেশন

`social_bot/` ফোল্ডারের ভেতরে `.env` নামে একটি ফাইল তৈরি করুন এবং নিচের মতো মানগুলো বসান:

```env
META_PAGE_ID=আপনার_ফেসবুক_পেজ_আইডি
META_PAGE_ACCESS_TOKEN=আপনার_পেজ_এক্সেস_টোকেন
META_INSTAGRAM_ACCOUNT_ID=আপনার_ইনস্টাগ্রাম_আইডি
RIDE_SATHI_WEB_URL=https://ride-sathi-go.web.app
RIDE_SATHI_DOWNLOAD_URL=https://ride-sathi-go.web.app/download.html
```

---

## 🧪 ধাপ ৩: টেস্ট রান (Dry Run / Mock Mode)

কোনো কি (Key) না বসিয়েও আপনি টেস্ট করতে পারেন এটি কীভাবে কাজ করবে:
```bash
node social_bot/meta_bot.cjs --test
```
এটি কনসোলে ড্রিম রান চালিয়ে দেখাবে ফেসবুক ও ইনস্টাগ্রামে কী টেক্সট যাবে।

---

## 🤖 ধাপ ৪: কী কী অটোমেটিক কাজ করবে?

### ১. স্মার্ট কমেন্ট রিপ্লাই (Smart Comment Auto-Reply):
- **ডাউনলোড বা অ্যাপ সম্পর্কিত কমেন্ট:** ("link", "app", "download", "apk", "লিংক", "অ্যাপ")  
  👉 রিপ্লাই: `🚖 রাইড সাথী অ্যাপ ডাউনলোড করতে এখনই ভিজিট করুন: https://ride-sathi-go.web.app/download.html`
- **ড্রাইভার হওয়া সম্পর্কিত কমেন্ট:** ("driver", "rider", "join", "bike", "toto", "আয়", "ড্রাইভার")  
  👉 রিপ্লাই: `🛵 আপনি কি রাইড সাথীতে ড্রাইভার বা রাইডার হিসেবে যুক্ত হতে চান? কোনো কমিশন ছাড়া সরাসরি ড্রাইভার অ্যাপ ডাউনলোড করে এখনই রেজিস্টার করুন!`
- **ভাড়া সম্পর্কিত কমেন্ট:** ("vara", "bhara", "fare", "rate", "ভাড়া", "টাকা")  
  👉 রিপ্লাই: `💰 রাইড সাথী দিচ্ছে সবচেয়ে সাশ্রয়ী ও সঠিক ভাড়ায় যাতায়াতের নিশ্চয়তা। পিক-আওয়ারেও কোনো অতিরিক্ত চার্জ নেই!`

### ২. দৈনিক সকাল ৬:০০ টার শিডিউলড পোস্ট:
বটটি চালু থাকলে প্রতিদিন সকাল ৬:০০ টায় স্বয়ংক্রিয়ভাবে আকর্ষণীয় ক্যাপশন সহ ফেসবুক পেজ ও ইনস্টাগ্রামে পোস্ট পাবলিশ করবে।

---

## 💻 ধাপ ৫: ব্যাকগ্রাউন্ডে সবসময় চালু রাখার উপায় (PM2 দিয়ে)

বটটি আপনার সার্ভার বা পিসিতে সবসময় ব্যাকগ্রাউন্ডে চালু রাখতে:
```bash
npm install -g pm2
pm2 start social_bot/meta_bot.cjs --name "ride-sathi-bot"
pm2 save
```
বটের স্ট্যাটাস দেখতে: `pm2 status` বা `pm2 logs ride-sathi-bot`
