// document.addEventListener("DOMContentLoaded", async function () {

//     // console.log("DOM fully loaded and script running");

//     const carousel = document.querySelector(".carousel");
//     const leftBtn = document.querySelector(".carousel-btn.left");
//     const rightBtn = document.querySelector(".carousel-btn.right");
//     const modal = document.querySelector(".modal");
//     const modalContent = document.querySelector(".modal-content");
//     const closeModal = document.querySelector(".btn-close");
//     const backToTop = document.getElementById("backToTop");

//     let isSwiping = false;
//     let isSharing = false;

//     if (!carousel) {
//         console.warn("Carousel not found, skipping carousel logic");
//     }

//     let businesses = [];
//     try {
//         const response = await fetch("businesses.json");
//         if (!response.ok) throw new Error("Failed to fetch businesses.json");
//         businesses = await response.json();
//         // console.log("Businesses loaded successfully");
//     } catch (error) {
//         console.error("Error loading businesses.json:", error);
//     }

//     function createCard(business) {
//         const card = document.createElement("div");
//         card.classList.add("card");
//         card.innerHTML = `
//             <div class="image-card-container">
//                 <img src="${business.image}" alt="${business.name}">
//             </div>
//             <div class="card-content">
//                 <div class="business-name">
//                     <h2>${business.name}</h2>
//                 </div>
//                 <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
//             </div>
//         `;

//         card.setAttribute("data-business-id", business.id);

//         card.addEventListener("click", function (e) {
//             if (!isSwiping) openModal(business);
//         });

//         return card;
//     }

//     if (carousel) {
//         businesses.forEach((business) => {
//             const card = createCard(business);
//             carousel.appendChild(card);
//         });
//     }

//     const params = new URLSearchParams(window.location.search);
//     const businessId = params.get("business");
//     if (businessId) {
//         const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
//         if (matchedBusiness) {
//             openModal(matchedBusiness);
//         }
//     }

//     let isAnimating = false;
//     let cardWidth = getCardWidth();

//     function getCardWidth() {
//         const firstCard = document.querySelector(".card");
//         if (!firstCard) return 0;

//         const cardStyle = window.getComputedStyle(firstCard);
//         const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
//         const cardGap = 20;

//         return firstCard.offsetWidth + cardMarginRight + cardGap;
//     }

//     function updateCardWidth() {
//         cardWidth = getCardWidth();
//     }
//     window.addEventListener("resize", updateCardWidth);

//     function shiftLeft() {
//         if (isAnimating || !carousel) return;
//         isAnimating = true;

//         updateCardWidth();

//         const firstCard = carousel.firstElementChild;
//         const clone = firstCard.cloneNode(true);

//         const businessId = firstCard.getAttribute("data-business-id");
//         const business = businesses.find(b => b.id === parseInt(businessId));
//         if (business) {
//             clone.addEventListener("click", function (e) {
//                 if (!isSwiping) openModal(business);
//             });
//         }

//         carousel.appendChild(clone);
//         carousel.style.transition = "transform 0.4s ease-in-out";
//         carousel.style.transform = `translateX(-${cardWidth}px)`;

//         setTimeout(() => {
//             firstCard.remove();
//             carousel.style.transition = "none";
//             carousel.style.transform = "translateX(0)";
//             isAnimating = false;
//         }, 300);
//     }

//     function shiftRight() {
//         if (isAnimating || !carousel) return;
//         isAnimating = true;

//         updateCardWidth();

//         const lastCard = carousel.lastElementChild;
//         const clone = lastCard.cloneNode(true);

//         const businessId = lastCard.getAttribute("data-business-id");
//         const business = businesses.find(b => b.id === parseInt(businessId));
//         if (business) {
//             clone.addEventListener("click", function (e) {
//                 if (!isSwiping) openModal(business);
//             });
//         }

//         carousel.insertBefore(clone, carousel.firstElementChild);

//         carousel.style.transition = "none";
//         carousel.style.transform = `translateX(-${cardWidth}px)`;

//         requestAnimationFrame(() => {
//             requestAnimationFrame(() => {
//                 carousel.style.transition = "transform 0.4s ease-in-out";
//                 carousel.style.transform = "translateX(0)";

//                 setTimeout(() => {
//                     lastCard.remove();
//                     isAnimating = false;
//                 }, 50);
//             });
//         });
//     }

//     if (leftBtn && rightBtn) {
//         leftBtn.addEventListener("click", shiftRight);
//         rightBtn.addEventListener("click", shiftLeft);
//     }

//     let startX, moveX;

//     if (carousel) {
//         carousel.addEventListener("touchstart", (e) => {
//             isSwiping = false;
//             startX = e.touches[0].clientX;
//         });

