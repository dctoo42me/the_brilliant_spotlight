// interactions.js
console.log("🎮 Interactions module loaded");

window.Interactions = (() => {
  let carousel, leftBtn, rightBtn, businesses, cardWidth;
  let isAnimating = false, isSwiping = false, startX = 0, moveX = 0;

  function init(data) {
    businesses = data;
    carousel = document.querySelector(".carousel");
    leftBtn = document.querySelector(".carousel-btn.left");
    rightBtn = document.querySelector(".carousel-btn.right");
    setupCarouselControls();
  }

  function updateCardWidth() {
    const card = carousel.querySelector(".card");
    cardWidth = card ? card.offsetWidth : 0;
  }

  function shiftLeft() {
    if (isAnimating || !carousel.firstElementChild) return;
    isAnimating = true;
    updateCardWidth();

    const firstCard = carousel.firstElementChild;
    const clone = firstCard.cloneNode(true);
    const businessId = firstCard.getAttribute("data-business-id");
    const business = businesses.find(b => String(b.id) === String(businessId));
    if (business) clone.addEventListener("click", () => { if (!isSwiping) window.Modal.open(business); });

    carousel.appendChild(clone);
    carousel.style.transition = "transform 0.4s ease-in-out";
    carousel.style.transform = `translateX(-${cardWidth}px)`;

    setTimeout(() => {
      firstCard.remove();
      carousel.style.transition = "none";
      carousel.style.transform = "translateX(0)";
      isAnimating = false;
    }, 400);
  }

  function shiftRight() {
    if (isAnimating || !carousel.lastElementChild) return;
    isAnimating = true;
    updateCardWidth();

    const lastCard = carousel.lastElementChild;
    const clone = lastCard.cloneNode(true);
    const businessId = lastCard.getAttribute("data-business-id");
    const business = businesses.find(b => String(b.id) === String(businessId));
    if (business) clone.addEventListener("click", () => { if (!isSwiping) window.Modal.open(business); });

    carousel.insertBefore(clone, carousel.firstElementChild);
    carousel.style.transition = "none";
    carousel.style.transform = `translateX(-${cardWidth}px)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        carousel.style.transition = "transform 0.4s ease-in-out";
        carousel.style.transform = "translateX(0)";
        setTimeout(() => {
          lastCard.remove();
          isAnimating = false;
        }, 400);
      });
    });
  }

  function setupCarouselControls() {
    if (leftBtn && rightBtn) {
      leftBtn.addEventListener("click", shiftRight);
      rightBtn.addEventListener("click", shiftLeft);
    }

    carousel.addEventListener("touchstart", (e) => { 
      isSwiping = false; startX = e.touches[0].clientX; 
      window.UI.setSwipingFlag(false);
    });

    carousel.addEventListener("touchmove", (e) => { 
      moveX = e.touches[0].clientX; 
      if (Math.abs(moveX - startX) > 30) {
        isSwiping = true; 
        window.UI.setSwipingFlag(true);
      }
    });

    carousel.addEventListener("touchend", () => {
      if (isSwiping && Math.abs(moveX - startX) > 50) {
        if (moveX < startX) shiftLeft(); else shiftRight();
      }
      window.UI.setSwipingFlag(false);
    });
  }

  return { init };
})();
