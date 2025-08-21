/* full script.js - merged + refactored with DATA_BASE_PATH & FULL_DATA_BASE_PATH logic
   Keep this file as your site's script.js. Add one (or both) of these lines in your archived HTML
   before this script loads if you want to target a specific archive:
     window.DATA_BASE_PATH = '/data/2025/08/campaign_1';
     window.FULL_DATA_BASE_PATH = '/data/2025/08/campaign_1/businesses-August2025_North_Austin.json';

   NOTE: Use leading '/' for server-root paths or './' for local-relative. The loader normalizes both.
*/

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM fully loaded and script running");

  // --------------------------
  // DOM ELEMENTS (existing UI)
  // --------------------------
  const carousel = document.querySelector(".carousel");
  const leftBtn = document.querySelector(".carousel-btn.left");
  const rightBtn = document.querySelector(".carousel-btn.right");
  const modal = document.querySelector(".modal");
  const modalContent = document.querySelector(".modal-content");
  const closeModal = document.querySelector(".btn-close");
  const campaignTitle = document.getElementById("campaign-title");
  // Your page may or may not have a #campaignSelect present; code handles both cases gracefully.
  const campaignSelect = document.getElementById("campaignSelect");

  // --------------------------
  // GLOBAL HELPERS (exposed)
  // --------------------------
  // Keep toggle function available globally (useful from console)
  window.setCampaignDropdownVisibility = function (visible) {
    const container = document.getElementById("campaign-selector-container");
    if (container) container.style.display = visible ? "block" : "none";
  };

  // --------------------------
  // Helpers: path normalization
  // --------------------------
  // Normalize folder-like path into a form fetch likes:
  // - If path begins with '/', './', '../' or 'http', return as-is except trim trailing slash.
  // - If path is relative without leading './', add './' so it works in most dev setups.
  function normalizeFolderPath(p) {
    if (!p) return "";
    p = String(p).trim();
    // remove trailing slash
    p = p.replace(/\/+$/, "");
    if (/^(\/|\.\.\/|\.\/|https?:\/\/)/.test(p)) return p;
    return "./" + p;
  }

  // Normalize file path similarly (keeps filename)
  function normalizeFilePath(p) {
    if (!p) return "";
    p = String(p).trim();
    // remove trailing slash (shouldn't be a file)
    p = p.replace(/\/+$/, "");
    if (/^(\/|\.\.\/|\.\/|https?:\/\/)/.test(p)) return p;
    return "./" + p;
  }

  // Extract campaign id from a filename like .../businesses-<campaignId>.json
  function extractCampaignIdFromFilename(path) {
    if (!path) return null;
    const m = path.match(/businesses-([^\/?#]+)\.json$/i);
    return m ? m[1] : null;
  }

  // Fetch JSON if exists; returns parsed object or null (no exceptions thrown upstream)
  async function fetchJsonIfExists(url) {
    if (!url) return null;
    try {
      const resp = await fetch(url, { cache: "no-cache" });
      if (!resp.ok) return null;
      const json = await resp.json();
      return json;
    } catch (err) {
      // network error, parse error, or file not available
      return null;
    }
  }

  // --------------------------
  // Layout helpers (unchanged behavior)
  // --------------------------
  function getCardWidth() {
    const firstCard = document.querySelector(".card");
    if (!firstCard) return 0;
    const cardStyle = window.getComputedStyle(firstCard);
    const cardMarginRight = parseInt(cardStyle.marginRight) || 0;
    const cardGap = 20;
    return firstCard.offsetWidth + cardMarginRight + cardGap;
  }
  let cardWidth = getCardWidth();
  function updateCardWidth() { cardWidth = getCardWidth(); }
  window.addEventListener("resize", updateCardWidth);

  // --------------------------
  // Data state
  // --------------------------
  let isSharing = false;
  let isSwiping = false;
  let businesses = []; // current businesses array
  let campaigns = [];  // campaigns config array
  let currentCampaign = null;

  if (!carousel) {
    console.warn("Carousel not found, skipping carousel logic");
  }

  // --------------------------
  // Campaigns config loader
  // Strategy:
  // 1) If FULL_DATA_BASE_PATH is set, try to load campaigns.json from the same folder.
  // 2) Else if DATA_BASE_PATH is set, try DATA_BASE_PATH + '/campaigns.json'
  // 3) Fallback: ./data/campaigns.json
  // --------------------------
  async function loadCampaignsConfig() {
    let triedPaths = [];

    // Candidate 1: folder derived from FULL_DATA_BASE_PATH (if provided)
    if (window.FULL_DATA_BASE_PATH) {
      const normalizedFull = normalizeFilePath(window.FULL_DATA_BASE_PATH);
      // derive folder (drop filename)
      const lastSlashIdx = normalizedFull.lastIndexOf("/");
      if (lastSlashIdx > -1) {
        const folder = normalizedFull.slice(0, lastSlashIdx);
        const candidate = folder + "/campaigns.json";
        triedPaths.push(candidate);
        const data = await fetchJsonIfExists(candidate);
        if (data) {
          campaigns = data;
          console.log("Loaded campaigns from (folder of FULL_DATA_BASE_PATH):", candidate);
          return campaigns;
        }
      }
    }

    // Candidate 2: if window.DATA_BASE_PATH is set, try that folder's campaigns.json
    if (window.DATA_BASE_PATH) {
      const base = normalizeFolderPath(window.DATA_BASE_PATH);
      const candidate = base + "/campaigns.json";
      triedPaths.push(candidate);
      const data = await fetchJsonIfExists(candidate);
      if (data) {
        campaigns = data;
        console.log("Loaded campaigns from DATA_BASE_PATH:", candidate);
        return campaigns;
      }
    }

    // Candidate 3: fallback to root ./data/campaigns.json
    const fallback = "./data/campaigns.json";
    triedPaths.push(fallback);
    const dataFallback = await fetchJsonIfExists(fallback);
    if (dataFallback) {
      campaigns = dataFallback;
      console.log("Loaded campaigns from fallback:", fallback);
      return campaigns;
    }

    // Nothing found
    console.warn("No campaigns.json found at any candidate paths. Tried:", triedPaths);
    campaigns = []; // empty
    return null;
  }

  // Populate the dropdown UI (if present) with campaigns
  function populateCampaignDropdown() {
    if (!campaignSelect) return;
    campaignSelect.innerHTML = "";
    campaigns.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name || c.id;
      campaignSelect.appendChild(opt);
    });
    // select currentCampaign if set
    if (currentCampaign && campaignSelect.querySelector(`option[value="${currentCampaign.id}"]`)) {
      campaignSelect.value = currentCampaign.id;
    }
  }

  // --------------------------
  // Businesses loader
  // Behavior:
  // - If FULL_DATA_BASE_PATH is set: load exactly that JSON file (and set currentCampaign by matching campaign id if campaigns.json available)
  // - Else: determine base folder as:
  //     1) If window.DATA_BASE_PATH present -> use that as base
  //     2) else if currentCampaign.folder present -> use './data/' + currentCampaign.folder
  //     3) else -> fallback root './data'
  //   then attempt base + /businesses-<campaignId>.json, fallback to ./data/businesses-<campaignId>.json
  // --------------------------
  async function loadBusinesses() {
    // If FULL override exists -> load directly
    if (window.FULL_DATA_BASE_PATH) {
      const fullPath = normalizeFilePath(window.FULL_DATA_BASE_PATH);
      console.log("Loading businesses directly from FULL_DATA_BASE_PATH:", fullPath);
      const data = await fetchJsonIfExists(fullPath);
      if (!data) {
        // Report helpful guidance
        alert(`Failed to load businesses from FULL_DATA_BASE_PATH: ${fullPath}\nCheck the path and that the file exists on the server.`);
        return;
      }
      businesses.length = 0;
      businesses.push(...data);

      // If campaigns array exists, attempt to set currentCampaign using campaign id from filename (to set proper name)
      if (campaigns && campaigns.length > 0) {
        const idFromFile = extractCampaignIdFromFilename(fullPath);
        if (idFromFile) {
          const found = campaigns.find(c => c.id === idFromFile);
          if (found) currentCampaign = found;
          else {
            // If not found, create a minimal currentCampaign so title doesn't show stale value
            currentCampaign = { id: idFromFile, name: idFromFile };
          }
        }
      } else {
        // if no campaigns loaded, try to load campaigns.json from same folder now (best-effort)
        const lastSlash = fullPath.lastIndexOf("/");
        if (lastSlash > -1) {
          const folder = fullPath.slice(0, lastSlash);
          const campPathCandidate = folder + "/campaigns.json";
          const cfg = await fetchJsonIfExists(campPathCandidate);
          if (cfg) {
            campaigns = cfg;
            // try to find id & set name
            const idFromFile = extractCampaignIdFromFilename(fullPath);
            const found = campaigns.find(c => c.id === idFromFile);
            if (found) currentCampaign = found;
          }
        }
      }

      // Log loaded path so you can copy/paste to archive HTML
      console.log("Loaded businesses from:", fullPath);
    } else {
      // Normal dynamic mode (dropdown + folder)
      if (!currentCampaign || !currentCampaign.id) {
        console.warn("No current campaign selected, skipping businesses load.");
        return;
      }

      // Determine base folder (priority: window.DATA_BASE_PATH > currentCampaign.folder > './data')
      let baseFolder = "";
      if (window.DATA_BASE_PATH) {
        baseFolder = normalizeFolderPath(window.DATA_BASE_PATH);
      } else if (currentCampaign.folder) {
        // currentCampaign.folder likely like '2025/08/campaign_1' (relative to data/)
        baseFolder = normalizeFolderPath(`./data/${currentCampaign.folder}`);
      } else {
        baseFolder = "./data";
      }

      // Ensure no duplicate trailing slashes
      baseFolder = baseFolder.replace(/\/+$/, "");

      // Construct candidate paths
      const archivePath = `${baseFolder}/businesses-${currentCampaign.id}.json`;
      const rootPath = `./data/businesses-${currentCampaign.id}.json`;

      console.log("Trying to load businesses from archive path:", archivePath);
      let data = await fetchJsonIfExists(archivePath);
      if (!data) {
        console.log("Archive path failed. Falling back to root path:", rootPath);
        data = await fetchJsonIfExists(rootPath);
        if (!data) {
          alert(`Failed to load businesses for campaign: ${currentCampaign.name}\nTried:\n${archivePath}\n${rootPath}`);
          return;
        } else {
          console.log("Loaded businesses from:", rootPath);
        }
      } else {
        console.log("Loaded businesses from:", archivePath);
      }

      businesses.length = 0;
      businesses.push(...data);
    }

    // Now update the UI carousel with the businesses we've got
    if (carousel && carousel.parentElement) {
      carousel.innerHTML = "";
      if (businesses.length > 0) {
        businesses.forEach(b => {
          const card = createCard(b);
          carousel.appendChild(card);
        });
        updateCardWidth();
      } else {
        carousel.innerHTML = "<p>No businesses available.</p>";
      }
    }

    // If URL has business id param, open that business modal
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("business");
    if (businessId) {
      const matchedBusiness = businesses.find(b => String(b.id) === String(businessId) || b.id === parseInt(businessId));
      if (matchedBusiness && modal && !modal.classList.contains("active")) {
        setTimeout(() => openModal(matchedBusiness), 50);
      }
    }

    // Update campaign title based on chosen campaign object (if present)
    updateCampaignTitle();
  }

  // Update campaign title element text
  function updateCampaignTitle() {
    if (campaignTitle) {
      const name = (currentCampaign && currentCampaign.name) ? currentCampaign.name : "";
      campaignTitle.textContent = name;
    }
  }

  // --------------------------
  // Campaign select handler (if present)
  // --------------------------
  if (campaignSelect) {
    campaignSelect.addEventListener("change", async (e) => {
      const selectedId = e.target.value;
      const selectedCampaign = campaigns.find(c => c.id === selectedId);
      if (selectedCampaign) {
        currentCampaign = selectedCampaign;
        updateCampaignTitle();
        console.log(`Campaign switched to: ${currentCampaign.name} (ID: ${currentCampaign.id})`);
        showNotification(`Switched to campaign: ${currentCampaign.name}`);
        await loadBusinesses();
      }
    });
  }

  // --------------------------
  // Card rendering & existing UI functions (unchanged)
  // --------------------------
  function createCard(business) {
    const card = document.createElement("div");
    card.classList.add("card");

    const name = (business.name || "").trim();
    const wordCount = name.split(/\s+/).length;
    const charCount = name.length;
    let fontSizeStyle = "";
    if (wordCount > 4 || charCount > 26) fontSizeStyle = 'style="font-size: .9rem"';

    card.innerHTML = `
      <div class="image-card-container">
        <img src="${business.image && business.image.trim() !== "" ? business.image : '/images/projects/placeholder.png'}" alt="${business.name}">
      </div>
      <div class="card-content">
        <div class="business-name">
          <h2 ${fontSizeStyle}>${business.name}</h2>
        </div>
        <a class="site-button" href="${business.website}" target="_blank">Visit Website</a>
      </div>
    `;

    // Fallback if the image file fails to load
    const imgEl = card.querySelector("img");
    imgEl.onerror = function() {
        this.onerror = null; // Prevent infinite loop
        this.src = "/images/projects/placeholder.png";
    };

    card.setAttribute("data-business-id", business.id);
    card.addEventListener("click", function (e) {
        if (!isSwiping) openModal(business);
    });

    return card;
}


  // -- Carousel shifts (unchanged) --
  let isAnimating = false;
  function shiftLeft() {
    if (isAnimating || !carousel || !carousel.firstElementChild) return;
    isAnimating = true;
    updateCardWidth();
    const firstCard = carousel.firstElementChild;
    const clone = firstCard.cloneNode(true);
    const businessId = firstCard.getAttribute("data-business-id");
    const business = businesses.find(b => String(b.id) === String(businessId));
    if (business) clone.addEventListener("click", () => { if (!isSwiping) openModal(business); });

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
    const business = businesses.find(b => String(b.id) === String(businessId));
    if (business) clone.addEventListener("click", () => { if (!isSwiping) openModal(business); });

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

  // touch swipe detection (unchanged)
  let startX, moveX;
  if (carousel) {
    carousel.addEventListener("touchstart", (e) => { isSwiping = false; startX = e.touches[0].clientX; });
    carousel.addEventListener("touchmove", (e) => { moveX = e.touches[0].clientX; if (Math.abs(moveX - startX) > 30) isSwiping = true; });
    carousel.addEventListener("touchend", () => {
      if (isSwiping && Math.abs(moveX - startX) > 50) {
        if (moveX < startX) shiftLeft();
        else shiftRight();
      }
    });
  }

  // --------------------------
  // Modal / share / save-ad logic (unchanged core behavior)
  // --------------------------
function openModal(business) {
    if (!modal || !modalContent) {
        console.error("Modal or modal content not found!");
        return;
    }
    try {
        const timestamp = Date.now();
        const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(business.id)}&v=${timestamp}`;
        const name = (business.name || "").trim();
        const wordCount = name.split(/\s+/).length;
        const charCount = name.length;
        let fontSizeStyle = "";
        if (wordCount > 4 || charCount > 26) fontSizeStyle = 'style="font-size: 18px"';

        modalContent.innerHTML = `
            <div class="card">
                <div class="modal-image-card-container">
                    <img src="${business.image && business.image.trim() !== "" ? business.image : '/images/projects/placeholder.png'}" alt="${business.name}">
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

        // Image fallback for broken/missing files
        const imgEl = modalContent.querySelector("img");
        imgEl.onerror = function() {
            this.onerror = null; // prevent loop
            this.src = "/images/projects/placeholder.png";
        };

        // device checks
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const supportsShare = !!navigator.share;
        const supportsCanShare = typeof navigator.canShare === "function";

        // save-ad logic
        const saveButton = modalContent.querySelector(".save-ad");
        if (saveButton) {
            saveButton.addEventListener("click", async (e) => {
                e.preventDefault();
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
                                    text: `Save this Ad from ${business.name} to your Photos!`
                                });
                                return;
                            } catch (shareErr) {
                                console.error("File share failed:", shareErr);
                            }
                        }
                    } catch (err) {
                        console.error("Preparing file for share failed:", err);
                    }
                }
                // fallback to download
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
                    alert(isMobile ? "Long-press the image to save." : "Right-click the image to save.");
                }
            });
        }

        // share button logic
        const shareButton = document.getElementById("share-button");
        if (shareButton) {
            shareButton.addEventListener("click", async () => {
                const canUseNativeShareSheet = supportsShare && (isMobile || isiOS || window.innerWidth < 768);
                if (canUseNativeShareSheet) {
                    isSharing = true;
                    try {
                        await navigator.share({
                            title: business.name,
                            text: `Discover why ${business.name} is a Local Gem!`,
                            url: shareUrl
                        });
                    } catch (err) {
                        console.error("Share failed:", err);
                        alert("Sharing failed. Try the QR code.");
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

        // push state + show modal
        window.history.pushState({ business: business.id }, "", shareUrl);
        modal.classList.add("active");
        if (carousel) {
            carousel.style.pointerEvents = "none";
            if (leftBtn) leftBtn.style.display = "none";
            if (rightBtn) rightBtn.style.display = "none";
        }
    } catch (err) {
        console.error("Error in openModal:", err);
    }
}


  // Modal close
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

  // Attach close modal events
  if (closeModal) {
    closeModal.addEventListener("click", closeModalFunction);
  }
  if (modal) {
    modal.addEventListener("click", (event) => {
      // close if clicked the overlay outside modal content
      if (event.target === modal) closeModalFunction();
    });
  }

  // popstate: if URL contains business param open modal
  window.addEventListener("popstate", () => {
    if (window.location.search.includes("business")) {
      const urlParams = new URLSearchParams(window.location.search);
      const businessId = urlParams.get("business");
      const matchedBusiness = businesses.find(b => String(b.id) === String(businessId) || b.id === parseInt(businessId));
      if (matchedBusiness) openModal(matchedBusiness);
    } else if (modal) {
      closeModalFunction();
    }
  });

  // --------------------------
  // Small notification helper (non-blocking, nicer than alert)
  // --------------------------
  function showNotification(message, duration = 2200) {
    let notif = document.getElementById("campaign-notification");
    if (!notif) {
      notif = document.createElement("div");
      notif.id = "campaign-notification";
      notif.style.position = "fixed";
      notif.style.top = "12px";
      notif.style.left = "50%";
      notif.style.transform = "translateX(-50%)";
      notif.style.background = "rgba(0,0,0,0.8)";
      notif.style.color = "white";
      notif.style.padding = "8px 14px";
      notif.style.borderRadius = "6px";
      notif.style.zIndex = "9999";
      notif.style.fontSize = "14px";
      notif.style.opacity = "0";
      notif.style.transition = "opacity 0.25s ease";
      document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.style.opacity = "1";
    setTimeout(() => { notif.style.opacity = "0"; }, duration);
  }

  // --------------------------
  // Back-to-top (unchanged)
  // --------------------------
  function toggleBackToTop() {
    const backToTop = document.getElementById("backToTop");
    if (!backToTop) return;
    if (window.scrollY > 20) backToTop.classList.add("visible");
    else backToTop.classList.remove("visible");
  }
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", toggleBackToTop);
    backToTop.addEventListener("click", (e) => { e.preventDefault(); scrollToTop(); });
  }

  // Fallback double-tap prevention
// let lastTouchEnd = 0;
// document.addEventListener('touchend', function (event) {
//   const now = new Date().getTime();
//   if (now - lastTouchEnd <= 300) {
//     event.preventDefault();
//   }
//   lastTouchEnd = now;
// }, false);



  // --------------------------
  // INITIAL SEQUENCE
  // 1. loadCampaignsConfig() - tries folder near FULL path, then DATA_BASE_PATH, then ./data/campaigns.json
  // 2. if FULL path present, attempt to determine campaign id and set currentCampaign from campaigns array
  // 3. populate dropdown & loadBusinesses()
  // --------------------------
  await loadCampaignsConfig();

  // If we loaded campaigns and we have FULL_DATA_BASE_PATH, try to set currentCampaign using filename id:
  if (window.FULL_DATA_BASE_PATH && campaigns && campaigns.length > 0) {
    const idFromFile = extractCampaignIdFromFilename(normalizeFilePath(window.FULL_DATA_BASE_PATH));
    if (idFromFile) {
      const found = campaigns.find(c => c.id === idFromFile);
      if (found) {
        currentCampaign = found;
      } else {
        // Not found in config: create a minimal campaign derived from id (keeps UI from showing previous/incorrect value)
        currentCampaign = { id: idFromFile, name: idFromFile };
      }
    }
  }

  // If no currentCampaign yet, set to first campaign (if campaigns exist)
  if (!currentCampaign && campaigns && campaigns.length > 0) {
    currentCampaign = campaigns[0];
  }

  // populate dropdown UI (if present)
  populateCampaignDropdown();
  updateCampaignTitle();

  // Finally load businesses according to the rules above
  await loadBusinesses();

  // Done initial sequence
  console.log("Initial load complete. Current campaign:", currentCampaign ? (currentCampaign.name || currentCampaign.id) : "(none)");
});
