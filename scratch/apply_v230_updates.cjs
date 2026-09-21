const fs = require('fs');
const path = require('path');

const repoDir = 'C:\\Users\\DELL\\OneDrive\\Desktop\\RIDE-SATHI';

// 1. UPDATE DOWNLOAD.HTML (both public/download.html and download.html)
function updateDownloadHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure all card QR codes point to https://ride-sathi-go.web.app/download.html
  content = content.replace(
    /https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=200x200&data=https:\/\/github\.com\/[^"]+/g,
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html'
  );

  // Update card QR text in HTML
  content = content.replace(
    /📱 QR Scan করে ডাউনলোড করুন/g,
    '📱 QR Scan করে ডাউনলোড পেজ খুলুন'
  );

  // In JavaScript updateLinks():
  content = content.replace(
    /if \(qrImg\) qrImg\.src = `https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=200x200&data=\$\{app\.apkUrl\}`;/g,
    'if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html`;'
  );
  content = content.replace(
    /if \(qrText\) qrText\.textContent = '📱 QR Scan করে APK ডাউনলোড';/g,
    "if (qrText) qrText.textContent = '📱 QR Scan করে ডাউনলোড পেজ খুলুন';"
  );

  // Add top hero QR code if not already present
  if (!content.includes('id="portalQrHero"')) {
    const heroQrHtml = `<!-- MAIN QR CODE HERO: SCAN TO OPEN ON MOBILE -->
<div id="portalQrHero" style="max-width:1100px;margin:0 auto 20px;background:#18181b;border:1px solid #27272a;border-radius:18px;padding:18px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:20px;text-align:center">
  <div style="background:#fff;padding:8px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.5);width:166px;height:166px;display:flex;align-items:center;justify-content:center">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html" alt="Download Portal QR" style="width:150px;height:150px;border-radius:6px">
  </div>
  <div style="text-align:left;max-width:550px">
    <h3 style="color:#FFD600;font-size:18px;margin-bottom:6px">📱 মোবাইল থেকে স্ক্যান করে খুলুন / Scan to Open Download Page</h3>
    <p style="font-size:13px;color:#e4e4e7;line-height:1.6;margin-bottom:8px">যেকোনো স্মার্টফোনের ক্যামেরা বা QR স্ক্যানার দিয়ে স্ক্যান করলেই সরাসরি এই পেজটি ফোনে খুলে যাবে:</p>
    <a href="https://ride-sathi-go.web.app/download.html" style="color:#38bdf8;font-size:13px;word-break:break-all;font-weight:700">https://ride-sathi-go.web.app/download.html</a>
  </div>
</div>
`;
    content = content.replace(
      '<!-- MOBILE DOWNLOAD HELPER NOTICE -->',
      heroQrHtml + '\n<!-- MOBILE DOWNLOAD HELPER NOTICE -->'
    );
  }

  // Ensure all apk download buttons point to https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/
  content = content.replace(
    /https:\/\/github\.com\/gopalchjana0-netizen\/ride-sathi-go\/releases\/download\/v[0-9.]+\//g,
    'https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + filePath);
}

// 2. UPDATE ADMIN.HTML (both public/admin.html and admin.html)
function updateAdminHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace App Hub header button
  content = content.replace(
    /<a href="download\.html" target="_blank" rel="noopener" class="btn purple"[^>]*>[\s\S]*?Open APKs Hub \(download\.html\)[\s\S]*?<\/a>/,
    `<a href="/download.html" target="_blank" rel="noopener" class="btn purple" style="padding:10px 18px;font-size:13px;font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
        Go to Download Page -&gt; /download.html
      </a>`
  );

  // Replace all APK download href with latest release link:
  // https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/
  content = content.replace(
    /https:\/\/github\.com\/gopalchjana0-netizen\/ride-sathi-go\/releases\/download\/v2\.3\.0\/RideSathi-Customer-v2\.3\.0\.apk/g,
    'https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/RideSathi-Customer-v2.3.0.apk'
  );
  content = content.replace(
    /https:\/\/github\.com\/gopalchjana0-netizen\/ride-sathi-go\/releases\/download\/v2\.3\.0\/RideSathi-Driver-v2\.3\.0\.apk/g,
    'https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/RideSathi-Driver-v2.3.0.apk'
  );
  content = content.replace(
    /https:\/\/github\.com\/gopalchjana0-netizen\/ride-sathi-go\/releases\/download\/v2\.3\.0\/RideSathi-Driver-Registration-v2\.3\.0\.apk/g,
    'https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/RideSathi-Driver-Registration-v2.3.0.apk'
  );
  content = content.replace(
    /https:\/\/github\.com\/gopalchjana0-netizen\/ride-sathi-go\/releases\/download\/v2\.3\.0\/RideSathi-Admin-v2\.3\.0\.apk/g,
    'https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/RideSathi-Admin-v2.3.0.apk'
  );

  // Update card buttons in App Hub to include "Go to Download Page -> /download.html"
  // Check if cards already have the Go to Download Page button
  ['Customer', 'Driver', 'Driver-Registration', 'Admin'].forEach(role => {
    const marker = `data-download-page-btn="${role}"`;
    if (!content.includes(marker)) {
      // Find the card container and add the button
      const targetRegex = new RegExp(`(<button class="btn blue" style="padding:8px;font-size:11px" onclick="copyAppUrl\\('[^']*${role}[^']*'\\)">[\\s\\S]*?<\\/button>)`);
      content = content.replace(targetRegex, `$1\n          <a href="/download.html" target="_blank" ${marker} class="btn purple" style="padding:8px;font-size:11px;font-weight:bold;text-decoration:none;margin-top:2px">Go to Download Page -&gt; /download.html</a>`);
    }
  });

  // Update App Hub QR codes to point to https://ride-sathi-go.web.app/download.html
  content = content.replace(
    /https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=200x200&data=https:\/\/github\.com\/[^"]+/g,
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + filePath);
}

// 3. UPDATE DRIVER-REGISTRATION.HTML (both public/driver-registration.html and driver-registration.html)
function updateDriverRegHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure direct APK link to Driver APK v2.3.0
  content = content.replace(
    /id="btn_driver_app" href="[^"]*"/,
    'id="btn_driver_app" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/RideSathi-Driver-v2.3.0.apk"'
  );
  content = content.replace(
    />📥 Download Driver v2[^<]*</,
    '>📥 Direct Download Driver APK v2.3.0<'
  );

  // QR Code points to https://ride-sathi-go.web.app/download.html
  content = content.replace(
    /id="qr_driver_app" alt="Driver App QR" src="[^"]*"/,
    'id="qr_driver_app" alt="Driver App QR" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html"'
  );
  content = content.replace(
    /📱 QR Scan করে ড্রাইভার [^<]*অ্যাপ ইনস্টল করুন/,
    '📱 QR Scan করে ডাউনলোড পেজ খুলুন / অ্যাপ ইনস্টল করুন'
  );

  // Add / replace download page button: "Go to Download Page -> /download.html"
  if (!content.includes('id="btn_to_download_portal"')) {
    content = content.replace(
      /<a class="btn" id="btn_driver_app"[^>]*>[\s\S]*?<\/a>/,
      `<a class="btn" id="btn_driver_app" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/RideSathi-Driver-v2.3.0.apk" download style="display:block;text-align:center;text-decoration:none;box-sizing:border-box">📥 Direct Download Driver APK v2.3.0</a>
<a class="btn" id="btn_to_download_portal" href="/download.html" style="display:block;text-align:center;text-decoration:none;box-sizing:border-box;background:#0284c7;color:#fff;margin-top:10px">Go to Download Page -&gt; /download.html</a>`
    );
  }

  // Footer link to download page
  content = content.replace(
    /<a href="download\.html"[^>]*>[\s\S]*?<\/a>/g,
    '<a href="/download.html" style="font-size:12px;color:#0284c7;text-decoration:none;font-weight:700">Go to Download Page -&gt; /download.html</a>'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + filePath);
}

