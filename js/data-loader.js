// data-loader.js
console.log("📦 Data Loader module loaded");

window.DataLoader = (() => {
  async function loadBusinesses(path) {
    try {
      const url = window.FULL_DATA_BASE_PATH || path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load businesses JSON");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error loading businesses:", err);
      return [];
    }
  }

  return { loadBusinesses };
})();
