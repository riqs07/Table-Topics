// Make the commercial's music bed and its few interface sounds as WAV files, from plain sine waves, so they are ours and the same on every run
// Run: node scripts/commercial-audio.mjs  (writes public/commercial/music.mp3, pop.wav, tap.wav, chime.wav, tick.wav)

// Load the file and path tools
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

// Samples a second
const RATE = 44100;
// Where the sounds go
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public", "commercial");

// Write mono samples (-1 to 1) as a 16-bit WAV file
function writeWav(name, samples) {
  // The file: a 44-byte header, then the samples
  const buffer = Buffer.alloc(44 + samples.length * 2);
  // The header, field by field
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + samples.length * 2, 4); buffer.write("WAVE", 8); buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(samples.length * 2, 40);
  // Each sample, clipped to the range
  samples.forEach((value, index) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + index * 2));
  // Saved
  writeFileSync(path.join(OUT, name), buffer);
}

// A note's frequency from its MIDI number
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Add a soft electric-piano note into the buffer: a sine with a little second harmonic, a quick start and a gentle fade
function keys(buffer, start, midi, length, level) {
  // Where it starts, and how many samples it lasts
  const [first, count] = [Math.floor(start * RATE), Math.floor(length * RATE)];
  // Its frequency
  const f = hz(midi);
  // Each sample of the note
  for (let i = 0; i < count && first + i < buffer.length; i++) {
    // Time into the note
    const t = i / RATE;
    // A 6 ms rise, then an exponential fade
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 2.6);
    // The tone: mostly the note, a touch of its octave, a whisper of the fifth above that
    buffer[first + i] += level * env * (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 6) + 0.05 * Math.sin(6 * Math.PI * f * t));
  }
}

// Add a slow pad chord: slightly detuned sines that swell in and out
function pad(buffer, start, notes, length, level) {
  // Where it starts, and how many samples it lasts
  const [first, count] = [Math.floor(start * RATE), Math.floor(length * RATE)];
  // Each sample
  for (let i = 0; i < count && first + i < buffer.length; i++) {
    // Time into the chord
    const t = i / RATE;
    // A slow swell in and out
    const env = Math.min(1, t / 0.9) * Math.min(1, (length - t) / 0.9);
    // Each note, as two sines a hair apart for warmth
    let value = 0;
    for (const midi of notes) value += Math.sin(2 * Math.PI * hz(midi) * 0.999 * t) + Math.sin(2 * Math.PI * hz(midi) * 1.001 * t);
    // Mixed in quietly
    buffer[first + i] += (level * env * value) / (notes.length * 2);
  }
}

// Add a soft round bass note
function bass(buffer, start, midi, length, level) {
  // Where it starts, and how many samples it lasts
  const [first, count] = [Math.floor(start * RATE), Math.floor(length * RATE)];
  // Each sample
  for (let i = 0; i < count && first + i < buffer.length; i++) {
    // Time into the note
    const t = i / RATE;
    // A soft start and a fade over the note
    const env = Math.min(1, t / 0.03) * Math.min(1, (length - t) / 0.15);
    // A plain sine
    buffer[first + i] += level * env * Math.sin(2 * Math.PI * hz(midi) * t);
  }
}

// The music: 47 seconds, quiet and unhurried until the reveal at 8 seconds, then a warm four-chord loop at 92 beats a minute
function music() {
  // The length in seconds and the buffer
  const seconds = 47;
  const buffer = new Float64Array(seconds * RATE);
  // One beat
  const beat = 60 / 92;
  // The opening (0–8 s): one held, slightly unsettled chord (D minor with an added ninth), very soft
  pad(buffer, 0, [50, 57, 64, 65], 8.4, 0.10);
  // The chords from the reveal: F, D minor, B flat, C (each two bars of four beats)
  const CHORDS = [
    { root: 41, tones: [65, 69, 72, 77] },
    { root: 38, tones: [62, 65, 69, 74] },
    { root: 46, tones: [62, 65, 70, 74] },
    { root: 48, tones: [64, 67, 72, 76] },
  ];
  // The arpeggio pattern over eight eighth notes: chord tone indexes, or nothing for a rest
  const PATTERN = [0, 2, 1, 3, 2, null, 1, 2];
  // From the reveal to the end card's close
  const begin = 8;
  // Each bar, chord by chord, two bars per chord
  for (let bar = 0; begin + bar * 4 * beat < seconds - 2; bar++) {
    // This bar's start and chord
    const start = begin + bar * 4 * beat;
    const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
    // The pad under it, a little quieter than the keys
    pad(buffer, start, chord.tones.map((midi) => midi - 12), 4 * beat + 0.4, 0.07);
    // The bass on beats one and three
    bass(buffer, start, chord.root, 1.8 * beat, 0.16);
    bass(buffer, start + 2 * beat, chord.root, 1.8 * beat, 0.12);
    // The arpeggio in eighth notes, softer in the first two bars so it grows in
    const grow = Math.min(1, 0.55 + bar * 0.15);
    PATTERN.forEach((index, step) => { if (index !== null) keys(buffer, start + step * beat / 2, chord.tones[index], 1.4, 0.075 * grow); });
  }
  // The last chord rings out under the end card
  pad(buffer, seconds - 5, [65, 69, 72, 77], 5, 0.09);
  keys(buffer, seconds - 5, 77, 4, 0.08);
  // A fade in at the start and a fade out over the last two seconds
  for (let i = 0; i < buffer.length; i++) {
    // Time
    const t = i / RATE;
    // Both fades
    buffer[i] *= Math.min(1, t / 1.2) * Math.min(1, (seconds - t) / 2);
  }
  // Brought to a steady, quiet peak
  const peak = buffer.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  return buffer.map((value) => (value / peak) * 0.6);
}

// A short sound from a formula, over a length in seconds
const sound = (length, formula) => Float64Array.from({ length: Math.floor(length * RATE) }, (_, i) => formula(i / RATE));

// Make everything
mkdirSync(OUT, { recursive: true });
// The music bed, written as WAV and kept as a small MP3 (ffmpeg, as scripts/prepare.mjs uses)
writeWav("music.wav", music());
spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(OUT, "music.wav"), "-b:a", "160k", path.join(OUT, "music.mp3")], { stdio: "inherit" });
rmSync(path.join(OUT, "music.wav"));
// A soft pop for things appearing: a short sine that drops in pitch
writeWav("pop.wav", sound(0.12, (t) => 0.5 * Math.exp(-t * 38) * Math.sin(2 * Math.PI * (900 - 2600 * t) * t)));
// A tap for the cursor: a tiny filtered click
writeWav("tap.wav", sound(0.05, (t) => 0.45 * Math.exp(-t * 160) * Math.sin(2 * Math.PI * 1800 * t)));
// A chime for a good moment: two bell notes a fifth apart
writeWav("chime.wav", sound(1.2, (t) => 0.32 * (Math.exp(-t * 4) * Math.sin(2 * Math.PI * hz(84) * t) + (t > 0.09 ? Math.exp(-(t - 0.09) * 4) * Math.sin(2 * Math.PI * hz(91) * (t - 0.09)) : 0))));
// A soft tick for ticking things off
writeWav("tick.wav", sound(0.08, (t) => 0.35 * Math.exp(-t * 70) * Math.sin(2 * Math.PI * 1320 * t)));
// Report
console.log(`Wrote the commercial's music and sounds to ${OUT}`);
