/* ============ Boot watchdog ============
   Kept in its own file (not inline) so the page can run under a strict
   Content-Security-Policy with script-src 'self' — no 'unsafe-inline'.
   Loads as a classic script, so it runs before the deferred app module.
========================================================================= */
(function () {
  var done = false;
  window.__fityarBooted = function () { done = true; };
  function fail(msg, detail) {
    if (done) return;
    done = true;
    var box = document.getElementById('boot-fail');
    document.getElementById('boot-fail-msg').textContent = msg;
    document.getElementById('boot-fail-detail').textContent = detail || '';
    box.hidden = false;
  }
  window.addEventListener('error', function (e) {
    fail('یک خطای جاوااسکریپت رخ داد.', (e.message || '') + '\n' + (e.filename || '') + ':' + (e.lineno || ''));
  });
  window.addEventListener('unhandledrejection', function (e) {
    fail('یک عملیات ناتمام ماند.', String(e.reason && (e.reason.stack || e.reason.message) || e.reason));
  });
  setTimeout(function () {
    // If the app object exists the UI is alive — never cry wolf over a working page.
    if (window.FitYar || window.__fityarStarted) { done = true; return; }
    fail('راه‌اندازی بیش از ۱۲ ثانیه طول کشید.',
         'Boot timed out. Most often this means the browser could not load ./js/app.js — ' +
         'check that the page is served over http:// (not opened as a file://) and reload.');
  }, 12000);
  document.getElementById('boot-fail-reset').onclick = async function () {
    try { var ks = await caches.keys(); for (var i = 0; i < ks.length; i++) await caches.delete(ks[i]); } catch (e) {}
    try { var rs = await navigator.serviceWorker.getRegistrations(); for (var j = 0; j < rs.length; j++) await rs[j].unregister(); } catch (e) {}
    location.reload();
  };
})();
