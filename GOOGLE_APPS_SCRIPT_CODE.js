/**
 * =========================================================================================
 * RIDE SATHI GO - FREE GOOGLE SHEET DATABASE BACKEND (GOOGLE APPS SCRIPT)
 * 100% FREE - NO FIREBASE, NO FIRESTORE, NO CLOUD BILLING REQUIRED!
 * FEATURES: User Registration, Edit Profile, Block / Unblock, 30-Day Auto Cleanup
 * =========================================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) or your existing Ride Sathi sheet.
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any old code in Code.gs, and PASTE this ENTIRE file into Code.gs.
 * 4. Click the Save icon (💾).
 * 5. Click "Deploy" (top right blue button) > "Manage deployments" > Edit (pencil icon) > "New version" > Deploy.
 *    (Or "New deployment" > Web app > Execute as "Me", Who has access "Anyone").
 * 6. Copy the "Web App URL" (ends in /exec) and paste in Admin Panel or index.html/driver.html!
 * 
 * 🧹 OPTIONAL (AUTOMATIC DAILY 30-DAY CLEANER TRIGGER):
 * - In Apps Script, click the alarm clock icon (⏰ Triggers) on the left sidebar.
 * - Click "+ Add Trigger" (bottom right).
 * - Choose function to run: "autoDailyPurge30DaysTrigger".
 * - Event source: "Time-driven" -> "Day timer" -> "Midnight to 1am".
 * - Click Save! Google will now automatically delete >30-day old records every night for free!
 * =========================================================================================
 */

