/* =========================================================
NASA SPACE CLOUD
Frontend Controller
========================================================= */

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

    const apodCard =
        document.getElementById("apod-card");

    if (!apodCard) {
        return;
    }

    try {

        apodCard.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>

                <p>
                    CONNECTING TO NASA...
                </p>

                <span>
                    Establishing secure cloud connection
                </span>
            </div>
        `;

        const response =
            await fetch(APOD_API_URL);

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        console.log(
            "NASA APOD:",
            data
        );

        renderAPOD(data);

    } catch (error) {

        console.error(
            "NASA SPACE CLOUD ERROR:",
            error
        );

        apodCard.innerHTML = `
            <div class="loading-state">

                <p>
                    CONNECTION ERROR
                </p>

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

    const apodCard =
        document.getElementById("apod-card");

    if (!apodCard) {
        return;
    }

    const title =
        escapeHTML(
            data.title ||
            "NASA Discovery"
        );

    const date =
        escapeHTML(
            data.date || ""
        );

    const explanation =
        escapeHTML(
            data.explanation ||
            "No description available."
        );

    const imageURL =
        getSafeURL(
            data.url || ""
        );

    let media = "";

    if (
        data.media_type === "image" &&
        imageURL
    ) {

        media = `
            <div class="apod-media">

                <img
                    src="${imageURL}"
                    alt="${title}"
                    loading="lazy"
                >

            </div>
        `;

    } else if (
        data.media_type === "video" &&
        imageURL
    ) {

        media = `
            <div class="apod-media">

                <iframe
                    src="${imageURL}"
                    title="${title}"
                    loading="lazy"
                    allowfullscreen
                ></iframe>

            </div>
        `;

    } else {

        media = `
            <div class="apod-media">

                <p>
                    MEDIA UNAVAILABLE
                </p>

            </div>
        `;
    }

    apodCard.innerHTML = `
        ${media}

        <div class="apod-content">

            <div class="apod-meta">

                <span>
                    NASA / APOD
                </span>

                <span>
                    ${date}
                </span>

            </div>


            <h3>
                ${title}
            </h3>


            <p>
                ${explanation}
            </p>


            ${
                imageURL
                    ? `
                        <a
                            href="${imageURL}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="apod-link"
                        >
                            VIEW ORIGINAL
                            <span>↗</span>
                        </a>
                    `
                    : ""
            }


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
        document.getElementById(
            "add-favorite-btn"
        );

    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            () => {

                saveFavorite(
                    data,
                    favoriteButton
                );

            }
        );

        checkAPODFavoriteStatus(data);
    }
}


/* =========================================================
SAVE FAVORITE
========================================================= */

async function saveFavorite(
    data,
    button
) {

    if (button.disabled) {
        return;
    }

    try {

        button.disabled = true;

        button.textContent =
            "SAVING...";

        const safeTitle =
            (
                data.title ||
                "nasa-discovery"
            )
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                )
                .slice(
                    0,
                    40
                );

        const favorite = {

            id:
                `${data.date}-${safeTitle}`,

            userId:
                FAVORITES_USER_ID,

            type:
                "apod",

            title:
                data.title ||
                "NASA Discovery",

            url:
                data.url || "",

            hdurl:
                data.hdurl || "",

            date:
                data.date || "",

            media_type:
                data.media_type ||
                "image",

            copyright:
                data.copyright ||
                "NASA / APOD",

            explanation:
                data.explanation ||
                "A saved astronomical discovery from NASA's Astronomy Picture of the Day archive."
        };


        const response =
            await fetch(
                FAVORITES_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            favorite
                        )
                }
            );


        console.log(
            "STATUS FAVORITE:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        button.textContent =
            "♡ SAVED TO FAVORITES";

        button.classList.add(
            "favorite-saved"
        );


        await loadFavorites();


    } catch (error) {

        console.error(
            "FAVORITES ERROR:",
            error
        );


        button.disabled =
            false;

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

async function checkAPODFavoriteStatus(
    apodData
) {

    const button =
        document.getElementById(
            "add-favorite-btn"
        );


    if (
        !button ||
        !apodData ||
        !apodData.date
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                FAVORITES_API_URL +
                "?userId=" +
                encodeURIComponent(
                    FAVORITES_USER_ID
                )
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
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
            Array.isArray(
                favorites
            ) &&
            favorites.some(
                favorite =>

                    String(
                        favorite.url
                    ) ===
                    String(
                        apodData.url
                    )
            );


        if (alreadySaved) {

            button.disabled =
                true;

            button.textContent =
                "♡ SAVED TO FAVORITES";

            button.classList.add(
                "favorite-saved"
            );

        } else {

            button.disabled =
                false;

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

    const container =
        document.getElementById(
            "favorites-container"
        );

    const counter =
        document.getElementById(
            "favorites-count"
        );


    if (
        !container ||
        !counter
    ) {

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

        const response =
            await fetch(
                FAVORITES_API_URL +
                "?userId=" +
                encodeURIComponent(
                    FAVORITES_USER_ID
                )
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const favorites =
            await response.json();


        console.log(
            "FAVORITES LOADED:",
            favorites
        );


        renderFavorites(
            favorites
        );


    } catch (error) {

        console.error(
            "MY UNIVERSE ERROR:",
            error
        );


        counter.textContent =
            "—";


        container.innerHTML = `
            <div
                class="loading-state universe-error"
            >

                <div
                    class="universe-error-icon"
                >
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

function renderFavorites(
    favorites
) {

    const container =
        document.getElementById(
            "favorites-container"
        );

    const counter =
        document.getElementById(
            "favorites-count"
        );


    if (
        !container ||
        !counter
    ) {

        return;
    }


    if (
        !Array.isArray(
            favorites
        )
    ) {

        favorites = [];
    }


    counter.textContent =
        favorites.length;


    if (
        favorites.length === 0
    ) {

        container.innerHTML = `
            <div class="universe-empty">

                <div
                    class="universe-empty-icon"
                >
                    ☆
                </div>

                <span
                    class="universe-empty-label"
                >
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


    container.innerHTML =
        favorites
            .map(
                favorite => {


                    const title =
                        escapeHTML(
                            favorite.title ||
                            "NASA Discovery"
                        );


                    const date =
                        escapeHTML(
                            favorite.date ||
                            "Unknown date"
                        );


                    const type =
                        escapeHTML(
                            favorite.type ||
                            "APOD"
                        );


                    const id =
                        escapeHTML(
                            favorite.id ||
                            ""
                        );


                    const url =
                        getSafeURL(
                            favorite.url
                        );


                    const hasRealDescription =
                        favorite.explanation &&
                        String(
                            favorite.explanation
                        ).trim() !== "";


                    const description =
                        escapeHTML(
                            hasRealDescription
                                ? favorite.explanation
                                : `Explore ${favorite.title || "this NASA discovery"}, saved in your personal NASA Space Cloud archive.`
                        );


                    const tags = [

                        type.toUpperCase(),

                        "NASA",

                        "SPACE"
                    ];


                    return `
                        <article
                            class="favorite-item"
                            data-favorite-id="${id}"
                        >

                            <div
                                class="favorite-item-media"
                            >

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
                                            <div
                                                class="favorite-media-fallback"
                                            >
                                                NASA
                                            </div>
                                        `
                                }


                                <div
                                    class="favorite-item-overlay"
                                ></div>


                                <span
                                    class="favorite-item-type"
                                >
                                    ${type.toUpperCase()}
                                </span>

                            </div>


                            <div
                                class="favorite-item-content"
                            >

                                <div
                                    class="favorite-item-date"
                                >
                                    <span>▣</span>

                                    ${date}
                                </div>


                                <h3>
                                    ${title}
                                </h3>


                                <p
                                    class="favorite-item-description"
                                >
                                    ${description}
                                </p>


                                <div
                                    class="favorite-item-tags"
                                >

                                    ${
                                        tags
                                            .map(
                                                tag => `
                                                    <span>
                                                        ${tag}
                                                    </span>
                                                `
                                            )
                                            .join("")
                                    }

                                </div>


                                <div
                                    class="favorite-item-actions"
                                >

                                    <button
                                        type="button"
                                        class="favorite-view-button favorite-details-button"
                                        data-id="${id}"
                                    >
                                        View Discovery
                                        <span>↗</span>
                                    </button>


                                    <button
                                        type="button"
                                        class="favorite-delete-button"
                                        data-id="${id}"
                                        aria-label="Remove ${title}"
                                    >

                                        <span
                                            class="favorite-trash-icon"
                                        >

                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >

                                                <path
                                                    d="M4 7H20"
                                                    stroke="currentColor"
                                                    stroke-width="1.8"
                                                    stroke-linecap="round"
                                                />

                                                <path
                                                    d="M9 3H15"
                                                    stroke="currentColor"
                                                    stroke-width="1.8"
                                                    stroke-linecap="round"
                                                />

                                                <path
                                                    d="M6 7L7 20H17L18 7"
                                                    stroke="currentColor"
                                                    stroke-width="1.8"
                                                    stroke-linejoin="round"
                                                />

                                                <path
                                                    d="M10 11V16"
                                                    stroke="currentColor"
                                                    stroke-width="1.8"
                                                    stroke-linecap="round"
                                                />

                                                <path
                                                    d="M14 11V16"
                                                    stroke="currentColor"
                                                    stroke-width="1.8"
                                                    stroke-linecap="round"
                                                />

                                            </svg>

                                        </span>

                                    </button>

                                </div>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");


    activateFavoriteDeleteButtons();

    activateFavoriteDetailButtons(
        favorites
    );
}


/* =========================================================
FAVORITE DETAILS BUTTONS
========================================================= */

function activateFavoriteDetailButtons(
    favorites
) {

    const buttons =
        document.querySelectorAll(
            ".favorite-details-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {


                    const favorite =
                        favorites.find(
                            item =>

                                String(
                                    item.id
                                ) ===
                                String(
                                    button.dataset.id
                                )
                        );


                    if (favorite) {

                        openFavoriteDetails(
                            favorite
                        );
                    }
                }
            );
        }
    );
}


/* =========================================================
OPEN FAVORITE DISCOVERY

IMPORTANTE:
- Abre primero el favorito EXACTO de Cosmos.
- No sustituye título, imagen ni fecha.
- Si falta explanation, consulta APOD.
- Solo acepta la explicación si fecha Y título coinciden.
========================================================= */

async function openFavoriteDetails(
    favorite
) {

    const oldModal =
        document.querySelector(
            ".favorite-detail-modal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "favorite-detail-modal";


    modal.innerHTML = `
        <div
            class="favorite-detail-backdrop"
            data-close-favorite-modal
        ></div>


        <section
            class="favorite-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-label="NASA Discovery"
        >

    


            <div
                class="favorite-detail-loading"
            >

                <div
                    class="loader"
                ></div>

                <p>
                    RETRIEVING DISCOVERY
                </p>

                <span>
                    Loading your NASA Space Cloud archive
                </span>

            </div>

        </section>
    `;


    document.body.appendChild(
        modal
    );


    document.body.classList.add(
        "favorite-modal-open"
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "favorite-detail-modal-visible"
            );
        }
    );


    /* =====================================================
    CLOSE MODAL
    ===================================================== */

    const closeModal =
        () => {


            modal.classList.remove(
                "favorite-detail-modal-visible"
            );


            document.body.classList.remove(
                "favorite-modal-open"
            );


            document.removeEventListener(
                "keydown",
                handleEscape
            );


            setTimeout(
                () => {

                    if (
                        modal.isConnected
                    ) {

                        modal.remove();
                    }

                },
                220
            );
        };


    const handleEscape =
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();
            }
        };


    modal
        .querySelectorAll(
            "[data-close-favorite-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeModal
                );
            }
        );


    document.addEventListener(
        "keydown",
        handleEscape
    );


    /* =====================================================
    COPIA EXACTA DEL FAVORITO
    ===================================================== */

    const discovery = {
        ...favorite
    };


    console.log(
        "OPENING FAVORITE:",
        {
            id:
                discovery.id,

            title:
                discovery.title,

            date:
                discovery.date,

            url:
                discovery.url,

            explanation:
                discovery.explanation
        }
    );


    /* =====================================================
    VERIFICAR SI TIENE DESCRIPCION REAL
    ===================================================== */

    const explanationValue =
        discovery.explanation
            ? String(
                discovery.explanation
            ).trim()
            : "";


    const genericOldExplanation =
        "A saved astronomical discovery from NASA's Astronomy Picture of the Day archive.";


    const needsDescription =
        !explanationValue ||
        explanationValue ===
            genericOldExplanation;


    /* =====================================================
    FAVORITO NUEVO:
    YA TIENE SU DESCRIPCION
    ===================================================== */

    if (!needsDescription) {

        renderFavoriteDiscovery(
            modal,
            discovery,
            favorite,
            closeModal
        );

        return;
    }


    /* =====================================================
    FAVORITO ANTIGUO:
    RECUPERAR SOLAMENTE LA DESCRIPCION
    ===================================================== */

    try {

        if (!favorite.date) {

            throw new Error(
                "Favorite has no APOD date."
            );
        }


        const requestedDate =
            String(
                favorite.date
            ).trim();


        const response =
            await fetch(
                APOD_API_URL +
                "?date=" +
                encodeURIComponent(
                    requestedDate
                ),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const nasaData =
            await response.json();


        console.log(
            "DESCRIPTION LOOKUP:",
            {
                requestedFavorite:
                    favorite.title,

                requestedDate:
                    requestedDate,

                returnedTitle:
                    nasaData.title,

                returnedDate:
                    nasaData.date
            }
        );


        /* =================================================
        VALIDACION DE FECHA

        Si pedimos Pelican y Azure devuelve M83,
        NO aceptamos esos datos.
        ================================================= */

        if (
            !nasaData.date ||
            String(
                nasaData.date
            ).trim() !==
            requestedDate
        ) {

            throw new Error(
                "NASA returned a different APOD date."
            );
        }


        /* =================================================
        VALIDACION DE TITULO
        ================================================= */

        const requestedTitle =
            String(
                favorite.title ||
                ""
            )
                .trim()
                .toLowerCase();


        const returnedTitle =
            String(
                nasaData.title ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            requestedTitle &&
            returnedTitle &&
            requestedTitle !==
                returnedTitle
        ) {

            throw new Error(
                "NASA returned a different APOD title."
            );
        }


        /* =================================================
        SOLO COPIAMOS INFORMACION SEGURA.

        NO reemplazamos:
        - id
        - title
        - date
        - url

        Por eso una tarjeta nunca puede transformarse
        accidentalmente en M83.
        ================================================= */

        if (
            nasaData.explanation &&
            String(
                nasaData.explanation
            ).trim()
        ) {

            discovery.explanation =
                nasaData.explanation;
        }


        if (
            nasaData.copyright
        ) {

            discovery.copyright =
                nasaData.copyright;
        }


    } catch (error) {

        console.warn(
            "COULD NOT RECOVER DESCRIPTION:",
            favorite.title,
            error
        );
    }


    /* =====================================================
    MOSTRAR SIEMPRE EL FAVORITO ORIGINAL
    ===================================================== */

    renderFavoriteDiscovery(
        modal,
        discovery,
        favorite,
        closeModal
    );
}


/* =========================================================
RENDER FAVORITE DISCOVERY
========================================================= */

function renderFavoriteDiscovery(
    modal,
    nasaData,
    fallbackFavorite,
    closeModal
) {

    const panel =
        modal.querySelector(
            ".favorite-detail-panel"
        );


    if (!panel) {
        return;
    }


    /* =====================================================
    DATA
    ===================================================== */

    const title =
        escapeHTML(
            nasaData.title ||
            fallbackFavorite.title ||
            "NASA Discovery"
        );


    const date =
        escapeHTML(
            nasaData.date ||
            fallbackFavorite.date ||
            "Unknown date"
        );


    const rawDescription =
        nasaData.explanation ||
        fallbackFavorite.explanation ||
        "";


    const genericOldExplanation =
        "A saved astronomical discovery from NASA's Astronomy Picture of the Day archive.";


    const description =
        escapeHTML(
            rawDescription &&
            String(
                rawDescription
            ).trim() !==
                genericOldExplanation

                ? rawDescription

                : `Explore ${
                    nasaData.title ||
                    fallbackFavorite.title ||
                    "this astronomical discovery"
                }, preserved in your NASA Space Cloud personal discovery archive.`
        );


    const copyright =
        escapeHTML(
            nasaData.copyright ||
            fallbackFavorite.copyright ||
            "NASA / APOD"
        );


    const mediaType =
        String(
            nasaData.media_type ||
            fallbackFavorite.media_type ||
            "image"
        )
            .toLowerCase();


    const hdURL =
        getSafeURL(
            nasaData.hdurl ||
            fallbackFavorite.hdurl ||
            ""
        );


    const normalURL =
        getSafeURL(
            nasaData.url ||
            fallbackFavorite.url ||
            ""
        );


    const mediaURL =
        hdURL ||
        normalURL;


    /* =====================================================
    MEDIA
    ===================================================== */

    let mediaHTML =
        "";


    if (
        mediaType === "image" &&
        mediaURL
    ) {

        mediaHTML = `
            <img
                src="${mediaURL}"
                alt="${title}"
                class="favorite-detail-image"
            >
        `;


    } else if (
        mediaType === "video" &&
        normalURL
    ) {

        mediaHTML = `
            <iframe
                src="${normalURL}"
                title="${title}"
                class="favorite-detail-video"
                loading="lazy"
                allowfullscreen
            ></iframe>
        `;


    } else {

        mediaHTML = `
            <div
                class="favorite-detail-fallback"
            >
                NASA
            </div>
        `;
    }


    /* =====================================================
    MODAL CONTENT
    ===================================================== */

    panel.innerHTML = `


        <div
            class="favorite-detail-media"
        >

            ${mediaHTML}


            <div
                class="favorite-detail-media-overlay"
            ></div>


            <div
                class="favorite-detail-badge"
            >
                APOD
            </div>


            <div
                class="favorite-detail-image-label"
            >
                NASA · ASTRONOMY PICTURE OF THE DAY
            </div>

        </div>


        <div
            class="favorite-detail-content"
        >


            <div
                class="favorite-detail-topline"
            >

                <span>
                    NASA SPACE CLOUD
                </span>

                <span>
                    PERSONAL DISCOVERY ARCHIVE
                </span>

            </div>


            <div
                class="favorite-detail-date"
            >

                <span
                    class="favorite-detail-date-dot"
                ></span>

                ${date}

            </div>


            <h2>
                ${title}
            </h2>


            <div
                class="favorite-detail-source"
            >

                <span>
                    SOURCE
                </span>

                <strong>
                    ${copyright}
                </strong>

            </div>


            <div
                class="favorite-detail-description"
            >

                <span
                    class="favorite-detail-section-label"
                >
                    DISCOVERY BRIEF
                </span>

                <p>
                    ${description}
                </p>

            </div>


            <div
                class="favorite-detail-tags"
            >

                <span>
                    APOD
                </span>

                <span>
                    NASA
                </span>

                <span>
                    SPACE
                </span>

                <span>
                    ARCHIVE
                </span>

            </div>


            <div
                class="favorite-detail-actions"
            >

                ${
                    mediaURL
                        ? `
                            <a
                                href="${mediaURL}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="favorite-detail-primary"
                            >
                                VIEW FULL IMAGE

                                <span>
                                    ↗
                                </span>
                            </a>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="favorite-detail-secondary"
                    data-close-favorite-modal
                >
                    CLOSE DISCOVERY
                </button>

            </div>

        </div>
    `;


    /* =====================================================
    REACTIVAR CLOSE BUTTONS
    ===================================================== */

    panel
        .querySelectorAll(
            "[data-close-favorite-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeModal
                );
            }
        );
}


/* =========================================================
SAFE URL
========================================================= */

function getSafeURL(
    value
) {

    if (!value) {
        return "";
    }


    try {

        const url =
            new URL(
                value
            );


        if (
            url.protocol !==
                "https:" &&
            url.protocol !==
                "http:"
        ) {

            return "";
        }


        return escapeHTML(
            url.href
        );


    } catch {

        return "";
    }
}


/* =========================================================
DELETE BUTTONS
========================================================= */

function activateFavoriteDeleteButtons() {

    const buttons =
        document.querySelectorAll(
            ".favorite-delete-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {


                    const favoriteId =
                        button.dataset.id;


                    if (!favoriteId) {
                        return;
                    }


                    button.disabled =
                        true;


                    button.innerHTML = `
                        REMOVING...
                        <span>↻</span>
                    `;


                    try {

                        await deleteFavorite(
                            favoriteId
                        );


                    } catch (error) {

                        console.error(
                            "DELETE FAVORITE ERROR:",
                            error
                        );


                        button.disabled =
                            false;


                        button.innerHTML = `
                            <span
                                class="favorite-trash-icon"
                            >

                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >

                                    <path
                                        d="M4 7H20"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                    />

                                    <path
                                        d="M9 3H15"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                    />

                                    <path
                                        d="M6 7L7 20H17L18 7"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linejoin="round"
                                    />

                                </svg>

                            </span>
                        `;


                        alert(
                            "Unable to remove this favorite."
                        );
                    }
                }
            );
        }
    );
}


