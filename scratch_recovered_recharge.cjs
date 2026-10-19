const fs = require('fs');

const modalHtml = `
<!-- RECHARGE & ELECTRIC BILL REQUEST MODAL -->
<div id="rechargeServiceModal" class="modal-overlay" style="z-index:10005" onclick="if(event.target===this)closeRechargeServiceModal()">
  <div class="modal-box" style="text-align:left;max-height:88vh;overflow-y:auto;max-width:480px;width:95%;padding:20px;border-radius:20px;box-shadow:0 20px 45px rgba(0,0,0,0.35);background:#ffffff">
    
    <!-- Modal Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;border-bottom:1px solid #f1f5f9;padding-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <div id="serviceModalIconBox" style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#064e3b,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 4px 12px rgba(5,150,105,0.25)">
          📱
        </div>
        <div>
          <h3 id="serviceModalTitle" style="margin:0;color:#0f172a;font-size:17.5px;font-weight:900">
            মোবাইল রিচার্জ রিকোয়েস্ট
          </h3>
          <p id="serviceModalSub" style="margin:2px 0 0;font-size:12px;color:#64748b">
            অ্যাডমিন সরাসরি রিচার্জ করে WhatsApp-এ কনফার্ম করবেন
          </p>
        </div>
      </div>
      <button type="button" onclick="closeRechargeServiceModal()" style="border:none;background:#f1f5f9;width:34px;height:34px;border-radius:50%;font-size:20px;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;transition:background 0.15s">&times;</button>
    </div>

    <!-- Service Switcher (Pill Tabs) -->
    <div style="display:flex;background:#f1f5f9;padding:4px;border-radius:14px;gap:4px;margin-bottom:16px">
      <button type="button" id="tabBtnRecharge" onclick="switchServiceMode('recharge')" style="flex:1;padding:9px 10px;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;background:#059669;color:#fff;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px">
        📱 মোবাইল রিচার্জ
      </button>
      <button type="button" id="tabBtnBill" onclick="switchServiceMode('bill')" style="flex:1;padding:9px 10px;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;background:transparent;color:#475569;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px">
        ⚡ বিদ্যুৎ বিল (WBSEDCL)
      </button>
    </div>

    <!-- 1. MOBILE RECHARGE FORM -->
    <div id="rechargeFormContainer">
      <!-- Operator Selection -->
      <label style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:8px">
        অপারেটর নির্বাচন করুন (Operator):
      </label>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px" id="operatorGrid">
        <button type="button" class="op-btn active" data-op="Jio" onclick="selectOperator('Jio',this)" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:2px solid #059669;background:#ecfdf5;cursor:pointer;transition:all 0.15s">
          <img src="https://www.google.com/s2/favicons?domain=jio.com&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px">
          <span style="font-size:12px;font-weight:800;color:#064e3b">Jio</span>
        </button>
        <button type="button" class="op-btn" data-op="Airtel" onclick="selectOperator('Airtel',this)" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all 0.15s">
          <img src="https://www.google.com/s2/favicons?domain=airtel.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px">
          <span style="font-size:12px;font-weight:800;color:#334155">Airtel</span>
        </button>
        <button type="button" class="op-btn" data-op="Vi" onclick="selectOperator('Vi',this)" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all 0.15s">
          <img src="https://www.google.com/s2/favicons?domain=myvi.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px">
          <span style="font-size:12px;font-weight:800;color:#334155">Vi</span>
        </button>
        <button type="button" class="op-btn" data-op="BSNL" onclick="selectOperator('BSNL',this)" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all 0.15s">
          <img src="https://www.google.com/s2/favicons?domain=bsnl.co.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px">
          <span style="font-size:12px;font-weight:800;color:#334155">BSNL</span>
        </button>
      </div>

      <!-- Mobile Number -->
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <label for="rcMobileNumber" style="font-size:12.5px;font-weight:800;color:#334155">
            মোবাইল নম্বর (10 Digit Number) <span style="color:#ef4444">*</span>
          </label>
          <span id="rcMobileValidation" style="font-size:11px;font-weight:700;color:#64748b">১০ ডিজিট</span>
        </div>
        <div style="position:relative">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:800;font-size:13.5px;color:#64748b">+91</span>
          <input type="tel" id="rcMobileNumber" maxlength="10" placeholder="১০ সংখ্যার মোবাইল নম্বর লিখুন" oninput="validateRcMobile(this)" style="width:100%;box-sizing:border-box;padding:12px 14px 12px 48px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:14.5px;font-weight:700;letter-spacing:0.5px;background:#f8fafc">
        </div>
      </div>

      <!-- Amount -->
      <div style="margin-bottom:14px">
        <label for="rcAmount" style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:5px">
          রিচার্জের পরিমাণ (Amount in ₹) <span style="color:#ef4444">*</span>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-weight:800;font-size:15px;color:#059669">₹</span>
          <input type="number" id="rcAmount" min="10" placeholder="কত টাকা রিচার্জ করবেন? (যেমন: 239, 299...)" style="width:100%;box-sizing:border-box;padding:12px 14px 12px 32px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:14.5px;font-weight:700;background:#f8fafc">
        </div>
        <!-- Quick Amount Pills -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          <span onclick="setRcAmount(19)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹19 (Data)</span>
          <span onclick="setRcAmount(239)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹239</span>
          <span onclick="setRcAmount(299)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹299</span>
          <span onclick="setRcAmount(349)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹349</span>
          <span onclick="setRcAmount(666)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹666</span>
          <span onclick="setRcAmount(2999)" style="padding:4px 10px;background:#f1f5f9;color:#334155;border-radius:20px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0">₹2999 (1 Year)</span>
        </div>
      </div>

      <!-- Remarks -->
      <div style="margin-bottom:16px">
        <label for="rcRemarks" style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:5px">
          রিমার্কস বা প্ল্যান বিবরণ (Remarks - Optional)
        </label>
        <input type="text" id="rcRemarks" placeholder="যেমন: 1.5GB/day 28 days plan, Unlimited 5G বা কোনো বিশেষ নোট" style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:13px;background:#f8fafc">
      </div>

      <!-- Admin Support Trust Banner -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px 12px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">🛡️</span>
        <div style="font-size:11.5px;color:#166534;line-height:1.4">
          <b>নিরাপদ ও বিশ্বস্ত:</b> সাবমিট করলে সরাসরি অ্যাডমিন (<b>8768447312</b>)-এর কাছে রিকোয়েস্ট যাবে এবং দ্রুত রিচার্জ সম্পন্ন হবে।
        </div>
      </div>

      <!-- Submit Button -->
      <button type="button" onclick="submitRechargeRequest()" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(4,120,87,0.3);display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.1s" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
        <i class="fab fa-whatsapp" style="font-size:19px"></i> <span>রিচার্জ রিকোয়েস্ট পাঠান (WhatsApp)</span>
      </button>
    </div>

    <!-- 2. ELECTRIC BILL FORM -->
    <div id="billFormContainer" style="display:none">
      <!-- Provider / Board -->
      <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
        <img src="https://www.google.com/s2/favicons?domain=wbsedcl.in&sz=128" style="width:30px;height:30px;border-radius:50%;background:#fff;padding:2px">
        <div>
          <div style="font-size:13px;font-weight:800;color:#1e3a8a">WBSEDCL (পশ্চিমবঙ্গ বিদ্যুৎ পর্ষদ)</div>
          <div style="font-size:11px;color:#3b82f6">West Bengal State Electricity Distribution Co. Ltd.</div>
        </div>
      </div>

      <!-- Consumer ID -->
      <div style="margin-bottom:14px">
        <label for="billConsumerId" style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:5px">
          কনজিউমার আইডি (Consumer Number) <span style="color:#ef4444">*</span>
        </label>
        <div style="position:relative">
          <input type="number" id="billConsumerId" placeholder="আপনার ৯ ডিজিটের Consumer ID লিখুন" style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:14.5px;font-weight:700;letter-spacing:0.5px;background:#f8fafc">
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">💡 বিদ্যুৎ বিলের কাগজের উপরে ৯ সংখ্যার Consumer ID দেওয়া থাকে।</div>
      </div>

      <!-- Customer Mobile Number -->
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <label for="billMobileNumber" style="font-size:12.5px;font-weight:800;color:#334155">
            কাস্টমার মোবাইল নম্বর (10 Digit Mobile) <span style="color:#ef4444">*</span>
          </label>
          <span id="billMobileValidation" style="font-size:11px;font-weight:700;color:#64748b">১০ ডিজিট</span>
        </div>
        <div style="position:relative">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:800;font-size:13.5px;color:#64748b">+91</span>
          <input type="tel" id="billMobileNumber" maxlength="10" placeholder="১০ সংখ্যার মোবাইল নম্বর লিখুন" oninput="validateBillMobile(this)" style="width:100%;box-sizing:border-box;padding:12px 14px 12px 48px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:14.5px;font-weight:700;letter-spacing:0.5px;background:#f8fafc">
        </div>
      </div>

      <!-- Bill Amount -->
      <div style="margin-bottom:14px">
        <label for="billAmount" style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:5px">
          বিলের মোট টাকা (Bill Amount in ₹) <span style="color:#ef4444">*</span>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-weight:800;font-size:15px;color:#2563eb">₹</span>
          <input type="number" id="billAmount" min="50" placeholder="বিলের মোট পরিমাণ লিখুন" style="width:100%;box-sizing:border-box;padding:12px 14px 12px 32px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:14.5px;font-weight:700;background:#f8fafc">
        </div>
      </div>

      <!-- Remarks / Consumer Name -->
      <div style="margin-bottom:16px">
        <label for="billRemarks" style="display:block;font-size:12.5px;font-weight:800;color:#334155;margin-bottom:5px">
          কনজিউমার নাম বা রিমার্কস (Remarks - Optional)
        </label>
        <input type="text" id="billRemarks" placeholder="যেমন: রমেশ পাত্র (Quarter 1 Bill) বা কোনো নোট" style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:12px;border:1.5px solid #cbd5e1;font-size:13px;background:#f8fafc">
      </div>

      <!-- Bill Pay Trust Banner -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px 12px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">🧾</span>
        <div style="font-size:11.5px;color:#166534;line-height:1.4">
          <b>রিসিট গ্যারান্টি:</b> অ্যাডমিন (<b>8768447312</b>) বিল পেমেন্ট করে সরাসরি WhatsApp-এ অফিসিয়াল পেমেন্ট রিসিট পাঠিয়ে দেবেন।
        </div>
      </div>

      <!-- Submit Button -->
      <button type="button" onclick="submitElectricBillRequest()" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.3);display:flex;align-items:center;justify-content:center;gap:8px;transition:transform 0.1s" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
        <i class="fab fa-whatsapp" style="font-size:19px"></i> <span>বিদ্যুৎ বিল রিকোয়েস্ট পাঠান (WhatsApp)</span>
      </button>
    </div>

  </div>
</div>

<script>
let currentSelectedOperator = 'Jio';

window.openRechargeModal = function(op) {
  var modal = document.getElementById('rechargeServiceModal');
  if (!modal) return;
  switchServiceMode('recharge');
  if (op) {
    var matchOp = 'Jio';
    var lower = (op || '').toLowerCase();
    if (lower.includes('airtel')) matchOp = 'Airtel';
    else if (lower.includes('vi') || lower.includes('vodafone') || lower.includes('idea')) matchOp = 'Vi';
    else if (lower.includes('bsnl')) matchOp = 'BSNL';
    else matchOp = 'Jio';
    
    var btn = document.querySelector('.op-btn[data-op="' + matchOp + '"]');
    selectOperator(matchOp, btn);
  }
  
  // Pre-fill user's saved mobile number if available
  try {
    var savedPhone = (localStorage.getItem('customerPhone') || localStorage.getItem('userPhone') || localStorage.getItem('cust_phone') || localStorage.getItem('current_user_mobile') || '').replace(/[^0-9]/g, '').slice(-10);
    var mobInput = document.getElementById('rcMobileNumber');
    if (mobInput && !mobInput.value && savedPhone.length === 10) {
      mobInput.value = savedPhone;
      validateRcMobile(mobInput);
    }
  } catch(e) {}

  modal.classList.add('show');
};

window.openElectricBillModal = function() {
  var modal = document.getElementById('rechargeServiceModal');
  if (!modal) return;
  switchServiceMode('bill');
  
  // Pre-fill user's saved mobile number
  try {
    var savedPhone = (localStorage.getItem('customerPhone') || localStorage.getItem('userPhone') || localStorage.getItem('cust_phone') || localStorage.getItem('current_user_mobile') || '').replace(/[^0-9]/g, '').slice(-10);
    var mobInput = document.getElementById('billMobileNumber');
    if (mobInput && !mobInput.value && savedPhone.length === 10) {
      mobInput.value = savedPhone;
      validateBillMobile(mobInput);
    }
  } catch(e) {}

  modal.classList.add('show');
};

window.closeRechargeServiceModal = function() {
  var modal = document.getElementById('rechargeServiceModal');
  if (modal) modal.classList.remove('show');
};

window.switchServiceMode = function(mode) {
  var rcContainer = document.getElementById('rechargeFormContainer');
  var billContainer = document.getElementById('billFormContainer');
  var tabRc = document.getElementById('tabBtnRecharge');
  var tabBill = document.getElementById('tabBtnBill');
  var iconBox = document.getElementById('serviceModalIconBox');
  var title = document.getElementById('serviceModalTitle');
  var sub = document.getElementById('serviceModalSub');

  if (mode === 'recharge') {
    if (rcContainer) rcContainer.style.display = 'block';
    if (billContainer) billContainer.style.display = 'none';
    if (tabRc) {
      tabRc.style.background = '#059669';
      tabRc.style.color = '#fff';
    }
    if (tabBill) {
      tabBill.style.background = 'transparent';
      tabBill.style.color = '#475569';
    }
    if (iconBox) {
      iconBox.innerHTML = '📱';
      iconBox.style.background = 'linear-gradient(135deg,#064e3b,#059669)';
    }
    if (title) title.innerText = 'মোবাইল রিচার্জ রিকোয়েস্ট';
    if (sub) sub.innerText = 'অ্যাডমিন সরাসরি রিচার্জ করে WhatsApp-এ কনফার্ম করবেন';
  } else {
    if (rcContainer) rcContainer.style.display = 'none';
    if (billContainer) billContainer.style.display = 'block';
    if (tabRc) {
      tabRc.style.background = 'transparent';
      tabRc.style.color = '#475569';
    }
    if (tabBill) {
      tabBill.style.background = '#2563eb';
      tabBill.style.color = '#fff';
    }
    if (iconBox) {
      iconBox.innerHTML = '⚡';
      iconBox.style.background = 'linear-gradient(135deg,#1e3a8a,#2563eb)';
    }
    if (title) title.innerText = 'WBSEDCL বিদ্যুৎ বিল পেমেন্ট';
    if (sub) sub.innerText = 'অ্যাডমিন বিদ্যুৎ বিল পেমেন্ট করে রিসিট WhatsApp-এ পাঠিয়ে দেবেন';
  }
};

window.selectOperator = function(op, btn) {
  currentSelectedOperator = op;
  document.querySelectorAll('.op-btn').forEach(function(b) {
    b.classList.remove('active');
    b.style.borderColor = '#e2e8f0';
    b.style.background = '#fff';
    var span = b.querySelector('span');
    if (span) span.style.color = '#334155';
  });
  if (btn) {
    btn.classList.add('active');
    btn.style.borderColor = '#059669';
    btn.style.background = '#ecfdf5';
    var span = btn.querySelector('span');
    if (span) span.style.color = '#064e3b';
  }
};

window.setRcAmount = function(amt) {
  var inp = document.getElementById('rcAmount');
  if (inp) inp.value = amt;
};

window.validateRcMobile = function(inp) {
  var val = inp.value.replace(/[^0-9]/g, '');
  inp.value = val;
  var badge = document.getElementById('rcMobileValidation');
  if (!badge) return;
  if (val.length === 10) {
    badge.innerText = '✓ সঠিক নম্বর';
    badge.style.color = '#059669';
  } else {
    badge.innerText = val.length + '/১০ ডিজিট';
    badge.style.color = val.length > 0 ? '#ea580c' : '#64748b';
  }
};

window.validateBillMobile = function(inp) {
  var val = inp.value.replace(/[^0-9]/g, '');
  inp.value = val;
  var badge = document.getElementById('billMobileValidation');
  if (!badge) return;
  if (val.length === 10) {
    badge.innerText = '✓ সঠিক নম্বর';
    badge.style.color = '#059669';
  } else {
    badge.innerText = val.length + '/১০ ডিজিট';
    badge.style.color = val.length > 0 ? '#ea580c' : '#64748b';
  }
};

window.submitRechargeRequest = function() {
  var mobInput = document.getElementById('rcMobileNumber');
  var amtInput = document.getElementById('rcAmount');
  var remarksInput = document.getElementById('rcRemarks');

  var mobile = (mobInput ? mobInput.value : '').replace(/[^0-9]/g, '');
  if (!mobile || mobile.length !== 10) {
    alert('দয়া করে সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন!');
    if (mobInput) mobInput.focus();
    return;
  }

  var amount = amtInput ? parseFloat(amtInput.value) : 0;
  if (!amount || isNaN(amount) || amount <= 0) {
    alert('দয়া করে রিচার্জের পরিমাণ (Amount) লিখুন!');
    if (amtInput) amtInput.focus();
    return;
  }

  var remarks = (remarksInput && remarksInput.value.trim()) ? remarksInput.value.trim() : 'কোনো বিশেষ রিমার্ক নেই';
  var custName = localStorage.getItem('customerName') || localStorage.getItem('userName') || localStorage.getItem('custName') || 'Ride Sathi কাস্টমার';
  var now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  var msg = 
\`📱 *নতুন মোবাইল রিচার্জ রিকোয়েস্ট - Ride Sathi*
━━━━━━━━━━━━━━━━━━━
🔹 *অপারেটর:* \${currentSelectedOperator}
📞 *রিচার্জ নম্বর:* \${mobile}
💰 *টাকার পরিমাণ:* ₹\${amount}
📝 *রিমার্কস:* \${remarks}
👤 *কাস্টমার:* \${custName}
🕒 *তারিখ ও সময়:* \${now}
━━━━━━━━━━━━━━━━━━━
দয়া করে দ্রুত এই নম্বরে রিচার্জটি সম্পন্ন করে আমাকে কনফার্মেশন দিন। ধন্যবাদ!\`;

  var adminWa = '918768447312';
  var waUrl = 'https://wa.me/' + adminWa + '?text=' + encodeURIComponent(msg);

  closeRechargeServiceModal();
  window.open(waUrl, '_blank', 'noopener,noreferrer');
};

window.submitElectricBillRequest = function() {
  var consInput = document.getElementById('billConsumerId');
  var mobInput = document.getElementById('billMobileNumber');
  var amtInput = document.getElementById('billAmount');
  var remarksInput = document.getElementById('billRemarks');

  var consumerId = (consInput ? consInput.value : '').trim();
  if (!consumerId || consumerId.length < 8) {
    alert('দয়া করে সঠিক কনজিউমার আইডি (Consumer ID / Number) লিখুন!');
    if (consInput) consInput.focus();
    return;
  }

  var mobile = (mobInput ? mobInput.value : '').replace(/[^0-9]/g, '');
  if (!mobile || mobile.length !== 10) {
    alert('দয়া করে কাস্টমারের সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন!');
    if (mobInput) mobInput.focus();
    return;
  }

  var amount = amtInput ? parseFloat(amtInput.value) : 0;
  if (!amount || isNaN(amount) || amount <= 0) {
    alert('দয়া করে বিদ্যুৎ বিলের মোট টাকা (Bill Amount) লিখুন!');
    if (amtInput) amtInput.focus();
    return;
  }

  var remarks = (remarksInput && remarksInput.value.trim()) ? remarksInput.value.trim() : 'WBSEDCL Electric Bill Payment';
  var custName = localStorage.getItem('customerName') || localStorage.getItem('userName') || localStorage.getItem('custName') || 'Ride Sathi কাস্টমার';
  var now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  var msg = 
\`⚡ *নতুন বিদ্যুৎ বিল পেমেন্ট রিকোয়েস্ট - Ride Sathi*
━━━━━━━━━━━━━━━━━━━
🏢 *বোর্ড:* WBSEDCL (পশ্চিমবঙ্গ বিদ্যুৎ পর্ষদ)
🔢 *কনজিউমার আইডি:* \${consumerId}
📞 *কাস্টমার মোবাইল:* \${mobile}
💰 *বিলের মোট টাকা:* ₹\${amount}
📝 *রিমার্কস / নাম:* \${remarks}
👤 *প্রেরক কাস্টমার:* \${custName}
🕒 *তারিখ ও সময়:* \${now}
━━━━━━━━━━━━━━━━━━━
দয়া করে দ্রুত এই বিদ্যুৎ বিলটি পেমেন্ট করে WhatsApp-এ রিসিট কনফার্ম করুন। ধন্যবাদ!\`;

  var adminWa = '918768447312';
  var waUrl = 'https://wa.me/' + adminWa + '?text=' + encodeURIComponent(msg);

  closeRechargeServiceModal();
  window.open(waUrl, '_blank', 'noopener,noreferrer');
};
</script>
`;

