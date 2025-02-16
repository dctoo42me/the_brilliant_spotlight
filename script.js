document.addEventListener("DOMContentLoaded", async function () {
    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".btn-close");

    let isSwiping = false;

    // Fetch business data from JSON file
    const response = await fetch("businesses.json");
    const businesses = await response.json();

    // Function to create cards dynamically
    function createCard(business) {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="image-card-container">
                <img src="${business.image}" alt="${business.name}">
            </div>
            <div class="card-content">
                <div class="business-name">
                    <h2>${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                </div>
                `;
                // <p>${business.description}</p>

        card.setAttribute("data-business-id", business.name); // Ensure each card has a unique identifier

        card.addEventListener("click", function (e) {
            if (!isSwiping) openModal(business);
        });

        return card;
    }

    // Add all cards to carousel
    businesses.forEach((business) => {
        const card = createCard(business);
        carousel.appendChild(card);
    });

    // Check if URL contains a business and open modal
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");

    if (businessId) {
        const matchedBusiness = businesses.find(b => b.name === businessId);
        if (matchedBusiness) {
            openModal(matchedBusiness);
        }
    }

    let isAnimating = false;
    let cardWidth = getCardWidth(); // Initial card width calculation

    function getCardWidth() {
        const firstCard = document.querySelector(".card");
        if (!firstCard) return 0;

        const cardStyle = window.getComputedStyle(firstCard);
        const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
        const cardGap = 20; // Match CSS gap

        return firstCard.offsetWidth + cardMarginRight + cardGap;
    }

    function updateCardWidth() {
        cardWidth = getCardWidth();
    }
    window.addEventListener("resize", updateCardWidth);

    function shiftLeft() {
        if (isAnimating) return;
        isAnimating = true;

        updateCardWidth();

        const firstCard = carousel.firstElementChild;
        const clone = firstCard.cloneNode(true);
        carousel.appendChild(clone);

        carousel.style.transition = "transform 0.5s ease-in-out";
        carousel.style.transform = `translateX(-${cardWidth}px)`;

        setTimeout(() => {
            firstCard.remove();
            carousel.style.transition = "none";
            carousel.style.transform = "translateX(0)";
            isAnimating = false;
        }, 500);
    }

    function shiftRight() {
        if (isAnimating) return;
        isAnimating = true;
    
        updateCardWidth();
    
        const lastCard = carousel.lastElementChild;
        const clone = lastCard.cloneNode(true);
        carousel.insertBefore(clone, carousel.firstElementChild);
    
        carousel.style.transition = "none";
        carousel.style.transform = `translateX(-${cardWidth}px)`;
    
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                carousel.style.transition = "transform 0.5s ease-in-out";
                carousel.style.transform = "translateX(0)";
                
                setTimeout(() => {
                    lastCard.remove();
                    isAnimating = false;
                }, 500);
            });
        });
    }

    leftBtn.addEventListener("click", shiftRight);
    rightBtn.addEventListener("click", shiftLeft);

    let startX, moveX;

    carousel.addEventListener("touchstart", (e) => {
        isSwiping = false;
        startX = e.touches[0].clientX;
    });

    carousel.addEventListener("touchmove", (e) => {
        moveX = e.touches[0].clientX;
        if (Math.abs(moveX - startX) > 30) isSwiping = true;
    });

    carousel.addEventListener("touchend", () => {
        if (isSwiping && Math.abs(moveX - startX) > 50) {
            if (moveX < startX) shiftLeft();
            else shiftRight();
        }
    });

    function openModal(business) {
        if (!modal || !modalContent) {
            console.error("Modal elements not found!");
            return;
        }
        const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.name)}`;

        modalContent.innerHTML = `
        <div class="card">
            <img src="${business.image}" alt="${business.name}">
            <div class="card-content">
                <div class="business-name">
                    <h2>${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                <button class="site-button" id="share-button">Share</button>
                <div id="qr-code-container"></div>
                </div>
                </div>
                `;
                // <p>${business.description}</p>

        document.getElementById("share-button").addEventListener("click", () => {
            if (navigator.share && window.innerWidth < 768) {
                navigator.share({
                    title: business.name,
                    text: `Check out this business: ${business.name}`,
                    url: shareUrl,
                });
            } else {
                let qrCodeContainer = document.getElementById("qr-code-container");

                if (!qrCodeContainer.querySelector("#qr-code")) {
                    qrCodeContainer.innerHTML = "";

                    const qrCode = document.createElement("img");
                    qrCode.id = "qr-code";
                    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
                    qrCodeContainer.appendChild(qrCode);
                    qrCodeContainer.style.padding = '20px';

                    const closeButton = document.createElement("button");
                    closeButton.id = "qr-close-button";
                    closeButton.textContent = "Close";
                    closeButton.style.display = "block";
                    closeButton.style.marginTop = "10px";
                    closeButton.addEventListener("click", () => {
                        qrCodeContainer.innerHTML = "";
                    qrCodeContainer.style.padding = "0";

                    });
                    qrCodeContainer.appendChild(closeButton);
                }
            }
        });

        window.history.pushState({ business: business.name }, "", shareUrl);
        modal.classList.add("active");
        carousel.style.pointerEvents = "none";
        leftBtn.style.display = "none";
        rightBtn.style.display = "none";
    }

    function closeModalFunction() {
        modal.classList.remove("active");
        carousel.style.pointerEvents = "auto";
        window.history.pushState({}, "", window.location.origin + window.location.pathname);
        leftBtn.style.display = "block";
        rightBtn.style.display = "block";
    }

    closeModal.addEventListener("click", closeModalFunction);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModalFunction();
    });

    window.addEventListener("popstate", () => {
        if (window.location.search.includes("business")) {
            const urlParams = new URLSearchParams(window.location.search);
            const businessName = urlParams.get("business");
            const matchedBusiness = businesses.find(b => b.name === businessName);
            if (matchedBusiness) openModal(matchedBusiness);
        } else closeModalFunction();
    });
});
