"""The voice measures on synthetic signals with known answers."""

# Load the measures
from app.analysis import measure
# Load the synthetic voices
from tests.signals import noise, syllables, voice


def test_a_steady_voice_has_its_pitch_little_wobble_and_no_creak():
    """A steady 150 Hz voice: pitch 150 Hz, almost no range, low jitter, clear (high HNR), no creak."""
    # Measured
    result = measure(voice(150, 3))
    # Its pitch and range
    assert abs(result["f0"]["median_hz"] - 150) < 2 and result["f0"]["range_st"] < 0.5
    # Steady and clear
    assert result["jitter_local_pct"] < 1.5 and result["hnr_db"] > 15
    # No creak
    assert result["creak_pct"] < 5


def test_a_wobbly_voice_has_more_jitter_than_a_steady_one():
    """Random cycle-to-cycle wobble raises jitter."""
    # Both measured
    steady, wobbly = measure(voice(150, 3))["jitter_local_pct"], measure(voice(150, 3, wobble=0.03))["jitter_local_pct"]
    # More wobble, more jitter
    assert wobbly > steady * 2


def test_a_drop_into_very_low_pitch_counts_as_creak():
    """Half the take at 150 Hz, half at an irregular 45 Hz: a large share is creak."""
    # Load the array joiner
    import numpy as np
    # The two halves joined
    result = measure(np.concatenate([voice(150, 1.5), voice(45, 1.5, wobble=0.05, seed=2)]))
    # A good share of voiced time
    assert result["creak_pct"] > 20


def test_four_beats_a_second_count_as_about_four_syllables_a_second():
    """The syllable-nuclei count follows the beats."""
    # Five seconds at four beats a second
    result = measure(syllables(4, 5))
    # About 20 syllables, about 4 a second
    assert 17 <= result["syllables"] <= 22 and 3.4 <= result["speech_rate_sps"] <= 4.6
    # Articulation rate is at least the speech rate (pauses taken out)
    assert result["articulation_rate_sps"] >= result["speech_rate_sps"]


def test_spectral_tilt_follows_the_energy_above_one_kilohertz():
    """A brighter voice (more energy above 1 kHz) has a higher alpha ratio and a smaller Hammarberg index."""
    # Load the array tools
    import numpy as np
    # The ordinary voice
    dull = voice(150, 2)
    # The same with a strong 2.5 kHz partial added
    bright = dull + 0.2 * np.sin(2 * np.pi * 2500 * np.arange(dull.size) / 16000)
    # Both measured
    a, b = measure(dull), measure(bright)
    # Brighter: higher alpha ratio, smaller Hammarberg
    assert b["alpha_ratio_db"] > a["alpha_ratio_db"] and b["hammarberg_db"] < a["hammarberg_db"]


def test_hiss_with_no_voice_gives_empty_voice_measures_not_errors():
    """No voice: every voice measure is None, and nothing fails."""
    # Measured
    result = measure(noise(2))
    # Empty, not made up
    assert result["f0"] is None and result["jitter_local_pct"] is None and result["hnr_db"] is None and result["alpha_ratio_db"] is None and result["creak_pct"] is None
