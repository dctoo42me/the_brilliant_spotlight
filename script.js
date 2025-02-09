document.addEventListener("DOMContentLoaded", async function () {
    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");

    // Fetch business data from JSON file
    const response = await fetch("businesses.json");
    const businesses = await response.json();

    // Function to create cards dynamically****************
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
                <a class="site-button" href="${business.website}">Visit Website</a>
                <p>${business.description}</p>
            </div>
        `;
        card.addEventListener("click", function (e) {
            if (!isSwiping) openModal(business);
        });
        return card;
    }

    // Add all cards to carousel
    businesses.forEach((business) => {
        carousel.appendChild(createCard(business));
    });

    let isAnimating = false;
    let cardWidth = getCardWidth(); // Initial card width calculation

     // Function to get the actual card width including margin
    function getCardWidth() {
        const firstCard = document.querySelector(".card");
    if (!firstCard) return 0;

    const cardStyle = window.getComputedStyle(firstCard);
    const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
    const cardGap = 20; // Match CSS gap

    return firstCard.offsetWidth + cardMarginRight + cardGap;
    }

    // Update cardWidth on window resize
    function updateCardWidth() {
        cardWidth = getCardWidth();
    }
    window.addEventListener("resize", updateCardWidth);

    function shiftLeft() {
                if (isAnimating) return;
        isAnimating = true;

        updateCardWidth();

        // **1. Clone first card and add it at the end**
        const firstCard = carousel.firstElementChild;
        const clone = firstCard.cloneNode(true);
        carousel.appendChild(clone);

        // **2. Animate shift left**
        carousel.style.transition = "transform 0.5s ease-in-out";
        carousel.style.transform = `translateX(-${cardWidth}px)`;

        // **3. After animation, remove the original first card and reset transform**
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
    
        // **1. Clone last card and add it at the beginning**
        const lastCard = carousel.lastElementChild;
        const clone = lastCard.cloneNode(true);
        carousel.insertBefore(clone, carousel.firstElementChild);
    
        // **2. Set initial transform offset**
        carousel.style.transition = "none";
        carousel.style.transform = `translateX(-${cardWidth}px)`;
    
        // **3. Animate back to normal**
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                carousel.style.transition = "transform 0.5s ease-in-out";
                carousel.style.transform = "translateX(0)";
                
                setTimeout(() => {
                    lastCard.remove(); // Remove old last card after animation
                    isAnimating = false;
                }, 500);
            });
        });
    }

    // Arrow Button Click
    leftBtn.addEventListener("click", shiftRight);
    rightBtn.addEventListener("click", shiftLeft);

     // Swipe Support
    let isSwiping = false;
    let startX, moveX;

    // Touch Event for Swiping
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
    //***********************************************************

    // Modal Functionality
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".btn-close");

    function openModal(business) {

        if (!modal || !modalContent) {
            console.error("Modal elements not found!");
            return;
        }

        // Update modal content with the same card structure
        modalContent.innerHTML = `
        <div class="card">
            <img src="${business.image}" alt="${business.name}">
            <div class="card-content">
                <div class="business-name">
                    <h2>${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                <p>${business.description}</p>
            </div>
        </div>
        `;

        // Change the URL without reloading the page
        const newUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.name)}`;
        window.history.pushState({ business: business.name }, "", newUrl);

        modal.classList.add("active");
        if (window.innerWidth > 500) { 
            modalContent.classList.add("larger");
        }
        else 
        {
            modalContent.classList.remove("larger");
        }
        carousel.style.pointerEvents = "none";

        // Hide arrows when modal is open
        leftBtn.style.display = "none";
        rightBtn.style.display = "none";
    }

    function closeModalFunction() {
        modal.classList.remove("active");
        carousel.style.pointerEvents = "auto";

        // Reset URL without refreshing
        const newUrl = window.location.origin + window.location.pathname;
        window.history.pushState({}, "", newUrl);
        
        // Display arrows when modal closed
        leftBtn.style.display = "block";
        rightBtn.style.display = "block";


    }

    closeModal.addEventListener("click", closeModalFunction);
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModalFunction();
        }
    });

    // Check if the URL contains a business parameter on page load
    const urlParams = new URLSearchParams(window.location.search);
    const businessName = urlParams.get("business");
    if (businessName) {
        const matchedBusiness = businesses.find(b => b.name === businessName);
        if (matchedBusiness) {
            openModal(matchedBusiness);
        }
    }
    
    // Handle browser back/forward navigation
    window.addEventListener("popstate", function () {
        if (window.location.search.includes("business")) {
            const urlParams = new URLSearchParams(window.location.search);
            const businessName = urlParams.get("business");
            const matchedBusiness = businesses.find(b => b.name === businessName);
            if (matchedBusiness) {
                openModal(matchedBusiness);
            }
        } else {
            closeModalFunction();
        }
    });
});
