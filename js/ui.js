// ui.js
console.log("🧠 UI module loaded");

window.UI = (() => {
  let isSwiping = false; // used by interactions for click behavior
  const PLACEHOLDER_IMAGE = window.AppConfig.placeholderImage;

  function createCard(business) {
    const card = document.createElement("div");
    card.classList.add("card");

    const name = (business.name || "").trim();
    const wordCount = name.split(/\s+/).length;
    const charCount = name.length;
    const imgSrc = safeImageUrl(business.image);
    let fontSizeStyle = "";
    if (wordCount > 4 || charCount > 26) fontSizeStyle = 'style="font-size: .9rem"';

    card.innerHTML = `
      <div class="image-card-container">
        <img src="${imgSrc}" alt="${business.name}">
      </div>
      <div class="card-content">
        <div class="business-name">
          <h2 ${fontSizeStyle}>${business.name}</h2>
        </div>
        <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
      </div>
    `;

    const imgEl = card.querySelector("img");
    imgEl.onerror = function() {
      this.onerror = null;
      this.src = PLACEHOLDER_IMAGE;
    };

    card.setAttribute("data-business-id", business.id);
    card.addEventListener("click", function () {
      if (!isSwiping) window.Modal.open(business);
    });

    return card;
  }

  function renderCarousel(businesses) {
    const carousel = document.querySelector(".carousel");
    carousel.innerHTML = "";
    businesses.forEach(b => {
      const card = createCard(b);
      carousel.appendChild(card);
    });
  }

  function setSwipingFlag(flag) {
    isSwiping = flag;
  }

  return { renderCarousel, setSwipingFlag };
})();
