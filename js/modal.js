// modal.js
console.log("📬 Modal module loaded");

window.Modal = (() => {
    const modal = document.querySelector(".modal");
    const modalContent = modal ? modal.querySelector(".modal-content") : null;
    const closeBtn = modal ? modal.querySelector(".btn-close") : null;
    const carousel = document.querySelector(".carousel");
    const leftBtn = document.querySelector(".carousel-btn.left");
    const rightBtn = document.querySelector(".carousel-btn.right");

    let businesses = [];
    let isSharing = false;

    // 🔹 Toast System
    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Basic toast styling (non-intrusive)
    const toastStyle = document.createElement("style");
    toastStyle.textContent = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: #fff;
            padding: 10px 16px;
            border-radius: 6px;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s, transform 0.3s;
            z-index: 9999;
            font-size: 14px;
            pointer-events: none;
        }
        .toast.show { opacity: 1; transform: translateY(0); }
        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-info { background: #007bff; }
        .toast-warn { background: #ffc107; color: #000; }
    `;
    document.head.appendChild(toastStyle);

    function setBusinesses(data) {
        businesses = data;
    }

    function open(business) {
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
            const imgSrc = safeImageUrl(business.image);
            let fontSizeStyle = "";
            if (wordCount > 4 || charCount > 26) fontSizeStyle = 'style="font-size: 18px"';

            modalContent.innerHTML = `
                <div class="card">
                    <div class="modal-image-card-container">
                        <img src="${imgSrc}" alt="${business.name}">
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

            // 🔹 Image fallback
            const imgEl = modalContent.querySelector("img");
            imgEl.onerror = function() {
                this.onerror = null;
                this.src = PLACEHOLDER_IMAGE;
            };

            // 🔹 Device / feature checks
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
            const supportsShare = !!navigator.share;
            const supportsCanShare = typeof navigator.canShare === "function";
            const supportsFilePicker = typeof window.showSaveFilePicker === "function";

            // 🔹 SAVE AD logic (preserves full original flow)
            const saveButton = modalContent.querySelector(".save-ad");
            if (saveButton) {
                saveButton.addEventListener("click", async (e) => {
                    e.preventDefault();
                    try {
                        const imageUrl = safeImageUrl(business.image);
                        const response = await fetch(imageUrl, { mode: "cors" });
                        if (!response.ok) throw new Error("Image fetch failed");
                        const blob = await response.blob();
                        const fileName = `${business.name.replace(/\s+/g, "_")}_ad.png`;
                        const file = new File([blob], fileName, { type: "image/png" });

                        // 1️⃣ Desktop File Picker
                        if (supportsFilePicker && !isMobile) {
                            try {
                                const handle = await window.showSaveFilePicker({
                                    suggestedName: fileName,
                                    types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
                                });

                                // 🧩 Prevent 2nd dialog on cancel
                                if (!handle) {
                                    showToast("❌ Save canceled.", "warn");
                                    return;
                                }

                                const writable = await handle.createWritable();
                                await writable.write(blob);
                                await writable.close();
                                showToast("✅ Ad saved successfully!", "success");
                                return;
                            } catch (pickerErr) {
                                if (pickerErr.name === "AbortError") {
                                    showToast("❌ Save canceled.", "warn");
                                    return; // 🧩 Stop retry chain
                                }
                                console.warn("showSaveFilePicker fallback triggered:", pickerErr);
                            }
                        }

                        // 2️⃣ Mobile share with file
                        if (isMobile && supportsShare && supportsCanShare && navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({
                                    files: [file],
                                    title: `Save ${business.name} Ad`,
                                    text: `Save this Ad from ${business.name} to your Photos!`
                                });
                                showToast("📱 Shared successfully!", "success");
                                return;
                            } catch (shareErr) {
                                console.warn("Mobile share failed:", shareErr);
                            }
                        }

                        // 3️⃣ Traditional download fallback
                        const blobUrl = URL.createObjectURL(blob);
                        const downloadLink = document.createElement("a");
                        downloadLink.href = blobUrl;
                        downloadLink.download = fileName;
                        downloadLink.style.display = "none";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        URL.revokeObjectURL(blobUrl);

                        showToast("💾 Ad downloaded.", "info");
                    } catch (err) {
                        console.error("Save Ad failed:", err);
                        showToast(
                            isMobile
                                ? "⚠️ Long-press the image to save it."
                                : "⚠️ Right-click the image to save manually.",
                            "error"
                        );
                    }
                });
            }

            // SHARE logic (unchanged)
            const shareButton = document.getElementById("share-button");
            if (shareButton) {
                shareButton.addEventListener("click", async () => {
                    const canUseNativeShare = supportsShare && (isMobile || isiOS || window.innerWidth < 768);
                    if (canUseNativeShare) {
                        isSharing = true;
                        try {
                            await navigator.share({
                                title: business.name,
                                text: `Discover why ${business.name} is a Local Gem!`,
                                url: shareUrl
                            });
                            showToast("✅ Shared successfully!", "success");
                        } catch (err) {
                            console.error("Share failed:", err);
                            showToast("❌ Sharing failed. Try QR code instead.", "error");
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
                            showToast("📸 QR code generated.", "info");
                        }
                    }
                });
            }

            // Push state + show modal
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

    function close() {
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

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) close();
        });
    }

    window.addEventListener("popstate", () => {
        const params = new URLSearchParams(window.location.search);
        const businessId = params.get("business");
        if (businessId) {
            const matched = businesses.find(b => String(b.id) === String(businessId) || b.id === parseInt(businessId));
            if (matched) open(matched);
        } else {
            close();
        }
    });

    return { open, close, setBusinesses };
})();
