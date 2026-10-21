# VoiceLab's voice worker (decision 91): Python with ffmpeg, Praat (parselmouth) and librosa.
# Build:  docker build -t voicelab-voice-worker .
# With the optional, personal-use-only audEERING model: add --build-arg AUDEERING=1 and run with ENABLE_AUDEERING=1.
FROM python:3.13-slim

# ffmpeg reads the browsers' recordings (WebM/Opus, MP4/AAC); libsndfile backs librosa
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*

# Work in /srv
WORKDIR /srv

# Install the packages first, so code changes rebuild quickly
COPY requirements.txt requirements-audeering.txt ./
# The worker's packages
RUN pip install --no-cache-dir -r requirements.txt

# Whether to add the optional audEERING packages (0 by default)
ARG AUDEERING=0
# Added only when asked (CPU-only torch keeps the image smaller)
RUN if [ "$AUDEERING" = "1" ]; then pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements-audeering.txt; fi

# The code
COPY app ./app

# Run as a user without special rights
RUN useradd --create-home worker
# (switch to it)
USER worker

# Cloud Run and most hosts pass the port in PORT
ENV PORT=8080
# Serve the app on that port
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
