// The commercial's timing: its beats, where each piece of Mira's voiceover plays, and the captions (all in seconds)
// The voiceover is one take (public/commercial/voice.mp3, ElevenLabs "Mira – Bright & Friendly Narrator", eleven_v4); each piece is cut from it at its pauses (found with ffmpeg's silencedetect) and placed in its beat

// One piece of the voiceover: where it is in the take, and when it plays in the video
export interface VoicePiece { from: number; to: number; at: number }
// One caption: its words and when it shows
export interface CaptionLine { text: string; from: number; to: number }

// The voiceover's pieces
export const VOICE: VoicePiece[] = [
  // "Someone asks you a question… and your mind goes blank."
  { from: 0.0, to: 4.15, at: 0.4 },
  // "Meet VoiceLab. A few minutes a day to speak with ease."
  { from: 4.5, to: 8.3, at: 8.6 },
  // "Answer surprise questions out loud,"
  { from: 8.45, to: 10.45, at: 13.4 },
  // "and see exactly where the ums crept in."
  { from: 10.55, to: 13.15, at: 18.0 },
  // "Tell the stories you'll need. The interview. The toast."
  { from: 13.3, to: 16.9, at: 22.2 },
  // "Practise real conversations, with someone who answers back,"
  { from: 17.02, to: 20.45, at: 26.9 },
  // "then see how they really went."
  { from: 20.58, to: 22.45, at: 31.6 },
  // "Scenes. Drills. Courses. Even a boss to beat."
  { from: 22.65, to: 26.4, at: 35.3 },
  // "And hear yourself get better."
  { from: 26.55, to: 28.45, at: 40.6 },
  // "VoiceLab. See how you sound. Join the waitlist."
  { from: 28.62, to: 32.02, at: 43.8 },
];

// The captions (the end card shows its own words)
export const CAPTIONS: CaptionLine[] = [
  { text: "Someone asks you a question…", from: 0.4, to: 2.6 },
  { text: "…and your mind goes blank.", from: 2.6, to: 4.8 },
  { text: "Meet VoiceLab.", from: 8.6, to: 10.0 },
  { text: "A few minutes a day to speak with ease.", from: 10.0, to: 12.6 },
  { text: "Answer surprise questions out loud,", from: 13.4, to: 16.2 },
  { text: "and see exactly where the ums crept in.", from: 18.0, to: 21.2 },
  { text: "Tell the stories you’ll need.", from: 22.2, to: 23.9 },
  { text: "The interview. The toast.", from: 23.9, to: 26.2 },
  { text: "Practise real conversations,", from: 26.9, to: 28.8 },
  { text: "with someone who answers back,", from: 28.8, to: 30.9 },
  { text: "then see how they really went.", from: 31.6, to: 34.6 },
  { text: "Scenes. Drills. Courses.", from: 35.3, to: 37.6 },
  { text: "Even a boss to beat.", from: 37.6, to: 39.3 },
  { text: "And hear yourself get better.", from: 40.6, to: 43.2 },
];

// The whole video's length in seconds
export const LENGTH = 48;
