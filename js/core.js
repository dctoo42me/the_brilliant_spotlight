// core.js
console.log("⚡ Core module loaded");

window.AppConfig = {
  placeholderImage: '/images/projects/placeholder.png'
};

// Utility to safely resolve image paths
window.safeImageUrl = (src) => {
  return src ? `/images/2025/september/austin/${src}` : AppConfig.placeholderImage;
};
