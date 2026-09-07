import azure.functions as func
import logging
import os
import requests
import json
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
    "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
}


# =========================================================
# NASA APOD
# =========================================================

@app.route(
    route="apod",
    methods=["GET", "OPTIONS"]
)
def apod(req: func.HttpRequest) -> func.HttpResponse:

    if req.method == "OPTIONS":
        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )

    logging.info("Consultando NASA APOD")

    api_key = os.environ.get("NASA_API_KEY")

    if not api_key:
        return func.HttpResponse(
            "No se encontró la configuración NASA_API_KEY.",
            status_code=500,
            headers=CORS_HEADERS
        )

    try:

        response = requests.get(
            "https://api.nasa.gov/planetary/apod",
            params={
                "api_key": api_key
            },
            timeout=10
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
            f"Error al consultar la API de NASA: {error}"
        )

        return func.HttpResponse(
            "Error al consultar la API de NASA.",
            status_code=502,
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

    api_key = os.environ.get("NASA_API_KEY")

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
            timeout=10
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
            "Error al consultar los datos de asteroides de NASA.",
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

    # -----------------------------------------------------
    # CORS PREFLIGHT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CORS PREFLIGHT
    # -----------------------------------------------------

    if req.method == "OPTIONS":

        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )


    try:

        # -------------------------------------------------
        # OBTENER ID
        # -------------------------------------------------

        favorite_id = req.route_params.get(
            "favorite_id"
        )

        if not favorite_id:

            return func.HttpResponse(
                "No se proporcionó el ID del favorito.",
                status_code=400,
                headers=CORS_HEADERS
            )


        # -------------------------------------------------
        # OBTENER USER ID
        # -------------------------------------------------

        user_id = req.params.get(
            "userId",
            "default-user"
        )


        # -------------------------------------------------
        # ELIMINAR DE COSMOS DB
        # -------------------------------------------------

        favorites_container.delete_item(
            item=favorite_id,
            partition_key=user_id
        )


        # -------------------------------------------------
        # RESPUESTA EXITOSA
        # -------------------------------------------------

        return func.HttpResponse(
            json.dumps({
                "message": "Favorito eliminado correctamente."
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
                "error": "No se pudo eliminar el favorito."
            }),
            status_code=500,
            mimetype="application/json",
            headers=CORS_HEADERS
        )