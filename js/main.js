// main.js 
console.log("🚀 Main module loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // const path = window.DATA_BASE_PATH || 'http://127.0.0.1:8001/api/businesses';
  const path = window.DATA_BASE_PATH || 'data/businesses.json';
  const businesses = await window.DataLoader.loadBusinesses(path);

  if (businesses.length === 0) return;

  window.UI.renderCarousel(businesses);
  window.Modal.setBusinesses(businesses); // <-- IMPORTANT
  window.Interactions.init(businesses);

  // ✅ NEW: Auto-open modal if URL includes ?business= (with or without &v=)
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get("business");
  const version = params.get("v"); // extra param to distinguish unique links

  if (businessId) {
    const matched = businesses.find(
      (b) => String(b.id) === String(businessId) || b.id === parseInt(businessId)
    );
    if (matched) {
      // small delay ensures UI & modal DOM are ready before open
      setTimeout(() => {
        window.Modal.open(matched);
      }, 300);
    }
  }

  // ✅ Optional: Clean URL after modal opens (so it doesn’t reopen on refresh)
  if (businessId && version) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  }
});
