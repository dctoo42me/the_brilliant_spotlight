(() => {
  // --- Admin Login ---
  const allowedEmail = "dctoo42me@gmail.com";
  const allowedPassword = "theboss";

  function promptLogin() {
    const email = prompt("Enter admin email:");
    if (email === null) return redirectAway();

    const password = prompt("Enter password:");
    if (password === null) return redirectAway();

    if (email === allowedEmail && password === allowedPassword) {
      sessionStorage.setItem("adminLoggedIn", "true");
    } else {
      alert("Incorrect credentials. Access denied.");
      redirectAway();
    }
  }

  function redirectAway() {
    window.location.href = "/";
  }

  if (sessionStorage.getItem("adminLoggedIn") !== "true") {
    promptLogin();
  }

  // --- Business Data and DOM ---
  let businesses = [];
  let filteredCampaignId = "";
  let isEditingSingle = false;

  // Elements
  const businessListEl = document.getElementById("business-list");
  const form = document.getElementById("business-form");
  const idInput = document.getElementById("business-id");
  const nameInput = document.getElementById("name");
  const imageInput = document.getElementById("image");
  const websiteInput = document.getElementById("website");
  const locationInput = document.getElementById("location");
  const zipInput = document.getElementById("zip");
  const campaignIdInput = document.getElementById("campaignId");
  const combineButton = document.getElementById("btn-combine");
  const campaignStartInput = document.getElementById("campaignStart");
  const campaignEndInput = document.getElementById("campaignEnd");
  const downloadBtn = document.getElementById("download-json");
  const resetBtn = document.getElementById("reset-form");
  const btnViewAll = document.getElementById("btn-view-all");
  const btnAddEdit = document.getElementById("btn-add-edit");
  const campaignFilter = document.getElementById("campaign-filter");
  const oneMonthCheckbox = document.getElementById("oneMonthCheckbox");
  const backToTopBtn = document.getElementById("backToTop");
  const tallyEl = document.getElementById("business-tally");
  const btnNewCampaign = document.getElementById("btn-new-campaign");

  // Prefill lock checkboxes ONLY for specified fields
  const prefillLockCheckboxes = Array.from(document.querySelectorAll(".prefill-lock-checkbox"));
  const masterPrefillToggle = document.getElementById("master-prefill-toggle");

  // --- Load businesses from JSON ---
  async function loadBusinesses() {
    try {
      const res = await fetch("../data/businesses.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      businesses = await res.json();
      populateCampaignFilter();
      renderBusinesses();
      updateTally();
    } catch (err) {
      alert("Failed to load businesses.json. Make sure the file exists and is accessible.");
      console.error(err);
    }
  }

  // --- Populate Campaign Filter ---
  function populateCampaignFilter() {
    const uniqueCampaignIds = [...new Set(businesses.map(b => b.campaignId).filter(Boolean))];
    campaignFilter.innerHTML = `<option value="">-- Filter by Campaign ID --</option>`;
    uniqueCampaignIds.forEach(cid => {
      const opt = document.createElement("option");
      opt.value = cid;
      opt.textContent = cid;
      campaignFilter.appendChild(opt);
    });
  }

  // --- Render Business List ---
  function renderBusinesses() {
    businessListEl.innerHTML = "";

    let filteredBusinesses = businesses;

    if (filteredCampaignId) {
      filteredBusinesses = filteredBusinesses.filter(b => b.campaignId === filteredCampaignId);
    }

    if (isEditingSingle && idInput.value !== "") {
      const index = Number(idInput.value);
      if (businesses[index]) {
        filteredBusinesses = [businesses[index]];
      } else {
        filteredBusinesses = [];
      }
      btnViewAll.style.display = "inline-block";
    } else {
      btnViewAll.style.display = "none";
    }

    if (filteredBusinesses.length === 0) {
      businessListEl.innerHTML = "<p>No businesses available.</p>";
      updateTally(0);
      return;
    }

    filteredBusinesses.forEach((biz, idx) => {
      // Find global index (in businesses array)
      const globalIndex = businesses.indexOf(biz);

      const div = document.createElement("div");
      div.className = "business-item";
      div.innerHTML = `
        <strong>${escapeHTML(biz.name)}</strong> (ID: ${escapeHTML(biz.id)}) (${escapeHTML(biz.zip || "N/A")})<br>
        <img src="${escapeHTML(biz.image)}" alt="${escapeHTML(biz.name)}" style="max-width:150px" /><br>
        Website: <a href="${escapeHTML(biz.website)}" target="_blank" rel="noopener">${escapeHTML(biz.website)}</a><br>
        Location: ${escapeHTML(biz.location || "N/A")}<br>
        Campaign ID: ${escapeHTML(biz.campaignId || "-")}<br>
        Campaign: ${escapeHTML(biz.campaignStart || "-")} → ${escapeHTML(biz.campaignEnd || "-")}<br>
        <button type="button" data-index="${globalIndex}" class="edit-btn">Edit</button>
        <button type="button" data-index="${globalIndex}" class="delete-btn">Delete</button>
      `;
      businessListEl.appendChild(div);
    });

    updateTally(filteredBusinesses.length);
  }

  // --- Update Tally Info ---
  function updateTally(count = null) {
    let tallyText = "";
    if (count !== null) {
      tallyText = `Showing ${count} business${count !== 1 ? "es" : ""}`;
    } else {
      tallyText = `Total businesses: ${businesses.length}`;
    }

    if (filteredCampaignId) {
      const countInCampaign = businesses.filter(b => b.campaignId === filteredCampaignId).length;
      tallyText += ` | Campaign "${filteredCampaignId}": ${countInCampaign}`;
    }

    tallyEl.textContent = tallyText;
  }

  // --- Escape HTML utility ---
  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[m]);
  }

  // --- Fill form with business data for editing ---
  function fillForm(index) {
    const biz = businesses[index];
    if (!biz) return;

    idInput.value = index;
    nameInput.value = biz.name || "";
    imageInput.value = biz.image || "";
    websiteInput.value = biz.website || "";
    locationInput.value = biz.location || "";
    zipInput.value = biz.zip || "";
    campaignIdInput.value = biz.campaignId || "";
    campaignStartInput.value = biz.campaignStart || "";
    campaignEndInput.value = biz.campaignEnd || "";

    isEditingSingle = true;
    renderBusinesses();
    scrollToForm();
  }

  // --- Clear form, but keep locked fields ---
  function clearForm(keepPrefilled = true) {
    idInput.value = "";
    nameInput.value = "";
    imageInput.value = "";
    websiteInput.value = "";

    // For locked fields, keep value, else clear
    prefillLockCheckboxes.forEach(chk => {
      const field = chk.getAttribute("data-field");
      const inputEl = document.getElementById(field);
      if (!inputEl) return;
      if (!chk.checked || !keepPrefilled) {
        inputEl.value = "";
      }
    });

    isEditingSingle = false;
    filteredCampaignId = "";
    campaignFilter.value = "";
    oneMonthCheckbox.checked = false;
    campaignEndInput.disabled = false;

    renderBusinesses();
  }

  // --- Delete a business ---
  function deleteBusiness(index) {
    if (confirm("Delete this business?")) {
      businesses.splice(index, 1);
      clearForm();
      populateCampaignFilter();
      renderBusinesses();
      updateTally();
    }
  }

  // --- Combine button logic ---
  combineButton.addEventListener("click", () => {
    const campIdValue = campaignIdInput.value.trim();
    const locationVal = locationInput.value.trim();

    if (campIdValue && locationVal) {
      if (!campIdValue.endsWith(`_${locationVal}`)) {
        campaignIdInput.value = `${campIdValue}_${locationVal}`;
      }
    }
  });

  // --- Save business handler ---
  function saveBusiness(e) {
    e.preventDefault();

    const index = idInput.value;
    const newBizData = {
      id: index === "" ? String(Date.now()) : businesses[index]?.id || String(Date.now()),
      name: nameInput.value.trim(),
      image: imageInput.value.trim(),
      website: websiteInput.value.trim(),
      location: locationInput.value.trim(),
      zip: zipInput.value.trim(),
      campaignId: campaignIdInput.value.trim(),
      campaignStart: campaignStartInput.value,
      campaignEnd: campaignEndInput.value,
    };

    if (index === "") {
      // Add new business
      businesses.push(newBizData);
    } else {
      // Edit existing business
      const idxNum = Number(index);
      if (businesses[idxNum]) {
        businesses[idxNum] = newBizData;
      } else {
        businesses.push(newBizData); // fallback, just push
      }
    }

    // After save:
    // Only clear unlocked fields (keep locked fields prefilled)
    prefillLockCheckboxes.forEach(chk => {
      const field = chk.getAttribute("data-field");
      const inputEl = document.getElementById(field);
      if (inputEl) {
        if (!chk.checked) {
          inputEl.value = "";
        }
      }
    });

    // Clear other fields always (name, image, website)
    nameInput.value = "";
    imageInput.value = "";
    websiteInput.value = "";

    idInput.value = "";
    isEditingSingle = false;
    populateCampaignFilter();
    renderBusinesses();
    updateTally();
  }

  // --- Business list click handlers (edit/delete) ---
  function handleListClick(e) {
    if (e.target.classList.contains("edit-btn")) {
      const index = e.target.getAttribute("data-index");
      fillForm(Number(index));
    } else if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-index");
      deleteBusiness(Number(index));
    }
  }

  // --- Download JSON ---
  function downloadJSON() {
    const dataStr = JSON.stringify(businesses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "businesses.json";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // --- Scroll to form smoothly ---
  function scrollToForm() {
    form.scrollIntoView({ behavior: "smooth" });
  }

  // --- Calculate campaign end 1 month from start ---
  function getOneMonthFromCampaignStart() {
    if (!campaignStartInput.value) return "";

    const startDate = new Date(campaignStartInput.value);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Fix day overflow (e.g., 31st)
    if (nextMonth.getDate() !== startDate.getDate()) {
      nextMonth.setDate(0);
    } else {
      nextMonth.setDate(startDate.getDate());
    }

    return nextMonth.toISOString().split("T")[0];
  }

  const btnShowAll = document.getElementById("btn-show-all");
if (btnShowAll) {
  btnShowAll.addEventListener("click", () => {
    filteredCampaignId = "";
    campaignFilter.value = "";
    isEditingSingle = false;
    renderBusinesses();
  });
}


  // --- One month checkbox logic ---
  oneMonthCheckbox.addEventListener("change", () => {
    if (oneMonthCheckbox.checked) {
      campaignEndInput.value = getOneMonthFromCampaignStart();
      campaignEndInput.disabled = true;
    } else {
      campaignEndInput.disabled = false;
    }
  });

  // --- Master prefill toggle ---
  if (masterPrefillToggle) {
    masterPrefillToggle.addEventListener("change", () => {
      const checked = masterPrefillToggle.checked;
      prefillLockCheckboxes.forEach(chk => {
        chk.checked = checked;
      });
    });
  }

  // --- Add/Edit button scrolls to form ---
  if (btnAddEdit) {
    btnAddEdit.addEventListener("click", () => {
      scrollToForm();
    });
  }

  // --- New campaign button clears form and filter ---
if (btnNewCampaign) {
  btnNewCampaign.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to delete all current businesses and start a new campaign? This cannot be undone unless you reload the data or have a backup."
      )
    ) {
      businesses = [];       // Clear all businesses from memory
      clearForm();           // Reset form and UI state
      filteredCampaignId = "";
      campaignFilter.value = "";
      populateCampaignFilter();  // Refresh campaign filter dropdown (should be empty now)
      renderBusinesses();    // Update displayed list (should show no businesses)
      updateTally(0);        // Update tally count to zero
    }
  });
}

  // --- View All button clears filter and form ---
  if (btnViewAll) {
    btnViewAll.addEventListener("click", () => {
      filteredCampaignId = "";
      campaignFilter.value = "";
      isEditingSingle = false;
      clearForm();
    });
  }

  // --- Campaign filter change ---
  campaignFilter.addEventListener("change", () => {
    filteredCampaignId = campaignFilter.value;
    isEditingSingle = false;
    renderBusinesses();
  });

  // --- Reset form button ---
  resetBtn.addEventListener("click", e => {
    e.preventDefault();
    clearForm();
  });

  // --- Business list buttons ---
  businessListEl.addEventListener("click", handleListClick);

  // --- Download button ---
  downloadBtn.addEventListener("click", downloadJSON);

  // --- Scroll to top button ---
  window.addEventListener("scroll", () => {
    backToTopBtn.style.display = window.pageYOffset > 300 ? "block" : "none";
  });
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- Form submit ---
  form.addEventListener("submit", saveBusiness);

  // --- Initial load ---
  loadBusinesses();
})();
