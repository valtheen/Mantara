/**
 * Di browser biasa: no-op.
 * Di app Capacitor: core sudah diinjeksi WebView — file ini placeholder
 * untuk hook tambahan jika diperlukan.
 */
(function () {
  "use strict";
  if (window.Capacitor) window.__mantaraCapacitorReady = true;
})();