//         carousel.addEventListener("touchmove", (e) => {
//             moveX = e.touches[0].clientX;
//             if (Math.abs(moveX - startX) > 30) isSwiping = true;
//         });

//         carousel.addEventListener("touchend", () => {
//             if (isSwiping && Math.abs(moveX - startX) > 50) {
//                 if (moveX < startX) shiftLeft();
//                 else shiftRight();
//             }
//         });
//     }

//     function openModal(business) {
//         if (!modal || !modalContent) {
//             console.error("Modal or modal content not found!");
//             return;
//         }
//         const timestamp = Date.now();
//         const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.id)}&v=${timestamp}`;

//         modalContent.innerHTML = `
//         <div class="card">
//             <div class="modal-image-card-container">
//             <img src="${business.image}" alt="${business.name}">
//             </div>
//             <div class="card-content">
//                 <div class="business-name">
//                     <h2>${business.name}</h2>
//                 </div>
//                 <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
//                 <a class="site-button save-ad" href="#" id="save-ad-link">Save Ad</a>
//                 <button class="site-button" id="share-button">Share</button>
//                 <div id="qr-code-container"></div>
//             </div>
//         </div>
//         `;

//         const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
//         const canShare = isMobile && navigator.share; // Check if share is supported

//         const saveButton = modalContent.querySelector(".save-ad");
//         saveButton.addEventListener("click", async (e) => {
//             e.preventDefault();

//             if (canShare) {
//                 try {
//                     const response = await fetch(business.image);
//                     if (!response.ok) throw new Error("Image fetch failed");
//                     const blob = await response.blob();
//                     const file = new File([blob], `${business.name}_ad.png`, { type: 'image/png' });

//                     if (navigator.canShare && navigator.canShare({ files: [file] })) {
//                         await navigator.share({
//                             files: [file],
//                             title: `Save ${business.name} Ad`,
//                             text: `Save this Ad from ${business.name} to your Photos!`,
//                         });
//                         return;
//                     }
//                 } catch (error) {
//                     console.error("Share failed:", error);
//                 }
//             }

//             const isMobileFallback = isMobile ? "Long-press or right-click the image to save or download the ad." : "Right-click the image to save or download the ad.";
//             alert(isMobileFallback);
//         });

//         const shareButton = document.getElementById("share-button");
//         if (shareButton) {
//             shareButton.addEventListener("click", () => {
//                 if (canShare && window.innerWidth < 768) {
//                     isSharing = true;
//                     navigator.share({
//                         title: business.name,
//                         text: `Discover why ${business.name} is a Local Gem!`,
//                         url: shareUrl,
//                     }).then(() => {
//                         isSharing = false;
//                         console.log("Share completed successfully");
//                     }).catch((error) => {
//                         console.error("Share failed:", error);
//                         isSharing = false;
//                         alert("Sharing failed. Please try again or use the QR code option.");
//                     });
//                 } else {
//                     const qrCodeContainer = document.getElementById("qr-code-container");
//                     if (qrCodeContainer && !qrCodeContainer.querySelector("#qr-code")) {
//                         qrCodeContainer.innerHTML = "";
//                         const qrCode = document.createElement("img");
//                         qrCode.id = "qr-code";
//                         qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
//                         qrCode.onerror = () => console.error("Failed to load QR code");
//                         qrCodeContainer.appendChild(qrCode);
//                         qrCodeContainer.style.padding = '20px';
//                         const closeButton = document.createElement("button");
//                         closeButton.id = "qr-close-button";
//                         closeButton.textContent = "Close";
//                         closeButton.style.display = "block";
//                         closeButton.style.marginTop = "10px";
//                         closeButton.addEventListener("click", () => {
//                             qrCodeContainer.innerHTML = "";
//                             qrCodeContainer.style.padding = "0";
//                         });
//                         qrCodeContainer.appendChild(closeButton);
//                     }
//                 }
//             });
//         }

//         window.history.pushState({ business: business.id }, "", shareUrl);
//         modal.classList.add("active");
//         if (carousel) {
//             carousel.style.pointerEvents = "none";
//             leftBtn.style.display = "none";
//             rightBtn.style.display = "none";
//         }
//     }

//     function closeModalFunction() {
//         if (!isSharing) {
//             modal.classList.remove("active");
//             if (carousel) {
//                 carousel.style.pointerEvents = "auto";
//                 leftBtn.style.display = "block";
//                 rightBtn.style.display = "block";
//             }
//             window.history.pushState({}, "", window.location.origin + window.location.pathname);
//         }
//     }

//     if (closeModal) {
//         console.log("Close modal button found");
//         closeModal.addEventListener("click", closeModalFunction);
//     } else {
//         console.warn("Close modal button (.btn-close) not found, skipping event listener");
//     }