// 4. ALSO UPDATE DRIVER.HTML (both public/driver.html and driver.html)
function updateDriverHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Direct APK link
  content = content.replace(
    /id="btn_driver_pending" href="[^"]*"/,
    'id="btn_driver_pending" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/RideSathi-Driver-v2.3.0.apk"'
  );
  content = content.replace(
    />📥 Download Driver v2 APK</,
    '>📥 Direct Download Driver APK v2.3.0<'
  );

  // QR Code points to https://ride-sathi-go.web.app/download.html
  content = content.replace(
    /id="qr_driver_pending" alt="Driver App QR" src="[^"]*"/,
    'id="qr_driver_pending" alt="Driver App QR" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ride-sathi-go.web.app/download.html"'
  );
  content = content.replace(
    /📱 QR Scan করে ড্রাইভার [^<]*অ্যাপ ডাউনলোড করুন/,
    '📱 QR Scan করে ডাউনলোড পেজ খুলুন'
  );

  if (!content.includes('id="btn_driver_pending_portal"')) {
    content = content.replace(
      /<a id="btn_driver_pending"[^>]*>[\s\S]*?<\/a>/,
      `<a id="btn_driver_pending" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/RideSathi-Driver-v2.3.0.apk" download style="display:block;padding:12px;background:#16a34a;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;margin-bottom:10px">📥 Direct Download Driver APK v2.3.0</a>
    <a id="btn_driver_pending_portal" href="/download.html" style="display:block;padding:12px;background:#0284c7;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;margin-bottom:10px">Go to Download Page -&gt; /download.html</a>`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + filePath);
}

// EXECUTE
updateDownloadHtml(path.join(repoDir, 'public', 'download.html'));
updateDownloadHtml(path.join(repoDir, 'download.html'));

updateAdminHtml(path.join(repoDir, 'public', 'admin.html'));
updateAdminHtml(path.join(repoDir, 'admin.html'));

updateDriverRegHtml(path.join(repoDir, 'public', 'driver-registration.html'));
updateDriverRegHtml(path.join(repoDir, 'driver-registration.html'));

updateDriverHtml(path.join(repoDir, 'public', 'driver.html'));
updateDriverHtml(path.join(repoDir, 'driver.html'));

console.log('All link and QR updates successfully applied!');
