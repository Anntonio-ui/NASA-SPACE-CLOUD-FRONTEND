import azure.functions as func
import logging
import os
import requests
import json
import re

from urllib.parse import urljoin
from datetime import date
from azure.cosmos import CosmosClient


app = func.FunctionApp(
    http_auth_level=func.AuthLevel.ANONYMOUS
)


# =========================================================
# AZURE COSMOS DB
# =========================================================

cosmos_connection = os.environ.get("COSMOS_DB_CONNECTION")

cosmos_client = CosmosClient.from_connection_string(
    cosmos_connection
)

database = cosmos_client.get_database_client(
    "NASACloudDB"
)

favorites_container = database.get_container_client(
    "Favorites"
)


# =========================================================
# CORS
# =========================================================

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
}


# =========================================================
# APOD STATIC FALLBACK
# =========================================================

APOD_STATIC_FALLBACK = {
    "date": "2026-09-06",
    "title": "Pluto in Enhanced Color",
    "explanation": (
        "NASA APOD is temporarily unavailable. "
        "NASA Space Cloud is displaying a previously verified "
        "astronomical discovery while the live NASA service reconnects."
    ),
    "media_type": "image",
    "url": (
        "https://apod.nasa.gov/apod/image/2609/"
        "PlutoEnhancedHiRes_NewHorizons_960.jpg"
    ),
    "hdurl": (
        "https://apod.nasa.gov/apod/image/2609/"
        "PlutoEnhancedHiRes_NewHorizons_5000.jpg"
    ),
    "service_status": "fallback"
}


# =========================================================
# NASA APOD FALLBACK
# =========================================================

def get_apod_fallback(requested_date=None):

    logging.warning(
        f"Intentando APOD fallback para fecha: "
        f"{requested_date or 'today'}"
    )

    try:

        # =================================================
        # CONSTRUIR URL APOD
        # =================================================

        if requested_date:

            match = re.match(
                r"^(\d{4})-(\d{2})-(\d{2})$",
                requested_date
            )

            if not match:

                raise ValueError(
                    "Formato de fecha APOD inválido."
                )

            year = match.group(1)[2:]
            month = match.group(2)
            day = match.group(3)

            apod_page_url = (
                "https://apod.nasa.gov/apod/ap"
                + year
                + month
                + day
                + ".html"
            )

        else:

            apod_page_url = (
                "https://apod.nasa.gov/apod/astropix.html"
            )

        logging.info(
            f"Consultando fallback APOD: {apod_page_url}"
        )

        response = requests.get(
            apod_page_url,
            timeout=15,
            headers={
                "User-Agent": "NASA-Space-Cloud/1.0"
            }
        )

        response.raise_for_status()

        html = response.text

        # =================================================
        # OBTENER IMAGEN
        # =================================================

        image_match = re.search(
            r'''(?:href|src)=["']([^"']*image/[^"']+)["']''',
            html,
            re.IGNORECASE
        )

        if not image_match:

            raise ValueError(
                "No se encontró imagen APOD."
            )

        image_url = urljoin(
            apod_page_url,
            image_match.group(1)
        )

        # =================================================
        # OBTENER TITULO
        # =================================================

        title_match = re.search(
            r"<b>\s*(.*?)\s*</b>",
            html,
            re.IGNORECASE | re.DOTALL
        )

        if title_match:

            title = re.sub(
                r"<[^>]+>",
                "",
                title_match.group(1)
            ).strip()

        else:

            title = "Astronomy Picture of the Day"

        # =================================================
        # OBTENER EXPLICACION
        # =================================================

        explanation = (
            "NASA astronomical discovery retrieved "
            "from the official Astronomy Picture "
            "of the Day archive."
        )

        explanation_match = re.search(
            r"<b>\s*Explanation:\s*</b>(.*?)(?:<p>|<center>|<hr)",
            html,
            re.IGNORECASE | re.DOTALL
        )

        if explanation_match:

            explanation_html = explanation_match.group(1)

            explanation = re.sub(
                r"<[^>]+>",
                " ",
                explanation_html
            )

            explanation = re.sub(
                r"\s+",
                " ",
                explanation
            ).strip()

        # =================================================
        # RESPUESTA
        # =================================================

        fallback_data = {

            "date":
                requested_date
                if requested_date
                else date.today().isoformat(),

            "title":
                title,

            "explanation":
                explanation,

            "media_type":
                "image",

            "url":
                image_url,

            "hdurl":
                image_url,

            "service_status":
                "official-historical-fallback"
        }

        logging.info(
            f"APOD fallback recuperado: "
            f"{fallback_data['date']} - "
            f"{fallback_data['title']}"
        )

        return fallback_data

    except Exception as error:

        logging.error(
            f"Falló APOD fallback oficial: {error}"
        )

        logging.warning(
            "Utilizando APOD fallback estático."
        )

        return APOD_STATIC_FALLBACK


