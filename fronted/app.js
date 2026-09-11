const APOD_API_URL =
    "https://nasa-space-fuctions-b9fca6h0g4gddege.eastus-01.azurewebsites.net/api/apod";

const ASTEROIDS_API_URL =
    "https://nasa-space-fuctions-b9fca6h0g4gddege.eastus-01.azurewebsites.net/api/asteroids";

const FAVORITES_API_URL =
    "https://nasa-space-fuctions-b9fca6h0g4gddege.eastus-01.azurewebsites.net/api/favorites";

const FAVORITES_USER_ID = "demo-user";

/* =========================================================
APOD
========================================================= */

async function loadAPOD() {

    const apodCard = document.getElementById("apod-card");

    if (!apodCard) {
        return;
    }

    try {

        apodCard.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>CONNECTING TO NASA...</p>
                <span>
                    Establishing secure cloud connection
                </span>
            </div>
        `;

        const response = await fetch(APOD_API_URL);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        renderAPOD(data);

    } catch (error) {

        console.error("NASA SPACE CLOUD ERROR:", error);

        apodCard.innerHTML = `
            <div class="loading-state">
                <p>CONNECTION ERROR</p>
                <span>
                    Unable to retrieve NASA data.
                </span>
            </div>
        `;
    }
}


/* =========================================================
RENDER APOD
========================================================= */

function renderAPOD(data) {

    const apodCard = document.getElementById("apod-card");

    if (!apodCard) {
        return;
    }

    const title =
        escapeHTML(data.title || "NASA Discovery");

    const date =
        escapeHTML(data.date || "");

    const explanation =
        escapeHTML(
            data.explanation ||
            "No description available."
        );

    const imageURL =
        data.url || "";

    let media = "";

    if (data.media_type === "image") {

        media = `
            <div class="apod-media">
                <img
                    src="${imageURL}"
                    alt="${title}"
                    loading="lazy"
                >
            </div>
        `;

    } else if (data.media_type === "video") {

        media = `
            <div class="apod-media">
                <iframe
                    src="${imageURL}"
                    title="${title}"
                    loading="lazy"
                    allowfullscreen>
                </iframe>
            </div>
        `;

    } else {

        media = `
            <div class="apod-media">
                <p>MEDIA UNAVAILABLE</p>
            </div>
        `;
    }

    apodCard.innerHTML = `
    ${media}

    <div class="apod-content">

        <div class="apod-meta">
            <span>NASA / APOD</span>
            <span>${date}</span>
        </div>

        <h3>${title}</h3>

        <p>${explanation}</p>

        <a
            href="${imageURL}"
            target="_blank"
            rel="noopener noreferrer"
            class="apod-link"
        >
            VIEW ORIGINAL
            <span>↗️</span>
        </a>

      <button
    type="button"
    class="favorite-button"
    id="add-favorite-btn"
>
     ADD TO FAVORITES
</button>
    </div>
`;
        const favoriteButton =
        document.getElementById("add-favorite-btn");

    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            () => saveFavorite(data, favoriteButton)
        );
         checkAPODFavoriteStatus(data);
    }
}
/* =========================================================
SAVE FAVORITE
========================================================= */

async function saveFavorite(data, button) {

    if (button.disabled) {
        return;
    }

    try {

        button.disabled = true;
        button.textContent = "SAVING...";

        const safeTitle = (data.title || "nasa-discovery")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const favorite = {
    id: `${data.date}-${safeTitle}`,
    userId: FAVORITES_USER_ID,
    type: "apod",
    title: data.title || "NASA Discovery",
    url: data.url || "",
    date: data.date || ""
};

        const response = await fetch(
            FAVORITES_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(favorite)
            }
        );

        console.log(
            "STATUS FAVORITE:",
            response.status
        );

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        button.textContent =
            "♡ SAVED TO FAVORITES";

        button.classList.add(
            "favorite-saved"
        );

    } catch (error) {

        console.error(
            "FAVORITES ERROR:",
            error
        );

        button.disabled = false;

        button.textContent =
            "ADD TO FAVORITES";

        button.classList.remove(
            "favorite-saved"
        );

        alert(
            "Unable to save this favorite."
        );
    }
}
/* =========================================================
CHECK IF APOD IS ALREADY SAVED
========================================================= */

async function checkAPODFavoriteStatus(apodData) {

    const button =
        document.getElementById("add-favorite-btn");

    if (!button || !apodData || !apodData.date) {
        return;
    }

    try {

        const response = await fetch(
            FAVORITES_API_URL +
            "?userId=" +
            encodeURIComponent(FAVORITES_USER_ID)
        );

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        const favorites =
            await response.json();
             console.log(
             "CHECK FAVORITE STATUS:",
              apodData.date,
                favorites
                 );

        const alreadySaved =
            Array.isArray(favorites) &&
            favorites.some(
                favorite =>
                    String(favorite.url) === String(apodData.url)
            );

        if (alreadySaved) {

            button.disabled = true;

            button.textContent =
                "♡ SAVED TO FAVORITES";

            button.classList.add(
                "favorite-saved"
            );

        } else {

            button.disabled = false;

            button.textContent =
                "ADD TO FAVORITES";

            button.classList.remove(
                "favorite-saved"
            );
        }

    } catch (error) {

        console.error(
            "CHECK FAVORITE STATUS ERROR:",
            error
        );
    }
}
/* =========================================================
MY UNIVERSE
========================================================= */

async function loadFavorites() {

    const container = document.getElementById("favorites-container");
    const counter = document.getElementById("favorites-count");

    if (!container || !counter) {
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>

            <p>
                CONNECTING TO NASA SPACE CLOUD...
            </p>

            <span>
                Retrieving your saved discoveries
            </span>
        </div>
    `;

    try {

        const response = await fetch(
            FAVORITES_API_URL +
            "?userId=" +
            encodeURIComponent(FAVORITES_USER_ID)
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const favorites = await response.json();

        console.log("FAVORITES LOADED:", favorites);

        renderFavorites(favorites);

    } catch (error) {

        console.error("MY UNIVERSE ERROR:", error);

        counter.textContent = "—";

        container.innerHTML = `
            <div class="loading-state universe-error">

                <div class="universe-error-icon">
                    ⚠
                </div>

                <p>
                    UNIVERSE CONNECTION ERROR
                </p>

                <span>
                    Unable to retrieve your saved discoveries.
                </span>

            </div>
        `;
    }
}


/* =========================================================
RENDER FAVORITES
========================================================= */

function renderFavorites(favorites) {

    const container = document.getElementById("favorites-container");
    const counter = document.getElementById("favorites-count");

    if (!container || !counter) {
        return;
    }


    if (!Array.isArray(favorites)) {
        favorites = [];
    }


    counter.textContent = favorites.length;


    /* EMPTY STATE */

    if (favorites.length === 0) {

        container.innerHTML = `
            <div class="universe-empty">

                <div class="universe-empty-icon">
                    ☆
                </div>

                <span class="universe-empty-label">
                    PERSONAL ARCHIVE
                </span>

                <h3>
                    YOUR UNIVERSE IS EMPTY
                </h3>

                <p>
                    No cosmic discoveries have been saved yet.
                    Explore NASA's data and build your collection.
                </p>

                <a
                    href="#apod"
                    class="universe-empty-link"
                >
                    EXPLORE DISCOVERIES
                    <span>→</span>
                </a>

            </div>
        `;

        return;
    }


    /* FAVORITES */

    container.innerHTML = favorites.map(favorite => {

        const title = escapeHTML(
            favorite.title || "NASA Discovery"
        );

        const date = escapeHTML(
            favorite.date || "Unknown date"
        );

        const type = escapeHTML(
            favorite.type || "NASA"
        );

        const id = escapeHTML(
            favorite.id || ""
        );

        const url = getSafeURL(
            favorite.url
        );


        return `
            <article
                class="favorite-item"
                data-favorite-id="${id}"
            >

                <div class="favorite-item-media">

                    ${
                        url
                            ? `
                                <img
                                    src="${url}"
                                    alt="${title}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="favorite-media-fallback">
                                    NASA
                                </div>
                            `
                    }

                    <div class="favorite-item-overlay"></div>

                    <span class="favorite-item-type">
                        ${type.toUpperCase()}
                    </span>

                </div>


                <div class="favorite-item-content">

                    <div class="favorite-item-meta">

                        <span>
                            ${type.toUpperCase()}
                        </span>

                        <span>
                            ${date}
                        </span>

                    </div>


                    <h3>
                        ${title}
                    </h3>


                    <div class="favorite-item-actions">

                        ${
                            url
                                ? `
                                    <a
                                        href="${url}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="favorite-view-button"
                                    >
                                        VIEW ORIGINAL
                                        <span>↗</span>
                                    </a>
                                `
                                : ""
                        }


                        <button
                            type="button"
                            class="favorite-delete-button"
                            data-id="${id}"
                        >
                            REMOVE
                            <span>×</span>
                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");


    activateFavoriteDeleteButtons();
}


/* =========================================================
SAFE URL
========================================================= */

function getSafeURL(value) {

    if (!value) {
        return "";
    }

    try {

        const url = new URL(value);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return "";
        }

        return escapeHTML(url.href);

    } catch {

        return "";
    }
}


/* =========================================================
DELETE BUTTONS
========================================================= */

function activateFavoriteDeleteButtons() {

    const buttons = document.querySelectorAll(
        ".favorite-delete-button"
    );


    buttons.forEach(button => {

        button.addEventListener("click", async () => {

            const favoriteId = button.dataset.id;

            if (!favoriteId) {
                return;
            }


            button.disabled = true;

            button.innerHTML = `
                REMOVING...
                <span>↻</span>
            `;


            try {

                await deleteFavorite(favoriteId);

            } catch (error) {

                console.error(
                    "DELETE FAVORITE ERROR:",
                    error
                );

                button.disabled = false;

                button.innerHTML = `
                    REMOVE
                    <span>×</span>
                `;

                alert(
                    "Unable to remove this favorite."
                );
            }

        });

    });

}


/* =========================================================
DELETE FAVORITE
========================================================= */
async function deleteFavorite(favoriteId) {

    const response = await fetch(
        FAVORITES_API_URL +
        "/" +
        encodeURIComponent(favoriteId) +
        "?userId=" +
        encodeURIComponent(FAVORITES_USER_ID),
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {

        throw new Error(
            "HTTP " + response.status
        );

    }


    /* =====================================================
       RESET APOD FAVORITE BUTTON
    ===================================================== */

    const favoriteButton =
        document.getElementById("add-favorite-btn");


    if (favoriteButton) {

        favoriteButton.disabled = false;

        favoriteButton.textContent =
            "ADD TO FAVORITES";

        favoriteButton.classList.remove(
            "favorite-saved"
        );

    }


    /* =====================================================
       REMOVE FAVORITE CARD
    ===================================================== */

    const favoriteCard = document.querySelector(
        `[data-favorite-id="${CSS.escape(favoriteId)}"]`
    );


    if (favoriteCard) {

        favoriteCard.style.opacity = "0";

        favoriteCard.style.transform =
            "translateY(10px)";


        setTimeout(() => {

            loadFavorites();

        }, 250);

    } else {

        loadFavorites();

    }

}
/* =========================================================
ASTEROID WATCH
========================================================= */

async function loadAsteroids() {

    const asteroidCount =
        document.getElementById("asteroid-count");

    const hazardousCount =
        document.getElementById("hazardous-count");

    if (!asteroidCount || !hazardousCount) {
        return;
    }

    try {

        asteroidCount.textContent = "...";
        hazardousCount.textContent = "...";

        const response =
            await fetch(ASTEROIDS_API_URL);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data =
            await response.json();

        let totalAsteroids = 0;
        let hazardousAsteroids = 0;

        const objectsByDate =
            data.near_earth_objects || {};

        Object.values(objectsByDate).forEach(
            asteroidList => {

                totalAsteroids += asteroidList.length;

                asteroidList.forEach(
                    asteroid => {

                        if (
                            asteroid.is_potentially_hazardous_asteroid
                        ) {
                            hazardousAsteroids++;
                        }

                    }
                );

            }
        );

        asteroidCount.textContent =
            totalAsteroids;

        hazardousCount.textContent =
            hazardousAsteroids;

    } catch (error) {

        console.error(
            "NASA ASTEROID ERROR:",
            error
        );

        asteroidCount.textContent = "ERROR";
        hazardousCount.textContent = "ERROR";
    }
}


/* =========================================================
CARD LIGHT EFFECT
========================================================= */

function activateCardLighting() {

    const cards =
        document.querySelectorAll(".explore-card");

    cards.forEach(card => {

        card.addEventListener("pointermove", event => {

            const rect =
                card.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;

            const mouseX =
                (x / rect.width) * 100;

            const mouseY =
                (y / rect.height) * 100;

            card.style.setProperty(
                "--mouse-x",
                mouseX + "%"
            );

            card.style.setProperty(
                "--mouse-y",
                mouseY + "%"
            );
        });

        card.addEventListener("pointerleave", () => {

            card.style.setProperty(
                "--mouse-x",
                "50%"
            );

            card.style.setProperty(
                "--mouse-y",
                "50%"
            );
        });
    });
}


/* =========================================================
CARD 3D EFFECT
========================================================= */

function activateCardTilt() {

    const cards =
        document.querySelectorAll(".explore-card");

    cards.forEach(card => {

        card.addEventListener("pointermove", event => {

            if (window.innerWidth < 900) {
                return;
            }

            const rect =
                card.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;

            const centerX =
                rect.width / 2;

            const centerY =
                rect.height / 2;

            const rotateX =
                ((y - centerY) / centerY) * -2;

            const rotateY =
                ((x - centerX) / centerX) * 2;

            card.style.transform =
                "perspective(900px) " +
                "translateY(-12px) " +
                "scale(1.015) " +
                "rotateX(" + rotateX + "deg) " +
                "rotateY(" + rotateY + "deg)";
        });

        card.addEventListener("pointerleave", () => {

            card.style.transform = "";
        });
    });
}


/* =========================================================
SCROLL REVEAL
========================================================= */

function activateScrollReveal() {

    const sections =
        document.querySelectorAll(".section");

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "section-visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: 0.12
            }
        );

    sections.forEach(section => {

        observer.observe(section);
    });
}


/* =========================================================
HTML SECURITY
========================================================= */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent = value;

    return element.innerHTML;
}


/* =========================================================
START SYSTEM
========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        activateCardLighting();
        activateCardTilt();
        activateScrollReveal();
        loadAPOD();
        loadAsteroids();
        loadFavorites();
        /* =================================================
        ASTEROID REFRESH
        ================================================= */
        const asteroidRefresh =
            document.getElementById("asteroid-refresh");
        if (asteroidRefresh) {
            asteroidRefresh.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    loadAsteroids();
                }
            );
        }
        const universeRefresh = document.getElementById("universe-refresh");

if (universeRefresh) {

    universeRefresh.addEventListener("click", () => {

        universeRefresh.disabled = true;

        universeRefresh.innerHTML = `
            SYNCING UNIVERSE...
            <span>↻</span>
        `;

        loadFavorites().finally(() => {

            universeRefresh.disabled = false;

            universeRefresh.innerHTML = `
                REFRESH UNIVERSE
                <span>↻</span>
            `;

        });

    });

}
        /* =================================================
        MARS MISSION SYNC
        ================================================= */
        const marsRefresh =
            document.getElementById("mars-refresh");
        if (marsRefresh) {
            marsRefresh.addEventListener(
                "click",
                () => {
                    marsRefresh.classList.add(
                        "mars-syncing"
                    );
                    marsRefresh.innerHTML = `
                        SYNCING MISSION DATA...
                        <span>↻</span>
                    `;
                    setTimeout(() => {
                        marsRefresh.classList.remove(
                            "mars-syncing"
                        );
                        marsRefresh.innerHTML = `
                            MISSION DATA SYNCHRONIZED
                            <span>✓</span>
                        `;
                    }, 1500);
                }
            );
        }
    }
);