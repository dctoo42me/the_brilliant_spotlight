document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM fully loaded and script running");

  const carousel = document.querySelector(".carousel");
  const leftBtn = document.querySelector(".carousel-btn.left");
  const rightBtn = document.querySelector(".carousel-btn.right");
  const modal = document.querySelector(".modal");
  const modalContent = document.querySelector(".modal-content");
  const closeModal = document.querySelector(".btn-close");
  const campaignTitle = document.getElementById("campaign-title");

  // Create a minimal dropdown container for campaign selector
  // Insert dropdown near campaignTitle if exists, else top of body
//   let campaignSelect;
    const campaignSelect = document.getElementById("campaignSelect");
    window.setCampaignDropdownVisibility = function(visible) {
  const container = document.getElementById("campaign-selector-container");
  if (container) {
    container.style.display = visible ? "block" : "none";
  }
};



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
  let isSwiping = false;
  let businesses = []; // Declare businesses here
  let campaigns = []; // Loaded from campaigns.json
  let currentCampaign = null;

  if (!carousel) {
    console.warn("Carousel not found, skipping carousel logic");
  }

  // Fill campaigns dropdown with options
  function populateCampaignDropdown() {
    if (!campaignSelect) return;

    campaignSelect.innerHTML = ""; // Clear existing options
    campaigns.forEach((camp, index) => {
      const option = document.createElement("option");
      option.value = camp.id;
      option.textContent = camp.name;
      campaignSelect.appendChild(option);
    });

    // Set dropdown to current campaign if found
    if (currentCampaign) {
      campaignSelect.value = currentCampaign.id;
    }
  }

  // Load campaigns.json config
  async function loadCampaignsConfig() {
    try {
      const response = await fetch("./data/campaigns.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load campaigns.json: ${response.status}`);
      }
      campaigns = await response.json();

      if (campaigns.length === 0) {
        alert("No campaigns found in campaigns.json");
        return;
      }

      // Set default campaign as first in list if no currentCampaign yet
      if (!currentCampaign) {
        currentCampaign = campaigns[0];
      }
      populateCampaignDropdown();
    } catch (error) {
      console.error("Error loading campaigns config:", error);
      alert("Failed to load campaigns configuration.");
    }
  }

  // Load businesses file based on currentCampaign.id
  async function loadBusinesses() {
    if (!currentCampaign || !currentCampaign.id) {
      console.warn("No current campaign selected, skipping businesses load.");
      return;
    }
    try {
      const filename = `./data/businesses-${currentCampaign.id}.json`;
      console.log(`Loading businesses from ${filename}`);

      const response = await fetch(filename, { cache: "no-cache" });

      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Businesses loaded successfully from ${filename}`);

      businesses.length = 0;
      businesses.push(...data);
    } catch (error) {
      console.error("Error loading businesses from JSON:", error);
      alert(`Failed to load businesses for campaign: ${currentCampaign.name}`);
    }

    // Populate carousel
    if (carousel && carousel.parentElement) {
      carousel.innerHTML = "";
      if (businesses.length > 0) {
        businesses.forEach((business) => {
          const card = createCard(business);
          carousel.appendChild(card);
        });
        updateCardWidth();
      } else {
        carousel.innerHTML = "<p>No businesses available.</p>";
      }
    }

    // If URL has business param, open modal
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");
    if (businessId) {
      const matchedBusiness = businesses.find((b) => b.id === parseInt(businessId));
      if (matchedBusiness && modal && !modal.classList.contains("active")) {
        setTimeout(() => {
          openModal(matchedBusiness);
        }, 50);
      }
    }
  }

  // Update campaign title text dynamically
  function updateCampaignTitle() {
    if (campaignTitle && currentCampaign && currentCampaign.name) {
      campaignTitle.textContent = currentCampaign.name;
    }
  }

document.addEventListener("DOMContentLoaded", () => {
  const campaignSelect = document.getElementById("campaignSelect");

  if (campaignSelect) { // ✅ Avoids errors when dropdown isn't present
    campaignSelect.addEventListener("change", async (e) => {
      const selectedId = e.target.value;
      const selectedCampaign = campaigns.find((c) => c.id === selectedId);

      if (selectedCampaign) {
        currentCampaign = selectedCampaign;
        updateCampaignTitle();
        console.log(`Campaign switched to: ${currentCampaign.name} (ID: ${currentCampaign.id})`);
        showNotification(`Switched to campaign: ${currentCampaign.name}`);
        await loadBusinesses();
      }
    });
  }
});


  // Your existing createCard function (unchanged)
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

  // Rest of your original code unchanged below
  // (shiftLeft, shiftRight, modal open/close, share, etc.)

  // -- shiftLeft --
  let isAnimating = false;
  function shiftLeft() {
    if (isAnimating || !carousel || !carousel.firstElementChild) return;
    isAnimating = true;

    updateCardWidth();

    const firstCard = carousel.firstElementChild;
    const clone = firstCard.cloneNode(true);

    const businessId = firstCard.getAttribute("data-business-id");
    const business = businesses.find((b) => b.id === parseInt(businessId));
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

  // -- shiftRight --
  function shiftRight() {
    if (isAnimating || !carousel || !carousel.lastElementChild) return;
    isAnimating = true;

    updateCardWidth();

    const lastCard = carousel.lastElementChild;
    const clone = lastCard.cloneNode(true);

    const businessId = lastCard.getAttribute("data-business-id");
    const business = businesses.find((b) => b.id === parseInt(businessId));
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

  // -- Modal open logic --
  function openModal(business) {
    if (!modal || !modalContent) {
      console.error("Modal or modal content not found!");
      return;
    }
    try {
      const timestamp = Date.now();
      const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(
        business.id
      )}&v=${timestamp}`;

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
      const isiOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const supportsShare = !!navigator.share;
      const supportsCanShare = typeof navigator.canShare === "function";

      const saveButton = modalContent.querySelector(".save-ad");
      saveButton.addEventListener("click", async (e) => {
        e.preventDefault();

        if (supportsShare && supportsCanShare) {
          try {
            const response = await fetch(business.image);
            if (!response.ok) throw new Error("Image fetch failed");
            const blob = await response.blob();
            const file = new File([blob], `${business.name}_ad.png`, { type: "image/png" });

            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title: `Save ${business.name} Ad`,
                  text: `Save this Ad from ${business.name} to your Photos!`,
                });
                return;
              } catch (shareErr) {
                console.error("File share failed:", shareErr);
              }
            }
          } catch (error) {
            console.error("Preparing file for share failed:", error);
          }
        }

        try {
          const response = await fetch(business.image);
          if (!response.ok) throw new Error("Image fetch failed");
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const downloadLink = document.createElement("a");
          downloadLink.href = blobUrl;
          downloadLink.download = `${business.name}_ad.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();

          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobUrl);
        } catch (downloadError) {
          console.error("Direct download failed:", downloadError);

          const isMobileFallback = isMobile
            ? "Long-press or tap and hold the image to save or download the ad."
            : "Right-click the image to save or download the ad.";
          alert(isMobileFallback);
        }
      });

      const shareButton = document.getElementById("share-button");
      if (shareButton) {
        shareButton.addEventListener("click", async () => {
          const canUseNativeShareSheet =
            supportsShare && (isMobile || isiOS || window.innerWidth < 768);

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
              qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                shareUrl
              )}`;
              qrCode.onload = () => console.log("QR code loaded");
              qrCode.onerror = () => {
                console.error("Failed to load QR code, using fallback");
                qrCodeContainer.innerHTML = "<p>QR code unavailable</p>";
              };
              qrCodeContainer.appendChild(qrCode);
              qrCodeContainer.style.padding = "20px";
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
      const matchedBusiness = businesses.find((b) => b.id === parseInt(businessId));
      if (matchedBusiness) openModal(matchedBusiness);
    } else if (modal) {
      closeModalFunction();
    }
  });

