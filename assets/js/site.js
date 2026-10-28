/* site.js — page behaviour. No storage, no requests, nothing leaves the page. */
(function () {
  'use strict';

  // One line to swap when the App Store listing is live. Leave empty until then.
  var APP_STORE_URL = '';

  var badge = document.getElementById('app-store');
  if (APP_STORE_URL && badge) {
    var a = document.createElement('a');
    a.className = 'badge badge--live';
    a.href = APP_STORE_URL;
    a.rel = 'noopener';
    a.textContent = 'Download on the App Store';
    badge.replaceWith(a);
  }

  // Scale the phone to its stage. The screen is designed at 390 × 844 CSS px.
  var stage = document.getElementById('stage');
  var phone = document.getElementById('phone');
  function fit() {
    if (!stage || !phone) return;
    var w = stage.clientWidth;
    var s = Math.min(1, w / 430);
    phone.style.setProperty('--scale', String(s));
    stage.style.height = Math.round(880 * s) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);

  var reset = document.getElementById('reset');
  if (reset) reset.addEventListener('click', function () { window.DottiePhone.reset(); });
})();
