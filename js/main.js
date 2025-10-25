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
});