// Know your voice's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const KNOW_YOUR_VOICE_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Where your pauses fall: where you pause matters more than how often, with the blob planning its next phrase at the full stop
  {
    id: "know-your-voice-pauses",
    partId: "kv-pauses-1",
    label: "Know your voice · Lesson 1",
    tile: "pause-map",
    title: "Pauses mid-sentence",
    lines: [
      { text: "Ever listened back and thought you sounded hesitant?", mood: "worried", tag: "[curious]" },
      { text: "It’s usually not how often you pause.", mood: "ready", tag: "[warm]" },
      { text: "It’s where.", mood: "ready" },
      { text: "A pause inside a sentence sounds like searching.", mood: "worried", tag: "[thoughtful]" },
      { text: "“I went to the… shop.”", mood: "worried", tag: "[playful]" },
      { text: "A pause between sentences sounds like thinking.", mood: "happy" },
      { text: "So after a take, look for one number.", mood: "ready", tag: "[warm]" },
      { text: "Pauses mid-sentence. Lower is smoother.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My first take had lots of pauses in the middle.", mood: "worried" },
      { text: "So I planned each next phrase at the full stop.", mood: "closed", tag: "[calm]" },
      { text: "Then said it in one go. The number dropped.", mood: "happy", tag: "[confident]" },
      { text: "Read one passage today, and check where your pauses fell.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Sounding hesitant
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Inside a sentence, then between
      { from: 3, to: 5, ground: "art-plum", visual: { kind: "contrast", instead: "“I went to the… shop, and… bought bread.”", tryThis: "“I went to the shop and bought bread.” (a pause)", tryAt: 5 } },
      // The lesson's name and its number
      { from: 6, to: 7, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own take
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "My take", quote: "Plan at the full stop, then say it in one go." } },
    ],
    close: { heading: "Where you paused", items: [{ sign: "1", label: "Between ideas" }, { sign: "2", label: "Not inside them" }], action: "Check Pauses mid-sentence" },
  },
  // Lesson 2, Your pace: two pace numbers tell a fast talker from someone who pauses a lot, with the blob who thought it was slow
  {
    id: "know-your-voice-pace",
    partId: "kv-pace-1",
    label: "Know your voice · Lesson 2",
    tile: "pace-dial",
    title: "Two paces",
    lines: [
      { text: "Do you talk too fast? Or too slow?", mood: "up", tag: "[curious]" },
      { text: "Your take gives you two numbers to find out.", mood: "ready", tag: "[warm]" },
      { text: "Overall pace counts your words a minute, pauses in.", mood: "ready" },
      { text: "Pace while talking leaves the pauses out.", mood: "ready" },
      { text: "Slow overall, but quick while talking?", mood: "up", tag: "[thoughtful]" },
      { text: "You’re not slow. You pause a lot.", mood: "happy" },
      { text: "Both high? You talk fast and rarely stop.", mood: "wow", tag: "[playful]" },
      { text: "And fast is fine. Brisk sounds capable.", mood: "happy", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I thought I was a slow speaker.", mood: "worried" },
      { text: "My pace while talking was quick. I just paused a lot.", mood: "wow" },
      { text: "So I kept the pauses, and stopped worrying.", mood: "happy", tag: "[warm]" },
      { text: "Read one passage, and look at both your paces.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The two numbers
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "cards", items: [{ sign: "1", label: "Overall pace", at: 2 }, { sign: "2", label: "Pace while talking", at: 3 }] } },
      // What they mean together
      { from: 4, to: 6, ground: "art-coral", visual: { kind: "list", title: "What it means", items: [{ label: "Slow, then quick", text: "You pause a lot", at: 4 }, { label: "Both high", text: "You talk fast", at: 6 }] } },
      // The lesson's name
      { from: 7, to: 7, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own two paces
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "My two paces", quote: "Quick while talking. I just paused a lot." } },
    ],
    close: { heading: "Your two paces", items: [{ sign: "1", label: "Overall pace" }, { sign: "2", label: "Pace while talking" }], action: "Read both after your next take" },
  },
  // Lesson 3, Your pitch range: the range in steps, and lifting the key word, with the blob's two steps becoming five
  {
    id: "know-your-voice-pitch",
    partId: "kv-pitch-1",
    label: "Know your voice · Lesson 3",
    tile: "pitch-span",
    title: "Your range in steps",
    lines: [
      { text: "Ever been told you sound a bit flat?", mood: "worried", tag: "[curious]" },
      { text: "Your take can show you, in steps.", mood: "ready", tag: "[warm]" },
      { text: "Your range is how far your voice moved,", mood: "ready" },
      { text: "from your lower notes to your higher ones.", mood: "up" },
      { text: "Listeners rate more pitch variety as more charismatic.", mood: "happy", tag: "[thoughtful]" },
      { text: "Under three steps reads as fairly flat.", mood: "worried" },
      { text: "So lift the key word in each sentence.", mood: "ready", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I read a short speech, and got two steps.", mood: "worried" },
      { text: "Then I lifted one word in every sentence.", mood: "up" },
      { text: "Same speech. Five steps, and it sounded alive.", mood: "happy", tag: "[warm]" },
      { text: "Read something today, and check your range in steps.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Sounding flat
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Low notes to high notes
      { from: 2, to: 3, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "↓", label: "Your lower notes", at: 2 }, { sign: "↑", label: "Your higher notes", at: 3 }] } },
      // Variety, and the lesson's name
      { from: 4, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own range
      { from: 7, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My range", quote: "Two steps, then five: one lifted word a sentence." } },
    ],
    close: { heading: "Your range", items: [{ sign: "↑", label: "Lift the key word" }, { sign: "3+", label: "Steps, not flat" }], action: "Check your range in steps" },
  },
  // Lesson 4, Your energy: louder, with variety, reads as confident, with the blob's update that dropped quiet, then lifted
  {
    id: "know-your-voice-energy",
    partId: "kv-energy-1",
    label: "Know your voice · Lesson 4",
    tile: "volume-meter",
    title: "Volume with variety",
    lines: [
      { text: "Want to sound more sure of yourself?", mood: "up", tag: "[curious]" },
      { text: "Listen to your volume.", mood: "ready", tag: "[warm]" },
      { text: "When people tried to persuade, they got louder.", mood: "ready" },
      { text: "And they varied their volume more.", mood: "ready" },
      { text: "Listeners heard that as confidence.", mood: "happy", tag: "[confident]" },
      { text: "Not shouting. Variety.", mood: "ready" },
      { text: "If your take says your volume stayed very even,", mood: "worried", tag: "[thoughtful]" },
      { text: "drop quieter for one line, and lift for your main point.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My update came out at one level, start to finish.", mood: "worried" },
      { text: "Next time, I dropped quiet for the problem.", mood: "closed", tag: "[calm]" },
      { text: "And lifted for the fix. People looked up.", mood: "happy", tag: "[confident]" },
      { text: "Try it on your next reading: one quiet line, one lift.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Sounding sure
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Louder, with variety, and the lesson's name
      { from: 2, to: 5, ground: "art-sun", visual: { kind: "tile" } },
      // Very even, then varied
      { from: 6, to: 7, ground: "art-plum", visual: { kind: "contrast", instead: "Every line at the same volume", tryThis: "One line quieter, and a lift for the main point", tryAt: 7 } },
      // The blob's own update
      { from: 8, to: 12, ground: "art-bloom", visual: { kind: "example", title: "My update", quote: "Quiet for the problem. A lift for the fix." } },
    ],
    close: { heading: "Volume with variety", items: [{ sign: "↓", label: "One quieter line" }, { sign: "↑", label: "Lift the main point" }], action: "Then read your volume lines" },
  },
  // Lesson 5, Then and now: change one thing, then check that number, with the blob's second try that moved only its pauses
  {
    id: "know-your-voice-compare",
    partId: "kv-compare-1",
    label: "Know your voice · Lesson 5",
    tile: "takes-side-by-side",
    title: "One thing at a time",
    lines: [
      { text: "Listened back and want to fix everything?", mood: "up", tag: "[curious]" },
      { text: "Slower, louder, more pauses, livelier…", mood: "worried", tag: "[playful]" },
      { text: "Change all four, and you won’t know what worked.", mood: "worried" },
      { text: "So change one thing.", mood: "ready", tag: "[confident]" },
      { text: "Pick one number from your last take.", mood: "ready", tag: "[warm]" },
      { text: "Read the same text again, changing only that.", mood: "ready" },
      { text: "Then check that one number.", mood: "happy" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "My pauses kept falling mid-sentence.", mood: "worried" },
      { text: "Second try, I changed only that: pauses at the full stops.", mood: "closed", tag: "[calm]" },
      { text: "Pauses mid-sentence went down. That was the change.", mood: "happy", tag: "[confident]" },
      { text: "And a tiny move? That’s just noise. Look for a bigger one.", mood: "ready", tag: "[thoughtful]" },
      { text: "Pick your one thing, and read it twice.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Fixing everything at once
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "struck", text: "FIX IT ALL" } },
      // The lesson's name
      { from: 3, to: 3, ground: "art-sun", visual: { kind: "tile" } },
      // One change, step by step
      { from: 4, to: 6, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Pick one number", at: 4 }, { label: "Same text again", at: 5 }, { label: "Check it", at: 6 }] } },
      // The blob's own second try
      { from: 7, to: 10, ground: "art-leaf", visual: { kind: "example", title: "My second try", quote: "Only one change: pauses at the full stops." } },
      // Noise, and what to do
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "~", label: "Tiny move: noise", at: 11 }, { sign: "1", label: "One thing, twice", at: 12 }] } },
    ],
    close: { heading: "Then and now", items: [{ sign: "1", label: "Change one thing" }, { sign: "2", label: "Check that number" }], action: "Read the same text twice" },
  },
];
