"""Synthetic voices for the tests: pulse trains shaped like a vowel, so Praat finds a pitch."""

# Load the numeric array library
import numpy as np

# The worker's sample rate
from app.analysis import SAMPLE_RATE


def voice(pitch_hz, seconds, wobble=0.0, seed=0):
    """A buzz at a pitch (glottal-like pulses through a simple resonance), with optional cycle-to-cycle wobble."""
    # Repeatable randomness
    rng = np.random.default_rng(seed)
    # Samples
    count = int(seconds * SAMPLE_RATE)
    # Silence to start with
    pulses = np.zeros(count)
    # The time of the next pulse
    moment = 0.0
    # Place pulses until the end
    while moment < seconds:
        # One pulse
        pulses[min(int(moment * SAMPLE_RATE), count - 1)] = 1.0
        # The next, a period later with some wobble
        moment += (1.0 / pitch_hz) * (1.0 + rng.normal(0.0, wobble))
    # A decaying 700 Hz resonance, like a vowel's first formant
    ring = np.exp(-np.arange(200) / 30.0) * np.sin(np.arange(200) * 2 * np.pi * 700 / SAMPLE_RATE)
    # The pulses through it
    shaped = np.convolve(pulses, ring)[:count]
    # Scaled to half of full volume
    return 0.5 * shaped / np.abs(shaped).max()


def syllables(rate_per_second, seconds, pitch_hz=150):
    """A voice whose loudness rises and falls a set number of times a second, like syllables."""
    # The times of each sample
    times = np.arange(int(seconds * SAMPLE_RATE)) / SAMPLE_RATE
    # A loudness that dips to silence between beats
    envelope = 0.5 * (1 - np.cos(2 * np.pi * rate_per_second * times))
    # The voice under it
    return voice(pitch_hz, seconds) * envelope


def noise(seconds, seed=1):
    """Plain hiss with no voice."""
    # Random samples
    return np.random.default_rng(seed).normal(0.0, 0.1, int(seconds * SAMPLE_RATE))


def wav_bytes(signal):
    """The signal as a 16-bit mono WAV file in memory."""
    # Load the WAV writer and the in-memory file
    import io
    import wave
    # An in-memory file
    buffer = io.BytesIO()
    # Written as WAV
    with wave.open(buffer, "wb") as out:
        # Mono
        out.setnchannels(1)
        # 16-bit
        out.setsampwidth(2)
        # 16 kHz
        out.setframerate(SAMPLE_RATE)
        # The samples
        out.writeframes((np.clip(signal, -1, 1) * 32767).astype(np.int16).tobytes())
    # The bytes
    return buffer.getvalue()
