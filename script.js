
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM fully loaded and script running");

    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".btn-close");
    // const backToTop = document.getElementById("backToTop");

    
    function getCardWidth() {
        const firstCard = document.querySelector(".card");
        if (!firstCard) return 0;

        const cardStyle = window.getComputedStyle(firstCard);
        const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
        const cardGap = 20;

        return firstCard.offsetWidth + cardMarginRight + cardGap;
    }

    let cardWidth = getCardWidth();

    function updateCardWidth() {
        cardWidth = getCardWidth();
    }
    window.addEventListener("resize", updateCardWidth);

    let isSharing = false;
    let businesses = []; // Declare businesses here

    if (!carousel) {
        console.warn("Carousel not found, skipping carousel logic");
    }

    // Load businesses (from local businesses.json)

    function createCard(business) {
        const card = document.createElement("div");
        card.classList.add("card");
        const name = business.name.trim();
        const wordCount = name.split(/\s+/).length;
        const charCount = name.length;
        let fontSizeStyle = "";
        if (wordCount > 4 || charCount > 26) {
            fontSizeStyle = 'style="font-size: .9rem"';
        }

        card.innerHTML = `
            <div class="image-card-container">
                <img src="${business.image}" alt="${business.name}">
            </div>
            <div class="card-content">
                <div class="business-name">
                    <h2 ${fontSizeStyle}>${business.name}</h2>
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

    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");
    if (businessId) {
        const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
        if (matchedBusiness) {
            openModal(matchedBusiness);
        }
    }

    let isAnimating = false;

    function shiftLeft() {
        if (isAnimating || !carousel || !carousel.firstElementChild) return;
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
        if (isAnimating || !carousel || !carousel.lastElementChild) return;
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
            let fontSizeStyle = "";
            if (wordCount > 4 || charCount > 26) {
                fontSizeStyle = 'style="font-size: 18px"';
            }

            modalContent.innerHTML = `
            <div class="card">
                <div class="modal-image-card-container">
                <img src="${business.image}" alt="${business.name}">
                </div>
                <div class="card-content">
                    <div class="business-name">
                        <h2 ${fontSizeStyle}>${business.name}</h2>
                    </div>
                    <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
                    <a class="site-button save-ad" href="#" id="save-ad-link">Save Ad</a>
                    <button class="site-button" id="share-button">Share</button>
                    <div id="qr-code-container"></div>
                </div>
            </div>
            `;

            // Device / capability detection
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            // Better iOS detection (iPadOS touch Macs handled)
            const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const supportsShare = !!navigator.share; // Basic Web Share API support
            const supportsCanShare = typeof navigator.canShare === 'function'; // for file sharing (may be absent on iOS but present on some Android)

            // Save Ad - try file sharing when available (files)
            // const saveButton = modalContent.querySelector(".save-ad");
            // if (saveButton) {
            //     saveButton.addEventListener("click", async (e) => {
            //         e.preventDefault();

            //         // Attempt to share image file if browser supports file sharing
            //         if (supportsShare && supportsCanShare) {
            //             try {
            //                 const response = await fetch(business.image);
            //                 if (!response.ok) throw new Error("Image fetch failed");
            //                 const blob = await response.blob();
            //                 const file = new File([blob], `${business.name}_ad.png`, { type: 'image/png' });

            //                 if (navigator.canShare({ files: [file] })) {
            //                     try {
            //                         await navigator.share({
            //                             files: [file],
            //                             title: `Save ${business.name} Ad`,
            //                             text: `Save this Ad from ${business.name} to your Photos!`,
            //                         });
            //                         return;
            //                     } catch (shareErr) {
            //                         console.error("File share failed:", shareErr);
            //                         // fall through to fallback below
            //                     }
            //                 }
            //             } catch (error) {
            //                 console.error("Preparing file for share failed:", error);
            //                 // fall through to fallback below
            //             }
            //         }

            //         const isMobileFallback = isMobile ? "Long-press or tap and hold the image to save or download the ad." : "Right-click the image to save or download the ad.";
            //         alert(isMobileFallback);
            //     });
            // } else {
            //     console.warn("Save button not found in modalContent");
            // }

const saveButton = modalContent.querySelector(".save-ad");
if (saveButton) {
    saveButton.addEventListener("click", async (e) => {
        e.preventDefault();

        // First, try Web Share API with file sharing if supported
        if (supportsShare && supportsCanShare) {
            try {
                const response = await fetch(business.image);
                if (!response.ok) throw new Error("Image fetch failed");
                const blob = await response.blob();
                const file = new File([blob], `${business.name}_ad.png`, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Save ${business.name} Ad`,
                            text: `Save this Ad from ${business.name} to your Photos!`,
                        });
                        return; // success, done here
                    } catch (shareErr) {
                        console.error("File share failed:", shareErr);
                        // Fall through to fallback
                    }
                }
            } catch (error) {
                console.error("Preparing file for share failed:", error);
                // Fall through to fallback
            }
        }

        // Fallback: try to download the image directly
        try {
            // Use fetch + blob to avoid CORS problems or direct download link
            const response = await fetch(business.image);
            if (!response.ok) throw new Error("Image fetch failed");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Create a hidden download link and click it programmatically
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = `${business.name}_ad.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();

            // Cleanup
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobUrl);
        } catch (downloadError) {
            console.error("Direct download failed:", downloadError);

            // If all else fails, show instructions
            const isMobileFallback = isMobile
                ? "Long-press or tap and hold the image to save or download the ad."
                : "Right-click the image to save or download the ad.";
            alert(isMobileFallback);
        }
    });
} else {
    console.warn("Save button not found in modalContent");
}


            // Share button: use navigator.share on mobile/iOS when available; otherwise show QR code
            const shareButton = document.getElementById("share-button");
            if (shareButton) {
                shareButton.addEventListener("click", async () => {
                    // Decide if we should use native share sheet:
                    // - Browser must support navigator.share
                    // - Prefer native share on mobile or iOS Safari (skip QR entirely on iOS)
                    const canUseNativeShareSheet = supportsShare && (isMobile || isiOS || window.innerWidth < 768);

                    if (canUseNativeShareSheet) {
                        isSharing = true;
                        try {
                            await navigator.share({
                                title: business.name,
                                text: `Discover why ${business.name} is a Local Gem!`,
                                url: shareUrl,
                            });
                            console.log("Share completed successfully");
                        } catch (error) {
                            console.error("Share failed:", error);
                            alert("Sharing failed. Please try again or use the QR code option.");
                        } finally {
                            isSharing = false;
                        }
                    } else {
                        const qrCodeContainer = document.getElementById("qr-code-container");
                        if (qrCodeContainer && !qrCodeContainer.querySelector("#qr-code")) {
                            qrCodeContainer.innerHTML = "";
                            const qrCode = document.createElement("img");
                            qrCode.id = "qr-code";
                            qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
                            qrCode.onload = () => console.log("QR code loaded");
                            qrCode.onerror = () => {
                                console.error("Failed to load QR code, using fallback");
                                qrCodeContainer.innerHTML = "<p>QR code unavailable</p>";
                            };
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

            // push state to URL so share link includes business
            window.history.pushState({ business: business.id }, "", shareUrl);
            modal.classList.add("active");
            if (carousel) {
                carousel.style.pointerEvents = "none";
                if (leftBtn) leftBtn.style.display = "none";
                if (rightBtn) rightBtn.style.display = "none";
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
                if (leftBtn) leftBtn.style.display = "block";
                if (rightBtn) rightBtn.style.display = "block";
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

    async function loadBusinesses() {
        try {
            // Fetch local JSON file instead of API
            const response = await fetch('businesses.json', {
                cache: 'no-cache' // helpful during development
            });

            if (!response.ok) {
                throw new Error(`Failed to load businesses.json: ${response.status}`);
            }

            const data = await response.json();
            console.log("Businesses loaded successfully from local JSON");

            // Reset array & push new data
            businesses.length = 0;
            businesses.push(...data);
        } catch (error) {
            console.error('Error loading businesses from JSON:', error);
            alert('Failed to load businesses from local file. Make sure businesses.json is in the correct location and served by your host.');
        }

        // Populate carousel
        if (carousel && carousel.parentElement) { // Ensure carousel exists and is in DOM
            carousel.innerHTML = '';
            if (businesses.length > 0) {
                businesses.forEach((business) => {
                    const card = createCard(business);
                    carousel.appendChild(card);
                });
                // Update cardWidth now that cards exist
                updateCardWidth();
            } else {
                carousel.innerHTML = '<p>No businesses available.</p>';
            }
        }

        // If URL had a business query param, try to open it (extra safety)
        if (businessId) {
            const matchedBusiness = businesses.find(b => b.id === parseInt(businessId));
            if (matchedBusiness && modal && !modal.classList.contains('active')) {
                // small delay to ensure DOM updates are done
                setTimeout(() => {
                    openModal(matchedBusiness);
                }, 50);
            }
        }
        return businesses;
    }

    await loadBusinesses();

});
