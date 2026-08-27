/* Last-resort notice if the app module never executed at all. */
// If the module never even parses (old browser, bad MIME type), say so clearly.
  setTimeout(function () {
    if (!window.__fityarStarted && !window.__fityarBootFailed) {
      var d = document.getElementById('boot-fail-detail');
      if (d && !d.textContent) d.textContent = 'js/app.js did not execute — the browser may not support ES modules, or the server sent a wrong Content-Type for .js files.';
    }
  }, 6000);