// Handles saving, editing, blocking, deleting & 30-day purge (POST request)
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent write locks
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Ensure 8 header columns exist: Date, Type, Name, Email, Phone, Photo, Vehicle, Status
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Type", "Name", "Email", "Phone", "Photo", "Vehicle", "Status"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f1f5f9");
    } else {
      // Check if 8th header 'Status' exists, if not add it
      var headerVal = sheet.getRange(1, 8).getValue();
      if (!headerVal) {
        sheet.getRange(1, 8).setValue("Status").setFontWeight("bold").setBackground("#f1f5f9");
      }
    }
    
    // Parse received JSON body
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }
    
    var action = (body.action || "").toLowerCase().trim();
    var targetEmail = (body.email || "").toLowerCase().trim();
    var allData = sheet.getDataRange().getValues();

    // -------------------------------------------------------------
    // ACTION 1: EDIT / UPDATE EXISTING USER
    // -------------------------------------------------------------
    if (action === "update" && targetEmail) {
      for (var i = 1; i < allData.length; i++) {
        var rowEmail = String(allData[i][3] || "").toLowerCase().trim();
        if (rowEmail === targetEmail) {
          var rowNum = i + 1;
          if (body.name !== undefined) sheet.getRange(rowNum, 3).setValue(body.name);
          if (body.phone !== undefined) sheet.getRange(rowNum, 5).setValue(body.phone);
          if (body.vehicle !== undefined) sheet.getRange(rowNum, 7).setValue(body.vehicle);
          if (body.status !== undefined) sheet.getRange(rowNum, 8).setValue(body.status);
          
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "User details updated successfully",
            email: targetEmail
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "Email not found for update"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 2: TOGGLE / SET BLOCK STATUS
    // -------------------------------------------------------------
    if ((action === "toggleblock" || action === "setstatus") && targetEmail) {
      var newStatus = body.status || "blocked";
      for (var i = 1; i < allData.length; i++) {
        var rowEmail = String(allData[i][3] || "").toLowerCase().trim();
        if (rowEmail === targetEmail) {
          var rowNum = i + 1;
          sheet.getRange(rowNum, 8).setValue(newStatus);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "Status updated to " + newStatus,
            email: targetEmail,
            newStatus: newStatus
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "Email not found to update status"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 3: DELETE SINGLE USER RECORD
    // -------------------------------------------------------------
    if (action === "delete" && targetEmail) {
      for (var i = 1; i < allData.length; i++) {
        var rowEmail = String(allData[i][3] || "").toLowerCase().trim();
        if (rowEmail === targetEmail) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "Record deleted successfully",
            email: targetEmail
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "Email not found to delete"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // ACTION 4: PURGE RECORDS OLDER THAN 30 DAYS (LIFETIME FREE)
    // -------------------------------------------------------------
    if (action === "purge30days") {
      var purgedCount = 0;
      var nowMs = new Date().getTime();
      var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      
      // Loop from bottom to top to safely delete rows
      for (var j = allData.length - 1; j >= 1; j--) {
        var dateVal = allData[j][0];
        if (dateVal) {
          var parsedDate = new Date(dateVal);
          if (!isNaN(parsedDate.getTime()) && (nowMs - parsedDate.getTime()) > thirtyDaysMs) {
            sheet.deleteRow(j + 1);
            purgedCount++;
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Purged " + purgedCount + " record(s) older than 30 days.",
        purgedCount: purgedCount
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // DEFAULT: NEW CUSTOMER OR DRIVER REGISTRATION
    // -------------------------------------------------------------
    var date = body.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    var type = body.type || "customer";
    var name = body.name || "";
    var email = body.email || "";
    var phone = body.phone || "";
    var photo = body.photo || body.picture || "";
    var vehicle = body.vehicle || body.vehicleType || (type === "driver" ? "Auto Rickshaw" : "-");
    var status = body.status || "active";
    
    // Check if user email already exists; if so, update their record instead of creating duplicate
    var existingRow = -1;
    if (email) {
      for (var k = 1; k < allData.length; k++) {
        if (String(allData[k][3] || "").toLowerCase().trim() === email.toLowerCase().trim()) {
          existingRow = k + 1;
          break;
        }
      }
    }
    
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1).setValue(date);
      sheet.getRange(existingRow, 3).setValue(name);
      sheet.getRange(existingRow, 5).setValue(phone);
      if (photo) sheet.getRange(existingRow, 6).setValue(photo);
      sheet.getRange(existingRow, 7).setValue(vehicle);
    } else {
      sheet.appendRow([date, type, name, email, phone, photo, vehicle, status]);
    }
    
    var response = {
      status: "success",
      message: "Record saved successfully",
      savedAt: date
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errResponse = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handles retrieving records or checking single user status (GET request)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    // Check if client is checking a single user's status: ?checkEmail=user@gmail.com
    if (e && e.parameter && e.parameter.checkEmail) {
      var checkEmail = String(e.parameter.checkEmail).toLowerCase().trim();
      var foundStatus = "active";
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][3] || "").toLowerCase().trim() === checkEmail) {
          foundStatus = String(rows[r][7] || "active").toLowerCase().trim() || "active";
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        email: checkEmail,
        status: foundStatus
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // If empty or only header
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = rows[0].map(function(h) {
      return String(h).trim().toLowerCase();
    });
    
    var result = [];
    
    // Convert rows into JSON objects
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      // Skip empty rows
      if (!row[0] && !row[1] && !row[2] && !row[3]) continue;
      
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        var val = row[j];
        // Format Date objects if Sheets converted them
        if (val instanceof Date) {
          val = Utilities.formatDate(val, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
        }
        item[key] = val;
      }
      
      // Ensure status has default "active" if blank
      if (!item.status) {
        item.status = "active";
      }
      
      result.push(item);
    }
    
    // Return newest entries first
    result.reverse();
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errResponse = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ⏰ Automatic 30-Day Purge Trigger Function
 * Setup in Apps Script Triggers to run once a day automatically!
 */
function autoDailyPurge30DaysTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;
  
  var now = new Date().getTime();
  var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  for (var i = rows.length - 1; i >= 1; i--) {
    var rowDate = new Date(rows[i][0]);
    if (!isNaN(rowDate.getTime())) {
      if ((now - rowDate.getTime()) > thirtyDaysMs) {
        sheet.deleteRow(i + 1);
      }
    }
  }
}
