"""Hosting the voice worker on Modal (see README.md). Deploy with: modal deploy modal_app.py"""

# Load Modal
import modal

# The image: Python with ffmpeg and the worker's packages, and the worker's code
image = (
    # A slim Python
    modal.Image.debian_slim(python_version="3.13")
    # ffmpeg and libsndfile
    .apt_install("ffmpeg", "libsndfile1")
    # The packages
    .pip_install_from_requirements("requirements.txt")
    # The code
    .add_local_python_source("app")
)

# The Modal app
modal_app = modal.App("voicelab-voice-worker", image=image)


# One web endpoint serving the FastAPI app, with the shared secret from Modal's secret store; scales to zero, at most two at once
@modal_app.function(secrets=[modal.Secret.from_name("voicelab-worker")], memory=1024, timeout=300, max_containers=2)
@modal.asgi_app()
def web():
    """The worker's FastAPI app."""
    # Load the app inside the container
    from app.main import app
    # Serve it
    return app
