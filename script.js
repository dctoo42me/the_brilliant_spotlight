document.addEventListener("DOMContentLoaded", async function () {
    const carousel = document.querySelector(".carousel");
    
    // Fetch business data from JSON file
    const response = await fetch("businesses.json");
    const businesses = await response.json();

    // Function to create cards dynamically
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
        card.addEventListener("click", function () {
            openModal(business);
        });
        return card;
    }

    // Add all cards to carousel
    businesses.forEach((business) => {
        const card = createCard(business);
        carousel.appendChild(card);
    });

    // Modal Functionality
    const modal = document.querySelector(".modal");
    const modalContent = document.querySelector(".modal-content");
    const closeModal = document.querySelector(".close-modal");

    function openModal(business) {
        modalContent.innerHTML = `
        <div class="card">
            <img src="${business.image}" alt="${business.name}">
            <div class="card-content">
                <div class="business-name">
                    <h2>${business.name}</h2>
                </div>
                <a class="site-button" href="${business.website}">Visit Website</a>
                <p>${business.description}</p>
            </div>
        </div>
    `;
        modal.classList.add("active");
        carousel.style.pointerEvents = "none";
    }

    function closeModalFunction() {
        modal.classList.remove("active");
        carousel.style.pointerEvents = "auto";
    }

    closeModal.addEventListener("click", closeModalFunction);
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModalFunction();
        }
    });
});