//     if (modal) {
//         modal.addEventListener("click", (event) => {
//             if (event.target === modal) closeModalFunction();
//         });
//     } else {
//         console.warn("Modal element not found, skipping click event listener");
//     }

//     window.addEventListener("popstate", () => {
//         if (window.location.search.includes("business")) {
//             const urlParams = new URLSearchParams(window.location.search);
//             const businessId = urlParams.get("business");
//             const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
//             if (matchedBusiness) openModal(matchedBusiness);
//         } else if (modal) {
//             closeModalFunction();
//         }
//     });

//     function toggleBackToTop() {
//         if (window.scrollY > 200) {
//             backToTop.classList.add("visible");
//             // console.log('visible');
//         } else {
//             backToTop.classList.remove("visible");
//             // console.log('boo');
//         }
//     }

//     function scrollToTop() {
//         window.scrollTo({
//             top: 0,
//             behavior: "smooth"
//         });
//     }

//     if (backToTop) {
//         // console.log("Back to top button found");
//         window.addEventListener("scroll", toggleBackToTop);
//         backToTop.addEventListener("click", function(e) {
//             e.preventDefault();
//             // console.log("Back to top clicked");
//             scrollToTop();
//         });
//     } else {
//         console.error("Back to top button not found! Check ID 'backToTop' in HTML.");
//     }
// });

