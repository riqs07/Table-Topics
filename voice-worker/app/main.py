"""VoiceLab's voice worker (decision 91): one route that measures a take's voice.

POST /analyse with the recording as the body (its Content-Type set) and the
shared secret in the X-Worker-Secret header. The reply is JSON numbers only.
Nothing is stored: the audio lives in memory for the request and is dropped.
GET /health says the worker is up (no secret needed, no data).

Settings (environment variables):
- VOICE_WORKER_SECRET: required; the same value as on the VoiceLab server.
  Requests are refused until it is set.
- VOICE_WORKER_MAX_BYTES: the largest upload taken (default 8,000,000).
- ENABLE_AUDEERING=1: load the optional audEERING model (personal use only).
"""

# Load the operating system settings reader
import os
# Load the constant-time comparison
import secrets

# Load the web framework
from fastapi import FastAPI, Request
# Load the JSON reply
from fastapi.responses import JSONResponse
# Load the helper that runs slow work off the event loop
from starlette.concurrency import run_in_threadpool

# Load the measures
from app.analysis import SAMPLE_RATE, VERSION, measure
# Load the decoder
from app.audio import DecodeError, decode
# OPTIONAL (personal use only): the audEERING module; delete this line and the scorer below to remove it
from app import emotion

# The header carrying the shared secret
SECRET_HEADER = "x-worker-secret"
# The longest take measured, in seconds (the app's longest recording)
MAX_SECONDS = 1800
# The shortest secret accepted, so a weak one is refused at once
MIN_SECRET_LENGTH = 16

# The app
app = FastAPI(title="VoiceLab voice worker", version=VERSION, docs_url=None, redoc_url=None, openapi_url=None)
# OPTIONAL (personal use only): the audEERING scorer, loaded once at start when ENABLE_AUDEERING=1
SCORER = emotion.EmotionScorer() if emotion.enabled() else None


def max_bytes() -> int:
    """The largest upload taken, from the settings."""
    # The setting, or 8 MB
    return int(os.environ.get("VOICE_WORKER_MAX_BYTES", "8000000"))


def secret_ok(provided: str | None) -> bool | None:
    """True when the header matches the secret, False when not, None when the worker has no usable secret."""
    # The worker's secret
    expected = os.environ.get("VOICE_WORKER_SECRET", "").strip()
    # Not set, or too short to trust
    if len(expected) < MIN_SECRET_LENGTH:
        # The worker is not set up
        return None
    # Compared in constant time, so timing reveals nothing
    return secrets.compare_digest((provided or "").encode(), expected.encode())


def refusal(status: int, message: str) -> JSONResponse:
    """A plain JSON refusal."""
    # The message with its status
    return JSONResponse({"error": message}, status_code=status)


@app.get("/health")
def health():
    """The worker is up; says whether the optional module is on."""
    # Up, with the version
    return {"ok": True, "version": VERSION, "emotion": SCORER is not None}


@app.post("/analyse")
async def analyse(request: Request):
    """Measure one take's voice."""
    # The secret first, so strangers learn nothing
    allowed = secret_ok(request.headers.get(SECRET_HEADER))
    # The worker has no secret: refuse everything
    if allowed is None:
        # Not set up
        return refusal(503, "The worker's secret is not set.")
    # Wrong or missing secret
    if not allowed:
        # Refused
        return refusal(401, "Wrong or missing secret.")
    # The size the caller says, refused before reading when too big
    if int(request.headers.get("content-length") or 0) > max_bytes():
        # Too big
        return refusal(413, "The recording is too large.")
    # The audio, counted as it arrives
    data = bytearray()
    # Each piece
    async for piece in request.stream():
        # Added
        data.extend(piece)
        # Over the cap
        if len(data) > max_bytes():
            # Too big
            return refusal(413, "The recording is too large.")
    # Nothing sent
    if not data:
        # Refused
        return refusal(400, "The recording was empty.")
    # Turn it into samples, off the event loop
    try:
        # Decoded
        signal = await run_in_threadpool(decode, bytes(data))
    except DecodeError:
        # Not audio the worker can read
        return refusal(415, "The recording could not be read.")
    # The audio bytes are no longer needed
    data.clear()
    # Longer than any take
    if signal.size > MAX_SECONDS * SAMPLE_RATE:
        # Refused
        return refusal(413, "The recording is too long.")
    # Too short to measure anything
    if signal.size < SAMPLE_RATE // 2:
        # Refused
        return refusal(400, "The recording is too short.")
    # Every measure, off the event loop
    result = await run_in_threadpool(measure, signal)
    # OPTIONAL (personal use only): the audEERING scores, when the module is on
    result["emotion"] = await run_in_threadpool(SCORER.score, signal) if SCORER is not None else None
    # Numbers only
    return result
