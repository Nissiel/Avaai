"""
FastAPI entrypoint for Ava, the realtime French-speaking assistant.

The server exposes:
    - `/twiml`         : returns TwiML directing Twilio to open a media stream.
    - `/healthz`       : liveness endpoint for deployment checks.
    - `/public-url`    : utility endpoint mirroring the configured public URL.
    - `/media-stream`  : WebSocket endpoint receiving Twilio audio frames.

The detailed implementation of the media bridge lives in `ava_backend.call_session`.
"""

from __future__ import annotations

import logging
from urllib.parse import urlparse, urlunparse

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from twilio.twiml.voice_response import Connect, VoiceResponse

from ava_backend.call_session import CallSession
from ava_backend.config import Settings, get_settings

settings = get_settings()

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ava")

app = FastAPI(title="Ava Voice Assistant")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _compute_ws_url(request: Request, config: Settings) -> str:
    """
    Compute the absolute wss:// URL Twilio should use for the media stream.
    """
    base_url = config.public_base_url or str(request.base_url)
    parsed = urlparse(base_url)
    if not parsed.netloc:
        raise HTTPException(
            status_code=500,
            detail="PUBLIC_BASE_URL must be configured when running behind a proxy.",
        )
    ws_scheme = "wss"
    path = parsed.path.rstrip("/")
    path = f"{path}/media-stream"
    return urlunparse((ws_scheme, parsed.netloc, path, "", "", ""))


@app.api_route("/twiml", methods=["GET", "POST"])
async def twiml(request: Request) -> Response:
    """
    Respond to Twilio's webhook with instructions to open a media stream.
    """
    ws_url = _compute_ws_url(request, settings)

    response = VoiceResponse()
    connect = Connect()
    connect.stream(url=ws_url)
    response.append(connect)

    logger.info("TwiML généré pour stream %s", ws_url)
    return Response(content=str(response), media_type="text/xml")


@app.get("/public-url")
async def public_url(request: Request) -> JSONResponse:
    """
    Helper endpoint mirroring the configured public URL for frontends.
    """
    base_url = settings.public_base_url or str(request.base_url).rstrip("/")
    return JSONResponse({"publicUrl": base_url})


@app.get("/healthz")
async def health_check() -> dict[str, str]:
    """Simple health endpoint."""
    return {"status": "ok"}


@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket) -> None:
    """
    Core WebSocket endpoint bridging Twilio with OpenAI's Realtime API.
    """
    await websocket.accept()
    session = CallSession(websocket, settings)
    try:
        await session.run()
    except WebSocketDisconnect:
        logger.info("Déconnexion WebSocket côté Twilio.")
    except Exception:
        logger.exception("Erreur inattendue pendant la session d'appel.")
        await websocket.close(code=1011)