document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM fully loaded and script running");

    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".btn-close");
    // const backToTop = document.getElementById("backToTop");

    let isSwiping = false;
    let isSharing = false;

    if (!carousel) {
        console.warn("Carousel not found, skipping carousel logic");
    }

    let businesses = [];
    try {
        const response = await fetch("businesses.json");
        if (!response.ok) throw new Error("Failed to fetch businesses.json");
        businesses = await response.json();
        console.log("Businesses loaded successfully");
    } catch (error) {
        console.error("Error loading businesses.json:", error);
    }

    function createCard(business) {
        const card = document.createElement("div");
        card.classList.add("card");
        const name = business.name.trim();
        const wordCount = name.split(/\s+/).length;
        const charCount = name.length;
        // const fontSize = (wordCount > 4 || charCount > 26) ? "18px" : "24px";
        const fontSize = (wordCount > 4 || charCount > 26) ? "1rem" : null;

        card.innerHTML = `
            <div class="image-card-container">
                <img src="${business.image}" alt="${business.name}">
            </div>
            <div class="card-content">
                <div class="business-name">
                    <h2 style="font-size: ${fontSize}">${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
            </div>
        `;

        card.setAttribute("data-business-id", business.id);

        card.addEventListener("click", function (e) {
            if (!isSwiping) openModal(business);
        });

        return card;
    }

    if (carousel) {
        businesses.forEach((business) => {
            const card = createCard(business);
            carousel.appendChild(card);
        });
    }

    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");
    if (businessId) {
        const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
        if (matchedBusiness) {
            openModal(matchedBusiness);
        }
    }

    let isAnimating = false;
    let cardWidth = getCardWidth();

    function getCardWidth() {
        const firstCard = document.querySelector(".card");
        if (!firstCard) return 0;

        const cardStyle = window.getComputedStyle(firstCard);
        const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
        const cardGap = 20;

        return firstCard.offsetWidth + cardMarginRight + cardGap;
    }

    function updateCardWidth() {
        cardWidth = getCardWidth();
    }
    window.addEventListener("resize", updateCardWidth);

    function shiftLeft() {
        if (isAnimating || !carousel) return;
        isAnimating = true;

        updateCardWidth();

        const firstCard = carousel.firstElementChild;
        const clone = firstCard.cloneNode(true);

        const businessId = firstCard.getAttribute("data-business-id");
        const business = businesses.find(b => b.id === parseInt(businessId));
        if (business) {
            clone.addEventListener("click", function (e) {
                if (!isSwiping) openModal(business);
            });
        }

        carousel.appendChild(clone);
        carousel.style.transition = "transform 0.4s ease-in-out";
        carousel.style.transform = `translateX(-${cardWidth}px)`;

        setTimeout(() => {
            firstCard.remove();
            carousel.style.transition = "none";
            carousel.style.transform = "translateX(0)";
            isAnimating = false;
        }, 300);
    }

    function shiftRight() {
        if (isAnimating || !carousel) return;
        isAnimating = true;

        updateCardWidth();

        const lastCard = carousel.lastElementChild;
        const clone = lastCard.cloneNode(true);

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
                carousel.style.transition = "transform 0.4s ease-in-out";
                carousel.style.transform = "translateX(0)";

                setTimeout(() => {
                    lastCard.remove();
                    isAnimating = false;
                }, 50);
            });
        });
    }

    if (leftBtn && rightBtn) {
        leftBtn.addEventListener("click", shiftRight);
        rightBtn.addEventListener("click", shiftLeft);
    }

    let startX, moveX;

    if (carousel) {
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
    }

    function openModal(business) {
        if (!modal || !modalContent) {
            console.error("Modal or modal content not found!");
            return;
        }
        try {
            const timestamp = Date.now();
            const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.id)}&v=${timestamp}`;

            const name = business.name.trim();
            const wordCount = name.split(/\s+/).length;
            const charCount = name.length;
            const fontSize = (wordCount > 4 || charCount > 26) ? "18px" : "24px";

            modalContent.innerHTML = `
            <div class="card">
                <div class="modal-image-card-container">
                <img src="${business.image}" alt="${business.name}">
                </div>
                <div class="card-content">
                    <div class="business-name">
                        <h2 style="font-size: ${fontSize}">${business.name}</h2>
                    </div>
                    <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                    <a class="site-button save-ad" href="#" id="save-ad-link">Save Ad</a>
                    <button class="site-button" id="share-button">Share</button>
                    <div id="qr-code-container"></div>
                </div>
            </div>
            `;

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const canShare = isMobile && navigator.share;

            const saveButton = modalContent.querySelector(".save-ad");
            saveButton.addEventListener("click", async (e) => {
                e.preventDefault();

                if (canShare) {
                    try {
                        const response = await fetch(business.image);
                        if (!response.ok) throw new Error("Image fetch failed");
                        const blob = await response.blob();
                        const file = new File([blob], `${business.name}_ad.png`, { type: 'image/png' });

                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: `Save ${business.name} Ad`,
                                text: `Save this Ad from ${business.name} to your Photos!`,
                            });
                            return;
                        }
                    } catch (error) {
                        console.error("Share failed:", error);
                    }
                }

                const isMobileFallback = isMobile ? "Long-press or right-click the image to save or download the ad." : "Right-click the image to save or download the ad.";
                alert(isMobileFallback);
            });

            const shareButton = document.getElementById("share-button");
            if (shareButton) {
                shareButton.addEventListener("click", () => {
                    if (canShare && window.innerWidth < 768) {
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
                        const qrCodeContainer = document.getElementById("qr-code-container");
                        if (qrCodeContainer && !qrCodeContainer.querySelector("#qr-code")) {
                            qrCodeContainer.innerHTML = "";
                            const qrCode = document.createElement("img");
                            qrCode.id = "qr-code";
                            qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
                            qrCode.onerror = () => console.error("Failed to load QR code");
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
            }

            window.history.pushState({ business: business.id }, "", shareUrl);
            modal.classList.add("active");
            if (carousel) {
                carousel.style.pointerEvents = "none";
                leftBtn.style.display = "none";
                rightBtn.style.display = "none";
            }
        } catch (error) {
            console.error("Error in openModal:", error);
        }
    }

    function closeModalFunction() {
        if (!isSharing) {
            modal.classList.remove("active");
            if (carousel) {
                carousel.style.pointerEvents = "auto";
                leftBtn.style.display = "block";
                rightBtn.style.display = "block";
            }
            window.history.pushState({}, "", window.location.origin + window.location.pathname);
        }
    }

    if (closeModal) {
        console.log("Close modal button found");
        closeModal.addEventListener("click", closeModalFunction);
    } else {
        console.warn("Close modal button (.btn-close) not found, skipping event listener");
    }

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModalFunction();
        });
    } else {
        console.warn("Modal element not found, skipping click event listener");
    }

    window.addEventListener("popstate", () => {
        if (window.location.search.includes("business")) {
            const urlParams = new URLSearchParams(window.location.search);
            const businessId = urlParams.get("business");
            const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
            if (matchedBusiness) openModal(matchedBusiness);
        } else if (modal) {
            closeModalFunction();
        }
    });

    // Back to top functionality
    function toggleBackToTop() {
        console.log("Checking scroll position:", window.scrollY);
        if (window.scrollY > 20) {
            backToTop.classList.add("visible");
            console.log("Visible class added, current classes:", backToTop.className);
        } else {
            backToTop.classList.remove("visible");
            console.log("Visible class removed, current classes:", backToTop.className);
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    const backToTop = document.getElementById("backToTop");
    console.log("Back to top element:", backToTop);
    if (backToTop) {
        console.log("Back to top button found, attaching events");
        window.addEventListener("scroll", toggleBackToTop);
        backToTop.addEventListener("click", function(e) {
            e.preventDefault();
            console.log("Back to top clicked");
            scrollToTop();
        });
    } else {
        console.error("Back to top button not found! Check ID 'backToTop' in HTML.");
    }
});