# =========================================================
# NASA APOD
# =========================================================

@app.route(
    route="apod",
    methods=["GET", "OPTIONS"]
)
def apod(req: func.HttpRequest) -> func.HttpResponse:

    # -----------------------------------------------------
    # CORS PREFLIGHT
    # -----------------------------------------------------

    if req.method == "OPTIONS":

        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )


    logging.info(
        "NASA Space Cloud -> Consultando NASA APOD"
    )


    # -----------------------------------------------------
    # FECHA APOD OPCIONAL
    # /api/apod
    # /api/apod?date=2026-09-11
    # -----------------------------------------------------

    requested_date = req.params.get("date")


    # -----------------------------------------------------
    # NASA API KEY
    # -----------------------------------------------------

    api_key = os.environ.get(
        "NASA_API_KEY"
    )


    # -----------------------------------------------------
    # SIN API KEY -> FALLBACK
    # -----------------------------------------------------

    if not api_key:

        logging.error(
            "NASA_API_KEY no está configurada."
        )

        fallback = get_apod_fallback(
            requested_date
        )

        return func.HttpResponse(
            json.dumps(fallback),
            status_code=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )


    # -----------------------------------------------------
    # INTENTAR NASA API
    # -----------------------------------------------------

    try:

        params = {
            "api_key": api_key
        }

        if requested_date:

            params["date"] = requested_date


        logging.info(
            f"Consultando APOD para fecha: "
            f"{requested_date or 'today'}"
        )


        response = requests.get(
            "https://api.nasa.gov/planetary/apod",
            params=params,
            timeout=20,
            headers={
                "User-Agent": "NASA-Space-Cloud/1.0",
                "Accept": "application/json"
            }
        )


        logging.info(
            f"NASA APOD status: {response.status_code}"
        )


        response.raise_for_status()


        data = response.json()


        if not isinstance(data, dict):

            raise ValueError(
                "NASA APOD devolvió formato inesperado."
            )


        data["service_status"] = "live"


        logging.info(
            "NASA APOD recuperado correctamente."
        )


        return func.HttpResponse(
            json.dumps(data),
            status_code=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )


    # -----------------------------------------------------
    # NASA API ERROR -> FALLBACK HISTORICO
    # -----------------------------------------------------

    except Exception as error:

        logging.error(
            f"NASA APOD API ERROR: {error}"
        )


        fallback = get_apod_fallback(
            requested_date
        )


        return func.HttpResponse(
            json.dumps(fallback),
            status_code=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )


# =========================================================
# NASA NEO ASTEROIDS
# =========================================================

