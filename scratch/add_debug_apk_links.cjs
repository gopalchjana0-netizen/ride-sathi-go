const fs = require('fs');
const path = require('path');

const repoDir = 'C:\\Users\\DELL\\OneDrive\\Desktop\\RIDE-SATHI';

function updateDownload(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('id="directMasterApkBox"')) {
    const masterApkBox = `<!-- DIRECT MASTER APK DOWNLOAD BUTTON -->
<div id="directMasterApkBox" style="max-width:1100px;margin:0 auto 20px;text-align:center;background:#18181b;border:1px solid #3b82f6;border-radius:16px;padding:16px">
  <p style="color:#93c5fd;font-size:13px;margin-bottom:10px;font-weight:600">⚡ Newly Compiled Native Build (Java 21 LTS - Fixed Crash & New Icons)</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
    <a class="btn" style="max-width:340px;background:#2563eb;color:#fff;margin:0;padding:12px 18px" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/app-debug.apk" download>📥 Download Fresh Debug APK (app-debug.apk)</a>
    <a class="btn" style="max-width:340px;background:#16a34a;color:#fff;margin:0;padding:12px 18px" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/download/v2.3.0/app-release.apk" download>📥 Download Master Release APK (app-release.apk)</a>
  </div>
</div>
`;
    content = content.replace(
      '<!-- MOBILE DOWNLOAD HELPER NOTICE -->',
      masterApkBox + '\n<!-- MOBILE DOWNLOAD HELPER NOTICE -->'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function updateAdmin(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('id="btnDownloadAppDebug"')) {
    const btnHtml = `<a id="btnDownloadAppDebug" href="https://github.com/gopalchjana0-netizen/ride-sathi-go/releases/latest/download/app-debug.apk" download class="btn approve" style="padding:10px 16px;font-size:13px;font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;gap:6px">📥 Download Fresh app-debug.apk</a>\n        `;
    content = content.replace(
      '<a href="/download.html" target="_blank"',
      btnHtml + '<a href="/download.html" target="_blank"'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

updateDownload(path.join(repoDir, 'public', 'download.html'));
updateDownload(path.join(repoDir, 'download.html'));

updateAdmin(path.join(repoDir, 'public', 'admin.html'));
updateAdmin(path.join(repoDir, 'admin.html'));

console.log('Done updating links in download.html and admin.html');
