"""OPTIONAL, PERSONAL USE ONLY: audEERING's arousal, dominance and valence model.

Model: audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim
Licence: CC BY-NC-SA 4.0 (non-commercial, share-alike). It must not be used in
a commercial product. It is loaded ONLY when ENABLE_AUDEERING=1, needs the
extra packages in requirements-audeering.txt (torch, transformers), and can be
removed by deleting this file and the two lines in main.py that import it; the
app works fully without it (the three scores are simply missing).

The model class follows audEERING's model card: wav2vec2 with a regression
head on the mean of the last hidden states, giving arousal, dominance and
valence, each roughly 0 to 1.
"""

# Load the operating system settings reader
import os

# The model's name on Hugging Face
MODEL_NAME = "audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim"
# The longest stretch scored at once, in seconds (longer takes are scored in pieces and averaged)
CHUNK_SECONDS = 30
# The sample rate the model expects
MODEL_RATE = 16_000


def enabled() -> bool:
    """Whether the optional module is switched on (ENABLE_AUDEERING=1)."""
    # Only the exact value 1
    return os.environ.get("ENABLE_AUDEERING", "") == "1"


class EmotionScorer:
    """Loads the model once and scores takes; only built when enabled."""

    def __init__(self):
        """Load torch, transformers and the model (slow the first time: it downloads about 1.2 GB)."""
        # Load torch and its layers only now, so the worker never needs them when the module is off
        import torch
        # The layers
        from torch import nn
        # The wav2vec2 pieces
        from transformers import Wav2Vec2Model, Wav2Vec2PreTrainedModel, Wav2Vec2Processor

        class RegressionHead(nn.Module):
            """The model card's regression head."""

            def __init__(self, config):
                """Two layers with dropout, as on the model card."""
                # Set up the layer
                super().__init__()
                # The hidden layer
                self.dense = nn.Linear(config.hidden_size, config.hidden_size)
                # Dropout
                self.dropout = nn.Dropout(config.final_dropout)
                # The three outputs
                self.out_proj = nn.Linear(config.hidden_size, config.num_labels)

            def forward(self, features):
                """Dropout, dense, tanh, dropout, out."""
                # Dropout
                x = self.dropout(features)
                # Dense with tanh
                x = torch.tanh(self.dense(x))
                # Dropout again
                x = self.dropout(x)
                # The scores
                return self.out_proj(x)

        class EmotionModel(Wav2Vec2PreTrainedModel):
            """The model card's emotion model."""

            def __init__(self, config):
                """wav2vec2 and the head."""
                # Set up the model
                super().__init__(config)
                # Keep the settings
                self.config = config
                # The speech encoder
                self.wav2vec2 = Wav2Vec2Model(config)
                # The head
                self.classifier = RegressionHead(config)
                # Initialise any weights not in the checkpoint
                self.post_init()

            def forward(self, input_values):
                """Scores from the mean of the last hidden states."""
                # The encoder's output
                hidden = self.wav2vec2(input_values)[0]
                # Averaged over time
                pooled = torch.mean(hidden, dim=1)
                # The three scores
                return self.classifier(pooled)

        # Keep torch for scoring
        self._torch = torch
        # The audio preparer
        self._processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
        # The model, in evaluation mode
        self._model = EmotionModel.from_pretrained(MODEL_NAME).eval()

    def score(self, signal):
        """Arousal, dominance and valence for 16 kHz samples, averaged over 30-second pieces."""
        # Pieces of at most 30 seconds (at least one)
        size = CHUNK_SECONDS * MODEL_RATE
        # Each piece
        pieces = [signal[start:start + size] for start in range(0, max(len(signal), 1), size)]
        # Scores of each piece
        scores = []
        # No gradients needed
        with self._torch.no_grad():
            # Each piece
            for piece in pieces:
                # Prepared for the model
                values = self._processor(piece, sampling_rate=MODEL_RATE)["input_values"][0]
                # As a batch of one
                batch = self._torch.tensor(values, dtype=self._torch.float32).reshape(1, -1)
                # The three scores
                scores.append(self._model(batch)[0].tolist())
        # Averaged, in the model's order: arousal, dominance, valence
        arousal, dominance, valence = [sum(score[i] for score in scores) / len(scores) for i in range(3)]
        # Rounded, with the model's name
        return {"arousal": round(arousal, 3), "dominance": round(dominance, 3), "valence": round(valence, 3), "model": "audeering-w2v2-msp-dim"}
