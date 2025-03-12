document.addEventListener("DOMContentLoaded", async function () {
    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".btn-close");

    let isSwiping = false;
    let isSharing = false;

    if (!carousel) return; // Exit if carousel is not found

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

        card.setAttribute("data-business-id", business.id); // Use `id` for uniqueness

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
        const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
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

        // Add event listener to the cloned card
        const businessId = firstCard.getAttribute("data-business-id");
        const business = businesses.find(b => b.id === parseInt(businessId));
        if (business) {
            clone.addEventListener("click", function (e) {
                if (!isSwiping) openModal(business);
            });
        }

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

        // Add event listener to the cloned card
        const businessId = lastCard.getAttribute("data-business-id");
        const business = businesses.find(b => b.id === parseInt(businessId));
        if (business) {
            clone.addEventListener("click", function (e) {
                if (!isSwiping) openModal(business);
            });
        }

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
        // Use a unique timestamp to force re-scraping
        const timestamp = Date.now();
        const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.id)}&v=${timestamp}`;

        modalContent.innerHTML = `
        <div class="card">
            <img src="${business.image}" alt="${business.name}">
            <div class="card-content">
                <div class="business-name">
                    <h2>${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                <a class="site-button save-ad" href="#" id="save-ad-link">Save Ad</a>
                <button class="site-button" id="share-button">Share</button>
                <div id="qr-code-container"></div>
            </div>
        </div>
        `;

        // Detect if the user is on a mobile device with share support
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const canShareFiles = isMobile && navigator.share && navigator.canShare;

    // Add event listener to the Save Deal button
    const saveButton = modalContent.querySelector(".save-ad");
    saveButton.addEventListener("click", async (e) => {
        e.preventDefault(); // Prevent default link behavior

        if (canShareFiles) {
            try {
                // Fetch the image as a blob
                const response = await fetch(business.image);
                if (!response.ok) throw new Error("Image fetch failed");
                const blob = await response.blob();
                const file = new File([blob], `${business.name}_deal.png`, { type: 'image/png' });

                // Check if the browser can share files
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Save ${business.name} Deal`,
                        text: `Save this deal from ${business.name} to your Photos!`,
                    });
                    return; // Exit after sharing
                }
            } catch (error) {
                console.error("Share failed:", error);
                // Fallback to download if sharing fails
            }
        }

        // Fallback: Trigger download
        const isMobileFallback = isMobile ? "Long-press the image to save to Photos." : "Click to download the image.";
        alert(isMobileFallback);
        // window.location.href = business.image;
    });

        document.getElementById("share-button").addEventListener("click", () => {
            if (navigator.share && window.innerWidth < 768) {
                isSharing = true;
                navigator.share({
                    title: business.name,
                    text: `Discover why ${business.name} is a Local Gem!`,
                    url: shareUrl,
                }).then(() => {
                    isSharing = false;
                    console.log("Share completed successfully");
                }).catch((error) => {
                    console.error("Share failed:", error);
                    isSharing = false;
                    alert("Sharing failed. Please try again or use the QR code option.");
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

        window.history.pushState({ business: business.id }, "", shareUrl);
        modal.classList.add("active");
        carousel.style.pointerEvents = "none";
        leftBtn.style.display = "none";
        rightBtn.style.display = "none";
    }

    function closeModalFunction() {
        if (!isSharing) {
            modal.classList.remove("active");
            carousel.style.pointerEvents = "auto";
            window.history.pushState({}, "", window.location.origin + window.location.pathname);
            leftBtn.style.display = "block";
            rightBtn.style.display = "block";

        }
    }

    closeModal.addEventListener("click", closeModalFunction);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModalFunction();
    });

    window.addEventListener("popstate", () => {
        if (window.location.search.includes("business")) {
            const urlParams = new URLSearchParams(window.location.search);
            const businessId = urlParams.get("business");
            const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
            if (matchedBusiness) openModal(matchedBusiness);
        } else closeModalFunction();
    });
});