/* =========================================================
DELETE FAVORITE
========================================================= */

async function deleteFavorite(
    favoriteId
) {

    const response =
        await fetch(
            FAVORITES_API_URL +
            "/" +
            encodeURIComponent(
                favoriteId
            ) +
            "?userId=" +
            encodeURIComponent(
                FAVORITES_USER_ID
            ),
            {
                method:
                    "DELETE"
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );
    }


    const favoriteButton =
        document.getElementById(
            "add-favorite-btn"
        );


    if (favoriteButton) {

        favoriteButton.disabled =
            false;

        favoriteButton.textContent =
            "ADD TO FAVORITES";

        favoriteButton.classList.remove(
            "favorite-saved"
        );
    }


    const favoriteCard =
        document.querySelector(
            `[data-favorite-id="${CSS.escape(
                favoriteId
            )}"]`
        );


    if (favoriteCard) {

        favoriteCard.style.opacity =
            "0";

        favoriteCard.style.transform =
            "translateY(10px)";


        setTimeout(
            () => {

                loadFavorites();

            },
            250
        );


    } else {

        loadFavorites();
    }
}


/* =========================================================
ASTEROID WATCH
========================================================= */

async function loadAsteroids() {

    const asteroidCount =
        document.getElementById(
            "asteroid-count"
        );

    const hazardousCount =
        document.getElementById(
            "hazardous-count"
        );


    if (
        !asteroidCount ||
        !hazardousCount
    ) {

        return;
    }


    try {

        asteroidCount.textContent =
            "...";

        hazardousCount.textContent =
            "...";


        const response =
            await fetch(
                ASTEROIDS_API_URL
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        let totalAsteroids =
            0;

        let hazardousAsteroids =
            0;


        const objectsByDate =
            data.near_earth_objects ||
            {};


        Object.values(
            objectsByDate
        )
            .forEach(
                asteroidList => {


                    totalAsteroids +=
                        asteroidList.length;


                    asteroidList.forEach(
                        asteroid => {


                            if (
                                asteroid
                                    .is_potentially_hazardous_asteroid
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


        asteroidCount.textContent =
            "ERROR";

        hazardousCount.textContent =
            "ERROR";
    }
}


/* =========================================================
CARD LIGHT EFFECT
========================================================= */

function activateCardLighting() {

    const cards =
        document.querySelectorAll(
            ".explore-card"
        );


    cards.forEach(
        card => {


            card.addEventListener(
                "pointermove",
                event => {


                    const rect =
                        card
                            .getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left;


                    const y =
                        event.clientY -
                        rect.top;


                    const mouseX =
                        (
                            x /
                            rect.width
                        ) *
                        100;


                    const mouseY =
                        (
                            y /
                            rect.height
                        ) *
                        100;


                    card.style.setProperty(
                        "--mouse-x",
                        mouseX + "%"
                    );


                    card.style.setProperty(
                        "--mouse-y",
                        mouseY + "%"
                    );
                }
            );


            card.addEventListener(
                "pointerleave",
                () => {


                    card.style.setProperty(
                        "--mouse-x",
                        "50%"
                    );


                    card.style.setProperty(
                        "--mouse-y",
                        "50%"
                    );
                }
            );
        }
    );
}


/* =========================================================
CARD 3D EFFECT
========================================================= */

function activateCardTilt() {

    const cards =
        document.querySelectorAll(
            ".explore-card"
        );


    cards.forEach(
        card => {


            card.addEventListener(
                "pointermove",
                event => {


                    if (
                        window.innerWidth <
                        900
                    ) {

                        return;
                    }


                    const rect =
                        card
                            .getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left;


                    const y =
                        event.clientY -
                        rect.top;


                    const centerX =
                        rect.width /
                        2;


                    const centerY =
                        rect.height /
                        2;


                    const rotateX =
                        (
                            (
                                y -
                                centerY
                            ) /
                            centerY
                        ) *
                        -2;


                    const rotateY =
                        (
                            (
                                x -
                                centerX
                            ) /
                            centerX
                        ) *
                        2;


                    card.style.transform =
                        "perspective(900px) " +
                        "translateY(-12px) " +
                        "scale(1.015) " +
                        "rotateX(" +
                        rotateX +
                        "deg) " +
                        "rotateY(" +
                        rotateY +
                        "deg)";
                }
            );


            card.addEventListener(
                "pointerleave",
                () => {

                    card.style.transform =
                        "";
                }
            );
        }
    );
}


/* =========================================================
SCROLL REVEAL
========================================================= */

function activateScrollReveal() {

    const sections =
        document.querySelectorAll(
            ".section"
        );


    const observer =
        new IntersectionObserver(
            entries => {


                entries.forEach(
                    entry => {


                        if (
                            entry.isIntersecting
                        ) {


                            entry.target
                                .classList
                                .add(
                                    "section-visible"
                                );


                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );

            },
            {
                threshold:
                    0.12
            }
        );


    sections.forEach(
        section => {

            observer.observe(
                section
            );
        }
    );
}


/* =========================================================
HTML SECURITY
========================================================= */

function escapeHTML(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value == null
            ? ""
            : String(value);


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
            document.getElementById(
                "asteroid-refresh"
            );


        if (asteroidRefresh) {

            asteroidRefresh.addEventListener(
                "click",
                event => {


                    event.preventDefault();


                    loadAsteroids();
                }
            );
        }


        /* =================================================
        UNIVERSE REFRESH
        ================================================= */

        const universeRefresh =
            document.getElementById(
                "universe-refresh"
            );


        if (universeRefresh) {

            universeRefresh.addEventListener(
                "click",
                () => {


                    universeRefresh.disabled =
                        true;


                    universeRefresh.innerHTML = `
                        SYNCING UNIVERSE...
                        <span>↻</span>
                    `;


                    loadFavorites()
                        .finally(
                            () => {


                                universeRefresh.disabled =
                                    false;


                                universeRefresh.innerHTML = `
                                    REFRESH UNIVERSE
                                    <span>↻</span>
                                `;
                            }
                        );
                }
            );
        }


        /* =================================================
        MARS MISSION SYNC
        ================================================= */

        const marsRefresh =
            document.getElementById(
                "mars-refresh"
            );


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


                    setTimeout(
                        () => {


                            marsRefresh.classList.remove(
                                "mars-syncing"
                            );


                            marsRefresh.innerHTML = `
                                MISSION DATA SYNCHRONIZED
                                <span>✓</span>
                            `;

                        },
                        1500
                    );
                }
            );
        }
    }
);