"""Voice measures for one take (VoiceLab decision 91).

Pure functions over a mono signal: Praat (through parselmouth) for pitch,
jitter, shimmer, harmonics-to-noise and the syllable count; numpy and librosa
for the spectral tilt (alpha ratio, Hammarberg index). Each measure is None
when the take has too little voice to measure it.

Definitions (documented again in README.md):
- Jitter (local, %) and shimmer (local, dB): Praat's standard settings
  (period floor 0.1 ms, ceiling 20 ms, maximum period factor 1.3, maximum
  amplitude factor 1.6) on a cross-correlation point process from 75 to 600 Hz.
- HNR (dB): Praat's cross-correlation harmonicity, averaged over voiced frames.
- Alpha ratio (dB): energy from 1 to 5 kHz against 50 Hz to 1 kHz, per voiced
  frame, averaged (eGeMAPS definition; usually negative, higher = more effort).
- Hammarberg index (dB): strongest peak 0 to 2 kHz against strongest peak 2 to
  5 kHz, per voiced frame, averaged (usually positive, smaller = more effort).
- Creak share (%): a rough heuristic. A second pitch track with a floor of
  30 Hz finds voicing that the ordinary track (floor 75 Hz) misses. A voiced
  frame counts as creaky when its pitch is below 60% of the speaker's median,
  or below 85% of it while the frame's harmonics-to-noise ratio is under 5 dB.
  Pitch-halving errors also land here, so treat it as a trend, not a diagnosis.
- Syllables, speech rate and articulation rate: the de Jong and Wempe (2009)
  syllable-nuclei method. Intensity peaks at least 2 dB above the dip before
  the next peak, above a threshold 25 dB under the 99th percentile, inside
  sounding stretches and where Praat finds voicing, each count as a syllable.
  Speech rate divides by the whole take; articulation rate by sounding time
  (silences of 0.3 s or more removed).
"""

# Load the numeric array library
import numpy as np
# Load the spectrum tools
import librosa
# Load Praat for Python
import parselmouth
# Load Praat's command runner
from parselmouth.praat import call

# The worker's own version, sent with every reply (the app stores it as the engine)
VERSION = "1"
# The sample rate every take is converted to before measuring
SAMPLE_RATE = 16_000
# The Praat version inside parselmouth, sent with every reply
PRAAT_VERSION = parselmouth.PRAAT_VERSION
# Fewest voiced pitch frames (a fifth of a second) before voice quality is measured
MIN_VOICED_FRAMES = 20
# The pitch range for ordinary measures, in hertz
PITCH_FLOOR, PITCH_CEILING = 75.0, 600.0
# The lowest pitch looked for when finding creak, in hertz
CREAK_FLOOR = 30.0
# Creak: pitch below this share of the median always counts
CREAK_LOW = 0.6
# Creak: pitch below this share of the median counts when the voice is also noisy
CREAK_NOISY = 0.85
# Creak: "noisy" means a harmonics-to-noise ratio under this, in decibels
CREAK_HNR_DB = 5.0
# Syllable nuclei: the silence threshold below the 99th percentile of intensity, in decibels
SILENCE_DB = -25.0
# Syllable nuclei: the smallest dip between two peaks, in decibels
MIN_DIP_DB = 2.0
# Sounding stretches: silences shorter than this are bridged, in seconds
MIN_SILENCE_S = 0.3
# Sounding stretches: sounds shorter than this are dropped, in seconds
MIN_SOUNDING_S = 0.1


def _finite(value):
    """A plain float, or None when the value is missing or not a number."""
    # Nothing given
    if value is None:
        # Nothing back
        return None
    # As a float
    number = float(value)
    # Not a number (Praat's "undefined") becomes None
    return number if np.isfinite(number) else None


def _rounded(value, places=2):
    """A float rounded for the reply, or None."""
    # Checked first
    number = _finite(value)
    # Rounded when present
    return None if number is None else round(number, places)


def pitch_track(sound, floor=PITCH_FLOOR, ceiling=PITCH_CEILING):
    """Praat's pitch every 10 ms: the times and the frequencies (0 where unvoiced)."""
    # Autocorrelation pitch, 10 ms apart
    pitch = sound.to_pitch_ac(time_step=0.01, pitch_floor=floor, pitch_ceiling=ceiling)
    # The frame times and frequencies
    return pitch.xs(), pitch.selected_array["frequency"]