//   show notification
function showNotification(message, duration = 3000) {
  let notif = document.getElementById("campaign-notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "campaign-notification";
    notif.style.position = "fixed";
    notif.style.top = "10px";
    notif.style.left = "50%";
    notif.style.transform = "translateX(-50%)";
    notif.style.backgroundColor = "#333";
    notif.style.color = "#fff";
    notif.style.padding = "10px 20px";
    notif.style.borderRadius = "5px";
    notif.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    notif.style.zIndex = "9999";
    notif.style.fontSize = "1rem";
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s ease";
    document.body.appendChild(notif);
  }

  notif.textContent = message;
  notif.style.opacity = "1";

  setTimeout(() => {
    notif.style.opacity = "0";
  }, duration);
}


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
      behavior: "smooth",
    });
  }

  const backToTop = document.getElementById("backToTop");
  console.log("Back to top element:", backToTop);
  if (backToTop) {
    console.log("Back to top button found, attaching events");
    window.addEventListener("scroll", toggleBackToTop);
    backToTop.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Back to top clicked");
      scrollToTop();
    });
  } else {
    console.error("Back to top button not found! Check ID 'backToTop' in HTML.");
  }

  // Initial load sequence:
  await loadCampaignsConfig();
  updateCampaignTitle();
  await loadBusinesses();
});
