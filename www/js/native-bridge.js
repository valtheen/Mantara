/**
 * Mantara — jembatan native (Capacitor iOS/Android)
 * Menyiapkan StatusBar, splash hide, IAP hook, dan deteksi platform.
 */
(function () {
  "use strict";

  function platform() {
    try {
      if (window.Capacitor && typeof window.Capacitor.getPlatform === "function")
        return window.Capacitor.getPlatform();
    } catch (e) {}
    return "web";
  }

  function isNative() {
    try {
      return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    } catch (e) {
      return false;
    }
  }

  window.TakdirNative = {
    isNative: isNative(),
    platform: platform(),
  };

  if (window.TakdirNative.isNative) {
    document.documentElement.classList.add("capacitor-native");
  }

  async function initNativeUI() {
    if (!window.TakdirNative.isNative || !window.Capacitor) return;
    const { Plugins } = window.Capacitor;
    try {
      if (Plugins.StatusBar) {
        await Plugins.StatusBar.setStyle({ style: "DARK" });
        await Plugins.StatusBar.setBackgroundColor({ color: "#171019" });
      }
    } catch (e) {}
    try {
      if (Plugins.SplashScreen) await Plugins.SplashScreen.hide();
    } catch (e) {}
    try {
      if (Plugins.Keyboard && Plugins.Keyboard.setResizeMode)
        await Plugins.Keyboard.setResizeMode({ mode: "native" });
    } catch (e) {}
  }

  /**
   * IAP — sambungkan ke plugin billing native (StoreKit / Play Billing).
   * Ganti implementasi ini saat RevenueCat atau @capacitor-community/in-app-purchases terpasang.
   *
   * Native side harus memanggil:
   *   window.onPurchaseResult(productId, true|false)
   * setelah transaksi selesai.
   */
  if (!window.TakdirIAP) {
    window.TakdirIAP = {
      purchase: function (productId) {
        console.warn("[TakdirIAP] Billing native belum disambung. ID:", productId);
        if (typeof toast === "function")
          toast("Pembelian in-app aktif setelah setup App Store / Play Console.");
      },
      restore: function () {
        console.warn("[TakdirIAP] restore belum disambung");
        if (typeof toast === "function")
          toast("Pulihkan pembelian aktif di build App Store / Play Store.");
      },
    };
  }

  // Android: tombol back menutup modal dulu
  if (window.TakdirNative.isNative && window.Capacitor && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener("backButton", function () {
      var modal = document.getElementById("modal");
      if (modal && modal.classList.contains("show")) {
        if (typeof closeModal === "function") closeModal();
        return;
      }
      window.Capacitor.Plugins.App.minimizeApp();
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initNativeUI);
  else initNativeUI();
})();
