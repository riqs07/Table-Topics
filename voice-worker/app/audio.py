"""Turning an uploaded recording into samples (VoiceLab decision 91).

Browsers record WebM or Ogg with Opus (Chrome, Firefox) or MP4 with AAC
(Safari). ffmpeg reads them all, so every upload is piped through it into
16 kHz mono 16-bit samples. Nothing touches the disk: the audio goes in and
out through pipes and is dropped when the request ends.
"""

# Load the process runner, for ffmpeg
import subprocess
# Load the numeric array library
import numpy as np

# The sample rate the measures use
from app.analysis import SAMPLE_RATE

# The longest ffmpeg may take to convert one take, in seconds
DECODE_TIMEOUT_S = 120


class DecodeError(Exception):
    """The upload could not be read as audio."""


def decode(data: bytes) -> np.ndarray:
    """Convert any recording ffmpeg can read into mono samples between -1 and 1 at 16 kHz."""
    # Ask ffmpeg to read from the input pipe and write raw samples to the output pipe, quietly
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "pipe:1"]
    # Run it
    try:
        # The audio in, the samples out
        result = subprocess.run(command, input=data, capture_output=True, timeout=DECODE_TIMEOUT_S, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        # ffmpeg missing or too slow
        raise DecodeError(f"ffmpeg could not run: {type(error).__name__}") from error
    # ffmpeg refused it
    if result.returncode != 0 or not result.stdout:
        # Not audio it can read
        raise DecodeError("ffmpeg could not read the recording")
    # The samples, scaled to -1 to 1
    return np.frombuffer(result.stdout, dtype=np.int16).astype(np.float64) / 32768.0
