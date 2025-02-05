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
            <img src="${business.image}" alt="${business.name}">
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
    const cardWidth = document.querySelector(".card").offsetWidth + 20; // Card width + gap


    function shiftLeft() {
        if (isAnimating) return;
        isAnimating = true;
        carousel.style.transition = "transform 0.5s ease-in-out";
        carousel.style.transform = `translateX(-${cardWidth}px)`;

        setTimeout(() => {
            carousel.appendChild(carousel.firstElementChild);
            carousel.style.transition = "none";
            carousel.style.transform = "translateX(0)";
            isAnimating = false;
        }, 500);
    }

    function shiftRight() {
        if (isAnimating) return;
        isAnimating = true;
        carousel.insertBefore(carousel.lastElementChild, carousel.firstElementChild);
        carousel.style.transition = "none";
        carousel.style.transform = `translateX(-${cardWidth}px)`;

        setTimeout(() => {
            carousel.style.transition = "transform 0.5s ease-in-out";
            carousel.style.transform = "translateX(0)";
            isAnimating = false;
        }, 50);
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
        if (isSwiping) {
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
        carousel.style.pointerEvents = "none";

        // Hide arrows when modal is open
        leftBtn.style.display = "none";
        rightBtn.style.display = "none";
        document.querySelector(".close-modal").addEventListener("click", closeModalFunction);
    }

    document.querySelector(".modal").addEventListener("click", function (event) {
        if (event.target === this) closeModalFunction();
    });
    function closeModalFunction() {
        modal.classList.remove("active");
        carousel.style.pointerEvents = "auto";
        
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
