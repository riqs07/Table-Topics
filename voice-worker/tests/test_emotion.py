"""OPTIONAL, PERSONAL USE ONLY: the audEERING model, tested only where it is installed and switched on."""

# Load the operating system settings reader
import os
# Load pytest
import pytest

# Skip unless ENABLE_AUDEERING=1 and torch and transformers are installed (the model downloads about 1.2 GB the first time)
pytestmark = pytest.mark.skipif(os.environ.get("ENABLE_AUDEERING") != "1", reason="the optional audEERING module is off (ENABLE_AUDEERING is not 1)")


def test_the_model_gives_three_scores_between_about_zero_and_one():
    """Arousal, dominance and valence for a synthetic voice."""
    # Load the scorer only now
    from app.emotion import EmotionScorer
    # Load the synthetic voice
    from tests.signals import voice
    # Scored
    scores = EmotionScorer().score(voice(150, 3))
    # Three scores in a sensible range, and the model's name
    assert all(-0.5 < scores[name] < 1.5 for name in ("arousal", "dominance", "valence")) and scores["model"] == "audeering-w2v2-msp-dim"
