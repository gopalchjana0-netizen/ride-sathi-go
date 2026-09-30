/**
 * RIDE SATHI GO - ENTERPRISE CLIENT SECURITY SHIELD
 * Protects against inspection, devtools scraping, right-click cloning, and code injection.
 */
(function () {
  'use strict';

  // 1. Context Menu / Right Click Protection (Allows selection on input/textarea only)
  document.addEventListener('contextmenu', function (e) {
    var tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { passive: false });

  // 2. DevTools Shortcut Blocker
  window.addEventListener('keydown', function (e) {
    // F12 Key
    if (e.keyCode === 123 || e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return false;
    }
    // Mac Cmd+Option+I / Cmd+Option+J / Cmd+Option+C
    if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    // Mac Cmd+Option+U
    if (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return false;
    }
  }, { passive: false });

  // 3. Enterprise Console Security Warning
  try {
    console.log(
      "%c🛑 RIDE SATHI GO - ENTERPRISE SECURITY LAYER ACTIVE%c\nUnauthorized tampering, scraping, or console code injection is strictly prohibited and monitored under applicable cyber security laws.",
      "color:#ef4444;font-size:16px;font-weight:900;text-shadow:1px 1px 2px #000;padding:4px 0;",
      "color:#0284c7;font-size:12px;font-weight:bold;line-height:1.5;"
    );
  } catch (err) {}

})();