function processFile(filePath) {
  console.log("Processing:", filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update quick hub icons onclicks
  const oldHub = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
        <div onclick="copyShop('JIO50','https://www.amazon.in/hpc/recharge','Jio Recharge')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2)">
          <img src="https://www.google.com/s2/favicons?domain=jio.com&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Jio</div>
        </div>
        <div onclick="copyShop('AIRTEL40','https://www.amazon.in/hpc/recharge','Airtel Recharge')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2)">
          <img src="https://www.google.com/s2/favicons?domain=airtel.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Airtel</div>
        </div>
        <div onclick="copyShop('VI30','https://www.amazon.in/hpc/recharge','Vi Recharge')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2)">
          <img src="https://www.google.com/s2/favicons?domain=myvi.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Vi / BSNL</div>
        </div>
        <div onclick="copyShop('BILL50','https://www.amazon.in/b?node=14322429031','WB Electricity Bill')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2)">
          <img src="https://www.google.com/s2/favicons?domain=wbsedcl.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">বিদ্যুৎ বিল</div>
        </div>
      </div>`;

  const newHub = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
        <div onclick="openRechargeModal('Jio')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);transition:transform 0.15s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="https://www.google.com/s2/favicons?domain=jio.com&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Jio</div>
        </div>
        <div onclick="openRechargeModal('Airtel')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);transition:transform 0.15s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="https://www.google.com/s2/favicons?domain=airtel.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Airtel</div>
        </div>
        <div onclick="openRechargeModal('Vi')" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);transition:transform 0.15s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="https://www.google.com/s2/favicons?domain=myvi.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">Vi / BSNL</div>
        </div>
        <div onclick="openElectricBillModal()" style="background:rgba(255,255,255,0.14);padding:8px 4px;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.2);transition:transform 0.15s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="https://www.google.com/s2/favicons?domain=wbsedcl.in&sz=128" style="width:24px;height:24px;border-radius:50%;background:#fff;padding:2px;display:block;margin:0 auto">
          <div style="font-size:11px;font-weight:800;margin-top:4px">বিদ্যুৎ বিল</div>
        </div>
      </div>`;

  if (content.includes(oldHub)) {
    content = content.replace(oldHub, newHub);
    console.log(" - Quick Hub replaced successfully");
  } else {
    console.warn(" - Quick Hub pattern NOT found directly, checking normalized...");
  }

  // 2. Update showOffers in script
  const oldCardBtn = `<button type="button" class="offer-btn" onclick="copyShop(' + code + ',' + aff + ',' + brandClean + ')">Copy &amp; Shop</button>`;
  const oldCardBlock = `    return '<div class="offer-card">' +
      '<div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">' +
        '<img src="' + logoSrc + '" alt="' + (o.b || '') + '" onerror="this.onerror=null;this.src=\\'' + fallbackFavicon + '\\'" style="width:46px;height:46px;border-radius:12px;object-fit:contain;background:#fff;border:1px solid #e2e8f0;padding:2px;flex-shrink:0">' +
        '<div style="min-width:0;flex:1">' +
          '<div style="font-weight:800;color:#0f172a;font-size:14.5px;display:flex;align-items:center">' + o.b + badgeHtml + '</div>' +
          '<div style="font-size:12.5px;color:#475569;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + (o.d || '') + '">' + o.d + '</div>' +
          '<div class="offer-code">' + codeDisplay + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="offer-btn" onclick="copyShop(\\'' + code + '\\',\\'' + aff + '\\',\\'' + brandClean + '\\')">Copy &amp; Shop</button>' +
    '</div>';`;

  const newCardBlock = `    var bLower = (o.b || '').toLowerCase();
    var isRc = (o.cat === 'Recharge') || bLower.includes('recharge') || bLower.includes('electricity') || bLower.includes('wbsedcl');
    var isBill = bLower.includes('electricity') || bLower.includes('wbsedcl') || bLower.includes('bill') || bLower.includes('বিদ্যুৎ');
    
    var btnAction = '';
    var btnLabel = 'Copy &amp; Shop';
    if (isBill) {
      btnAction = 'openElectricBillModal()';
      btnLabel = '⚡ বিল পেমেন্ট';
    } else if (isRc) {
      var detectedOp = 'Jio';
      if (bLower.includes('airtel')) detectedOp = 'Airtel';
      else if (bLower.includes('vi') || bLower.includes('vodafone')) detectedOp = 'Vi';
      else if (bLower.includes('bsnl')) detectedOp = 'BSNL';
      btnAction = 'openRechargeModal(\\'' + detectedOp + '\\')';
      btnLabel = '📱 রিচার্জ করুন';
    } else {
      btnAction = 'copyShop(\\'' + code + '\\',\\'' + aff + '\\',\\'' + brandClean + '\\')';
    }

    return '<div class="offer-card">' +
      '<div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">' +
        '<img src="' + logoSrc + '" alt="' + (o.b || '') + '" onerror="this.onerror=null;this.src=\\'' + fallbackFavicon + '\\'" style="width:46px;height:46px;border-radius:12px;object-fit:contain;background:#fff;border:1px solid #e2e8f0;padding:2px;flex-shrink:0">' +
        '<div style="min-width:0;flex:1">' +
          '<div style="font-weight:800;color:#0f172a;font-size:14.5px;display:flex;align-items:center">' + o.b + badgeHtml + '</div>' +
          '<div style="font-size:12.5px;color:#475569;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + (o.d || '') + '">' + o.d + '</div>' +
          '<div class="offer-code">' + codeDisplay + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="offer-btn" onclick="' + btnAction + '">' + btnLabel + '</button>' +
    '</div>';`;

  if (content.includes(oldCardBlock)) {
    content = content.replace(oldCardBlock, newCardBlock);
    console.log(" - showOffers card block replaced successfully");
  } else {
    console.warn(" - showOffers card block pattern NOT found directly");
  }

  // 3. Insert rechargeServiceModal after referModal
  const referModalEnd = `loadOffers();
</script>
  </div>
</div>`;

  if (content.includes(referModalEnd)) {
    content = content.replace(referModalEnd, referModalEnd + '\n' + modalHtml);
    console.log(" - rechargeServiceModal inserted successfully");
  } else {
    console.warn(" - referModalEnd NOT found directly");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Saved:", filePath);
}

processFile('c:\\Users\\DELL\\OneDrive\\Desktop\\RIDE-SATHI\\index.html');
processFile('c:\\Users\\DELL\\OneDrive\\Desktop\\RIDE-SATHI\\public\\index.html');