@app.route(
    route="asteroids",
    methods=["GET", "OPTIONS"]
)
def asteroids(req: func.HttpRequest) -> func.HttpResponse:

    if req.method == "OPTIONS":

        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )


    logging.info(
        "Consultando NASA NEO Asteroids"
    )


    api_key = os.environ.get(
        "NASA_API_KEY"
    )


    if not api_key:

        return func.HttpResponse(
            "No se encontró la configuración NASA_API_KEY.",
            status_code=500,
            headers=CORS_HEADERS
        )


    try:

        response = requests.get(
            "https://api.nasa.gov/neo/rest/v1/feed",
            params={
                "api_key": api_key
            },
            timeout=20,
            headers={
                "User-Agent": "NASA-Space-Cloud/1.0"
            }
        )


        response.raise_for_status()


        return func.HttpResponse(
            response.text,
            status_code=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )


    except requests.RequestException as error:

        logging.error(
            f"Error al consultar NASA NEO: {error}"
        )


        return func.HttpResponse(
            "Error al consultar los datos "
            "de asteroides de NASA.",
            status_code=502,
            headers=CORS_HEADERS
        )


# =========================================================
# FAVORITES - GET + POST + OPTIONS
# =========================================================

@app.route(
    route="favorites",
    methods=["GET", "POST", "OPTIONS"]
)
def favorites(req: func.HttpRequest) -> func.HttpResponse:


    if req.method == "OPTIONS":

        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )


    # =====================================================
    # GET FAVORITES
    # =====================================================

    if req.method == "GET":

        try:

            user_id = req.params.get(
                "userId",
                "default-user"
            )


            query = """
            SELECT * FROM c
            WHERE c.userId = @userId
            """


            parameters = [
                {
                    "name": "@userId",
                    "value": user_id
                }
            ]


            items = list(
                favorites_container.query_items(
                    query=query,
                    parameters=parameters,
                    partition_key=user_id
                )
            )


            return func.HttpResponse(
                json.dumps(items),
                status_code=200,
                mimetype="application/json",
                headers=CORS_HEADERS
            )


        except Exception as error:

            logging.error(
                f"Error obteniendo los favoritos: {error}"
            )


            return func.HttpResponse(
                "Error al obtener los favoritos.",
                status_code=500,
                headers=CORS_HEADERS
            )


    # =====================================================
    # POST FAVORITE
    # =====================================================

    if req.method == "POST":

        try:

            data = req.get_json()


            item = {

                "id": data["id"],

                "userId": data.get(
                    "userId",
                    "default-user"
                ),

                "type": data.get(
                    "type",
                    "unknown"
                ),

                "title": data.get(
                    "title",
                    ""
                ),

                "url": data.get(
                    "url",
                    ""
                ),

                "date": data.get(
                    "date",
                    ""
                ),

                "explanation": data.get(
                    "explanation",
                    ""
                )
            }


            favorites_container.upsert_item(
                item
            )


            return func.HttpResponse(
                "Favorito guardado correctamente.",
                status_code=201,
                headers=CORS_HEADERS
            )


        except Exception as error:

            logging.error(
                f"Error guardando favorito: {error}"
            )


            return func.HttpResponse(
                "Error al guardar el favorito.",
                status_code=500,
                headers=CORS_HEADERS
            )


# =========================================================
# DELETE FAVORITE
# =========================================================

@app.route(
    route="favorites/{favorite_id}",
    methods=["DELETE", "OPTIONS"]
)
def delete_favorite(
    req: func.HttpRequest
) -> func.HttpResponse:


    if req.method == "OPTIONS":

        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )


    try:

        favorite_id = req.route_params.get(
            "favorite_id"
        )


        if not favorite_id:

            return func.HttpResponse(
                "No se proporcionó el ID del favorito.",
                status_code=400,
                headers=CORS_HEADERS
            )


        user_id = req.params.get(
            "userId",
            "default-user"
        )


        favorites_container.delete_item(
            item=favorite_id,
            partition_key=user_id
        )


        return func.HttpResponse(

            json.dumps({
                "message":
                    "Favorito eliminado correctamente."
            }),

            status_code=200,

            mimetype="application/json",

            headers=CORS_HEADERS
        )


    except Exception as error:

        logging.error(
            f"Error eliminando favorito: {error}"
        )


        return func.HttpResponse(

            json.dumps({
                "error":
                    "No se pudo eliminar el favorito."
            }),

            status_code=500,

            mimetype="application/json",

            headers=CORS_HEADERS
        )