def f0_summary(frequencies):
    """Median, 10th and 90th percentile pitch in hertz, and range and spread in semitones; None with too little voice."""
    # The voiced frames
    voiced = frequencies[frequencies > 0]
    # Too little voice
    if voiced.size < MIN_VOICED_FRAMES:
        # Nothing to say
        return None
    # The median and percentiles
    median, p10, p90 = np.median(voiced), np.percentile(voiced, 10), np.percentile(voiced, 90)
    # Every frame in semitones from the median
    steps = 12 * np.log2(voiced / median)
    # The summary
    return {"median_hz": round(float(median), 1), "p10_hz": round(float(p10), 1), "p90_hz": round(float(p90), 1), "range_st": round(float(12 * np.log2(p90 / p10)), 2), "sd_st": round(float(np.std(steps)), 2)}


def voice_quality(sound):
    """Jitter (local, %), shimmer (local, dB) and HNR (dB), with Praat's standard settings."""
    # The glottal pulses
    pulses = call(sound, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
    # Jitter as a fraction, made a percentage
    jitter = _finite(call(pulses, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3))
    # Shimmer in decibels
    shimmer = _finite(call([sound, pulses], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    # Harmonicity every 10 ms
    harmonicity = sound.to_harmonicity_cc(time_step=0.01, minimum_pitch=PITCH_FLOOR)
    # Its values, leaving out Praat's -200 dB for silence
    values = harmonicity.values[0]
    # The voiced ones
    voiced = values[values > -199]
    # The average, when any
    hnr = float(np.mean(voiced)) if voiced.size > 0 else None
    # The three
    return {"jitter_local_pct": _rounded(None if jitter is None else jitter * 100, 3), "shimmer_local_db": _rounded(shimmer, 3), "hnr_db": _rounded(hnr)}


def voiced_mask(frame_times, pitch_times, frequencies):
    """Which spectrum frames are voiced, by the nearest pitch frame."""
    # No pitch frames
    if len(pitch_times) == 0:
        # Nothing voiced
        return np.zeros(len(frame_times), dtype=bool)
    # The nearest pitch frame for each spectrum frame
    nearest = np.clip(np.searchsorted(pitch_times, frame_times), 0, len(pitch_times) - 1)
    # Voiced where that frame had a pitch
    return frequencies[nearest] > 0


def spectral_tilt(signal, sample_rate, pitch_times, frequencies):
    """Alpha ratio and Hammarberg index in decibels, averaged over voiced frames."""
    # Power spectrum: 25 ms windows, 10 ms apart
    power = np.abs(librosa.stft(signal, n_fft=512, hop_length=int(sample_rate * 0.01), win_length=int(sample_rate * 0.025))) ** 2
    # The frequency of each bin
    bins = librosa.fft_frequencies(sr=sample_rate, n_fft=512)
    # The time of each frame
    times = librosa.frames_to_time(np.arange(power.shape[1]), sr=sample_rate, hop_length=int(sample_rate * 0.01))
    # The voiced frames
    voiced = voiced_mask(times, pitch_times, frequencies)
    # Too little voice
    if voiced.sum() < MIN_VOICED_FRAMES:
        # Nothing to say
        return {"alpha_ratio_db": None, "hammarberg_db": None}
    # Only voiced frames
    frames = power[:, voiced]
    # A tiny floor so silent bands never divide by zero
    tiny = 1e-12
    # Energy from 50 Hz to 1 kHz, and from 1 to 5 kHz
    low = frames[(bins >= 50) & (bins < 1000)].sum(axis=0) + tiny
    # (high band)
    high = frames[(bins >= 1000) & (bins < 5000)].sum(axis=0) + tiny
    # Alpha ratio per frame
    alpha = 10 * np.log10(high / low)
    # Strongest peak below 2 kHz, and from 2 to 5 kHz
    peak_low = frames[bins < 2000].max(axis=0) + tiny
    # (2 to 5 kHz)
    peak_high = frames[(bins >= 2000) & (bins < 5000)].max(axis=0) + tiny
    # Hammarberg per frame
    hammarberg = 10 * np.log10(peak_low / peak_high)
    # Both averaged
    return {"alpha_ratio_db": _rounded(np.mean(alpha)), "hammarberg_db": _rounded(np.mean(hammarberg))}


def creak_share(sound, median_hz):
    """Share of voiced time in creak, as a percentage (see the module notes); None without a usual pitch."""
    # No usual pitch to compare with
    if median_hz is None:
        # Nothing to say
        return None
    # A pitch track that reaches down into creak
    times, low = pitch_track(sound, floor=CREAK_FLOOR)
    # Its voiced frames
    voiced = low > 0
    # Too little voice
    if voiced.sum() < MIN_VOICED_FRAMES:
        # Nothing to say
        return None
    # Harmonics-to-noise every 10 ms, read at the pitch frames
    harmonicity = sound.to_harmonicity_cc(time_step=0.01, minimum_pitch=CREAK_FLOOR)
    # Its values at the nearest frame
    hnr = harmonicity.values[0][np.clip(np.searchsorted(harmonicity.xs(), times), 0, harmonicity.values.shape[1] - 1)]
    # Very low pitch, or low pitch with a noisy voice
    creaky = voiced & ((low < CREAK_LOW * median_hz) | ((low < CREAK_NOISY * median_hz) & (hnr < CREAK_HNR_DB)))
    # As a share of voiced frames
    return round(float(creaky.sum() / voiced.sum() * 100), 1)


def sounding_mask(levels, threshold, step):
    """Which intensity frames are inside sounding stretches: above the threshold, short silences bridged, short sounds dropped."""
    # Above the threshold
    loud = levels > threshold
    # Runs of equal values: where each starts and how long it is
    def runs(mask):
        # The places the value changes
        edges = np.flatnonzero(np.diff(mask.astype(int))) + 1
        # Each run's start and end
        starts, ends = np.concatenate(([0], edges)), np.concatenate((edges, [mask.size]))
        # Each run with its value
        return [(start, end, bool(mask[start])) for start, end in zip(starts, ends)]
    # Bridge silences shorter than the minimum (between two sounds)
    for start, end, value in runs(loud):
        # A short silence inside the take
        if not value and start > 0 and end < loud.size and (end - start) * step < MIN_SILENCE_S:
            # Counted as sounding
            loud[start:end] = True
    # Drop sounds shorter than the minimum
    for start, end, value in runs(loud):
        # A short sound
        if value and (end - start) * step < MIN_SOUNDING_S:
            # Counted as silence
            loud[start:end] = False
    # The stretches
    return loud


def syllable_nuclei(sound, pitch_times, frequencies):
    """Syllables from intensity peaks (de Jong and Wempe 2009), with the speech and articulation rates."""
    # Intensity in decibels, 10 ms apart
    intensity = sound.to_intensity(minimum_pitch=50.0, time_step=0.01)
    # Its values and times
    levels, times = intensity.values[0], intensity.xs()
    # Nothing to measure
    if levels.size < 3:
        # Nothing to say
        return {"syllables": None, "speech_rate_sps": None, "articulation_rate_sps": None}
    # The silence threshold, never below the quietest frame
    threshold = max(float(np.percentile(levels, 99)) + SILENCE_DB, float(levels.min()))
    # The sounding stretches
    sounding = sounding_mask(levels, threshold, 0.01)
    # Local peaks above the threshold
    peaks = [index for index in range(1, levels.size - 1) if levels[index] > levels[index - 1] and levels[index] >= levels[index + 1] and levels[index] > threshold]
    # Peaks that stand out: at least the minimum dip down to the next peak (the last one always stands)
    kept = [current for current, following in zip(peaks, peaks[1:] + [None]) if following is None or levels[current] - levels[current:following + 1].min() >= MIN_DIP_DB]
    # Only peaks inside sounding stretches and where Praat finds voicing
    voiced_at = voiced_mask(times[kept], pitch_times, frequencies) if kept else np.array([], dtype=bool)
    # The syllables
    syllables = int(sum(1 for index, voiced in zip(kept, voiced_at) if voiced and sounding[index]))
    # The whole take, and the sounding time
    duration, phonation = float(sound.duration), float(sounding.sum() * 0.01)
    # The counts and rates
    return {"syllables": syllables, "speech_rate_sps": _rounded(syllables / duration if duration > 0 else None), "articulation_rate_sps": _rounded(syllables / phonation if phonation > 0 else None)}


def measure(signal, sample_rate=SAMPLE_RATE):
    """Every measure for one take, as the reply's fields (without the optional emotion scores)."""
    # Make sure it is a float array
    signal = np.asarray(signal, dtype=np.float64)
    # Praat's view of it
    sound = parselmouth.Sound(signal, sampling_frequency=sample_rate)
    # The ordinary pitch track
    pitch_times, frequencies = pitch_track(sound)
    # Pitch summary
    f0 = f0_summary(frequencies)
    # Enough voice for voice quality
    enough = int((frequencies > 0).sum()) >= MIN_VOICED_FRAMES
    # The reply
    return {
        # Versions
        "version": VERSION, "praat_version": PRAAT_VERSION,
        # How long, and how much was voiced
        "duration_s": round(float(sound.duration), 2), "voiced_s": round(float((frequencies > 0).sum() * 0.01), 2),
        # Voice quality
        **(voice_quality(sound) if enough else {"jitter_local_pct": None, "shimmer_local_db": None, "hnr_db": None}),
        # Spectral tilt
        **spectral_tilt(signal.astype(np.float32), sample_rate, pitch_times, frequencies),
        # Creak
        "creak_pct": creak_share(sound, f0["median_hz"] if f0 else None),
        # Syllables and rates
        **syllable_nuclei(sound, pitch_times, frequencies),
        # Pitch
        "f0": f0,
    }
