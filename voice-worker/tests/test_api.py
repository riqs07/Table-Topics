"""The worker's route: the secret, the size and format checks, and a real measurement."""

# Load the test client
from fastapi.testclient import TestClient
# Load pytest's fixtures
import pytest

# Load the app
from app import main
# Load the synthetic voices
from tests.signals import voice, wav_bytes

# The secret used in the tests (made up, long enough)
SECRET = "a long worker secret for testing"


@pytest.fixture
def client(monkeypatch):
    """A client against the app with the secret set and a small size cap."""
    # The secret
    monkeypatch.setenv("VOICE_WORKER_SECRET", SECRET)
    # A 2 MB cap
    monkeypatch.setenv("VOICE_WORKER_MAX_BYTES", "2000000")
    # The client
    return TestClient(main.app)


def post(client, body, secret=SECRET, kind="audio/wav"):
    """Post a body with a secret."""
    # The request
    return client.post("/analyse", content=body, headers={"content-type": kind, **({"x-worker-secret": secret} if secret else {})})


def test_health_needs_no_secret_and_says_the_optional_module_is_off(client):
    """Health is open and carries no data."""
    # Asked
    reply = client.get("/health")
    # Up, with the module off
    assert reply.status_code == 200 and reply.json()["emotion"] is False


def test_a_take_is_measured_and_only_numbers_come_back(client):
    """A WAV voice comes back measured, with the module's scores empty."""
    # Posted
    reply = post(client, wav_bytes(voice(150, 2)))
    # Measured
    body = reply.json()
    # Numbers, the versions, and no emotion scores
    assert reply.status_code == 200 and abs(body["f0"]["median_hz"] - 150) < 3 and body["version"] == "1" and body["emotion"] is None


def test_a_wrong_or_missing_secret_is_refused(client):
    """Without the right secret nothing is measured."""
    # Wrong and missing
    assert post(client, b"x", secret="not the secret at all!").status_code == 401 and post(client, b"x", secret=None).status_code == 401


def test_a_worker_without_a_secret_refuses_everything(monkeypatch):
    """No secret set: every request is refused as not set up."""
    # No secret
    monkeypatch.delenv("VOICE_WORKER_SECRET", raising=False)
    # Refused
    assert post(TestClient(main.app), b"x").status_code == 503


def test_a_short_secret_on_the_worker_counts_as_not_set(monkeypatch):
    """A secret under 16 characters is not trusted."""
    # Too short
    monkeypatch.setenv("VOICE_WORKER_SECRET", "short")
    # Refused, even with the matching header
    assert post(TestClient(main.app), b"x", secret="short").status_code == 503


def test_an_upload_over_the_cap_is_refused(client):
    """Over 2 MB is refused before measuring."""
    # Too big
    assert post(client, b"\0" * 2_000_001).status_code == 413


def test_something_that_is_not_audio_is_refused(client):
    """ffmpeg cannot read it."""
    # Not audio
    assert post(client, b"this is not a recording").status_code == 415


def test_an_empty_upload_is_refused(client):
    """Nothing to measure."""
    # Empty
    assert post(client, b"").status_code == 400
