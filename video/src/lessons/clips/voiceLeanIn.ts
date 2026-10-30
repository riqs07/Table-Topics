// A voice they lean in for's lesson clips (decision 147): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const VOICE_LEAN_IN_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Breath first: breathe low, then speak on the way out, with the blob's Monday line
  {
    id: "voice-lean-in-breath",
    partId: "vo-breath-1",
    label: "A voice they lean in for · Lesson 1",
    tile: "breath-first",
    title: "Low breath",
    lines: [
      { text: "Ever started talking and felt your voice go thin?", mood: "worried", tag: "[curious]" },
      { text: "That’s your breath climbing into your chest.", mood: "ready", tag: "[warm]" },
      { text: "Nerves pull it up, and your voice follows.", mood: "ready" },
      { text: "So breathe low instead.", mood: "closed", tag: "[calm]" },
      { text: "Drop your shoulders.", mood: "closed" },
      { text: "Breathe in so your belly moves.", mood: "closed" },
      { text: "Then start speaking on the way out.", mood: "ready" },
      { text: "Here’s mine, before the Monday meeting.", mood: "happy", tag: "[cheerful]" },
      { text: "Shoulders down, one slow breath, then: “Morning, everyone. Quick update.”", mood: "ready" },
      { text: "Same words as always. They just came out steady.", mood: "happy" },
      { text: "And give your endings air.", mood: "ready", tag: "[warm]" },
      { text: "Breathe a little sooner, at the comma, so the last words land.", mood: "ready" },
      { text: "Try it before you next speak. One low breath first.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The thin voice
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // Breath climbing
      { from: 1, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // Breathing low, step by step
      { from: 3, to: 6, ground: "art-plum", visual: { kind: "steps", items: [{ label: "Shoulders down", at: 4 }, { label: "Belly breath", at: 5 }, { label: "Speak out", at: 6 }] } },
      // The blob's Monday line
      { from: 7, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My Monday line", quote: "“Morning, everyone. Quick update.”" } },
      // Air for the ending
      { from: 10, to: 12, ground: "art-coral", visual: { kind: "contrast", instead: "Running out of air on the last word", tryThis: "A breath at the comma, so the end lands", tryAt: 11 } },
    ],
    close: { heading: "Before you speak", items: [{ sign: "1", label: "Shoulders down" }, { sign: "2", label: "Belly breath" }, { sign: "3", label: "Speak out" }], action: "One low breath first" },
  },
  // Lesson 2, Clear sounds: finish every word, with the blob's "fixed" that was heard as "fit"
  {
    id: "voice-lean-in-clear",
    partId: "vo-clear-1",
    label: "A voice they lean in for · Lesson 2",
    tile: "clear-sounds",
    title: "Finish every word",
    lines: [
      { text: "Ever been asked to repeat yourself?", mood: "up", tag: "[curious]" },
      { text: "Often it’s not volume. It’s the ends of your words.", mood: "ready", tag: "[warm]" },
      { text: "The t in fact. The d in planned. The k in task.", mood: "ready" },
      { text: "Rush, or speak quietly, and they’re the first to go.", mood: "worried" },
      { text: "So finish every word.", mood: "ready", tag: "[confident]" },
      { text: "Here’s mine, from a call last week.", mood: "happy", tag: "[cheerful]" },
      { text: "I said, “The plan’s fixed for Thursday.” They heard “fit”.", mood: "wow" },
      { text: "Second time, I finished it. “Fixed.” Crisp.", mood: "happy", tag: "[warm]" },
      { text: "Tricky words? Say them slowly first.", mood: "ready" },
      { text: "Speed comes once every sound is clean.", mood: "ready" },
      { text: "Clear first. Fast later.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Asked again
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The endings
      { from: 1, to: 3, ground: "art-plum", visual: { kind: "cards", items: [{ sign: "t", label: "fact", at: 2 }, { sign: "d", label: "planned", at: 2 }, { sign: "k", label: "task", at: 2 }] } },
      // Finish every word
      { from: 4, to: 4, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's call
      { from: 5, to: 7, ground: "art-bloom", visual: { kind: "example", title: "My call", quote: "“The plan’s fixed for Thursday.”" } },
      // Slowly first
      { from: 8, to: 10, ground: "art-coral", visual: { kind: "contrast", instead: "Rushing the tricky words", tryThis: "Slowly and precisely, then faster", tryAt: 9 } },
    ],
    close: { heading: "Finish every word", items: [{ sign: "t", label: "fact" }, { sign: "d", label: "planned" }, { sign: "k", label: "task" }], action: "Clear first, fast later" },
  },
  // Lesson 3, Pace and pauses: brisk, then slow for what matters, with the blob's launch date
  {
    id: "voice-lean-in-pace",
    partId: "vo-pace-1",
    label: "A voice they lean in for · Lesson 3",
    tile: "pace-and-pauses",
    title: "Brisk, then slow",
    lines: [
      { text: "Do people miss the number you just said?", mood: "up", tag: "[curious]" },
      { text: "A brisk pace sounds capable.", mood: "ready", tag: "[warm]" },
      { text: "But the line that matters needs room.", mood: "ready" },
      { text: "So keep it lively, and slow down for what matters.", mood: "ready" },
      { text: "Your key line. Numbers. Names.", mood: "ready" },
      { text: "And pause between sentences, not inside them.", mood: "closed", tag: "[calm]" },
      { text: "Plan the next phrase in the gap, then say it in one go.", mood: "ready" },
      { text: "Here’s mine, from a team update.", mood: "happy", tag: "[cheerful]" },
      { text: "I kept the rest brisk, then slowed right down: “Launch is on the fourteenth.”", mood: "ready" },
      { text: "A pause. And everyone wrote it down.", mood: "happy", tag: "[calm]" },
      { text: "Brisk for the rest. Slow for what matters.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The missed number
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "14?" } },
      // Brisk, with room
      { from: 1, to: 2, ground: "art-leaf", visual: { kind: "tile" } },
      // What to slow down for
      { from: 3, to: 4, ground: "art-sun", visual: { kind: "cards", items: [{ sign: "!", label: "Key line", at: 4 }, { sign: "14", label: "Numbers", at: 4 }, { sign: "Ab", label: "Names", at: 4 }] } },
      // Where to pause
      { from: 5, to: 6, ground: "art-coral", visual: { kind: "contrast", instead: "A pause in the middle of a sentence", tryThis: "A pause between sentences", tryAt: 6 } },
      // The blob's update
      { from: 7, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My update", quote: "“Launch is on the fourteenth.”" } },
      // Brisk and slow
      { from: 10, to: 10, ground: "art-plum", visual: { kind: "bubble", text: "go" } },
    ],
    close: { heading: "Slow down for", items: [{ sign: "!", label: "Key line" }, { sign: "14", label: "Numbers" }, { sign: "Ab", label: "Names" }], action: "Pause between sentences" },
  },
  // Lesson 4, Stress the key word: lean on one word, with the blob's thank-you
  {
    id: "voice-lean-in-stress",
    partId: "vo-stress-1",
    label: "A voice they lean in for · Lesson 4",
    tile: "key-word",
    title: "Lean on one word",
    lines: [
      { text: "Ever sounded flat, even when you meant it?", mood: "worried", tag: "[curious]" },
      { text: "Every line has one word that carries it.", mood: "ready", tag: "[warm]" },
      { text: "“I didn’t say she took it.”", mood: "ready" },
      { text: "Lean on a different word, and it means something new.", mood: "wow" },
      { text: "So before a key line, pick its one word.", mood: "ready" },
      { text: "Give it a little more. Louder, longer, or higher.", mood: "ready" },
      { text: "Here’s mine, from a thank-you at work.", mood: "happy", tag: "[cheerful]" },
      { text: "Flat, it was just, “Thanks for staying late.”", mood: "ready" },
      { text: "Then I leaned on “late”, and they knew I’d noticed.", mood: "happy" },
      { text: "And picture one person who wants to hear it.", mood: "ready", tag: "[warm]" },
      { text: "Your voice follows the meaning by itself.", mood: "happy" },
      { text: "One word per line. Lean on it.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The flat voice
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "…" } },
      // One word carries it
      { from: 1, to: 3, ground: "art-plum", visual: { kind: "tile" } },
      // Pick it, then lean on it
      { from: 4, to: 5, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Pick the word", at: 4 }, { label: "Give it more", at: 5 }] } },
      // The blob's thank-you
      { from: 6, to: 8, ground: "art-bloom", visual: { kind: "example", title: "My thank-you", quote: "“Thanks for staying late.”" } },
      // Before a key line
      { from: 9, to: 11, ground: "art-sun", visual: { kind: "list", title: "Before a key line", items: [{ label: "1", text: "Picture who it’s for", at: 9 }, { label: "2", text: "Find its one word", at: 10 }, { label: "3", text: "Lean on it", at: 11 }] } },
    ],
    close: { heading: "Lean on one word", items: [{ sign: "1", label: "Pick the word" }, { sign: "+", label: "Give it more" }], action: "One word per line" },
  },
  // Lesson 5, Land it low: fall to state, rise to invite, with the blob booking the train
  {
    id: "voice-lean-in-low",
    partId: "vo-low-1",
    label: "A voice they lean in for · Lesson 5",
    tile: "land-it-low",
    title: "Fall to state",
    lines: [
      { text: "Ever made a decision sound like a question?", mood: "up", tag: "[curious]" },
      { text: "“We’ll launch on Friday?”", mood: "up", tag: "[playful]" },
      { text: "Rising at the end can sound unsure.", mood: "ready", tag: "[warm]" },
      { text: "So for a point, or a decision, let your voice fall.", mood: "ready" },
      { text: "Keep it up through the last word, then let it drop.", mood: "ready" },
      { text: "Save the rise for when you want a reply.", mood: "happy" },
      { text: "Here’s mine, from planning a trip with friends.", mood: "happy", tag: "[cheerful]" },
      { text: "I used to say, “I’ll book the train?”", mood: "worried" },
      { text: "Now it’s, “I’ll book the train.” Down at the end. And it got booked.", mood: "happy" },
      { text: "Don’t push your voice low.", mood: "closed", tag: "[calm]" },
      { text: "Breathe out, relax, and it settles there by itself.", mood: "closed" },
      { text: "Fall to state. Rise to invite.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question that wasn't
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Rising sounds unsure
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "struck", text: "Friday?" } },
      // Let it fall
      { from: 3, to: 5, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's train
      { from: 6, to: 8, ground: "art-coral", visual: { kind: "example", title: "My plan", quote: "“I’ll book the train.”" } },
      // Relaxed, not forced
      { from: 9, to: 10, ground: "art-sun", visual: { kind: "steps", items: [{ label: "Breathe out", at: 10 }, { label: "Relax", at: 10 }, { label: "Let it fall", at: 10 }] } },
      // Fall and rise
      { from: 11, to: 11, ground: "art-sky", visual: { kind: "cards", items: [{ sign: "tick", label: "Fall to state", at: 11 }, { sign: "?", label: "Rise to invite", at: 11 }] } },
    ],
    close: { heading: "Land it low", items: [{ sign: "tick", label: "Fall to state" }, { sign: "?", label: "Rise to invite" }], action: "End your point low" },
  },
  // Lesson 6, Fill the room: more breath, not more throat, with the blob's welcome
  {
    id: "voice-lean-in-room",
    partId: "vo-room-1",
    label: "A voice they lean in for · Lesson 6",
    tile: "fill-the-room",
    title: "Loud is not shouting",
    lines: [
      { text: "Ever been asked to speak up, from the back of the room?", mood: "up", tag: "[curious]" },
      { text: "A louder voice sounds more confident.", mood: "ready", tag: "[warm]" },
      { text: "But loud isn’t shouting.", mood: "ready" },
      { text: "The volume comes from breath, not your throat.", mood: "ready" },
      { text: "Breathe low.", mood: "closed", tag: "[calm]" },
      { text: "Speak to the person farthest away.", mood: "ready" },
      { text: "And let it rise and fall with what matters.", mood: "happy" },
      { text: "Here’s mine, from welcoming a big group.", mood: "happy", tag: "[cheerful]" },
      { text: "One low breath, eyes on the back row: “Welcome, everyone. Grab a seat.”", mood: "ready" },
      { text: "No strain. And the back row heard every word.", mood: "happy" },
      { text: "More breath, not more throat.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // Speak up
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // Breath, not throat
      { from: 1, to: 3, ground: "art-plum", visual: { kind: "contrast", instead: "Pushing it from your throat", tryThis: "Letting your breath do the work", tryAt: 3 } },
      // How
      { from: 4, to: 6, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Breathe low", at: 4 }, { label: "Back row", at: 5 }, { label: "Rise and fall", at: 6 }] } },
      // The blob's welcome
      { from: 7, to: 9, ground: "art-bloom", visual: { kind: "example", title: "My welcome", quote: "“Welcome, everyone. Grab a seat.”" } },
      // Filling the room
      { from: 10, to: 10, ground: "art-coral", visual: { kind: "tile" } },
    ],
    close: { heading: "Fill the room", items: [{ sign: "1", label: "Breathe low" }, { sign: "2", label: "Back row" }, { sign: "3", label: "Rise and fall" }], action: "More breath, not throat" },
  },
  // Lesson 7, The run: a speech read with all of it, with the blob's toast
  {
    id: "voice-lean-in-run",
    partId: "vo-run-1",
    label: "A voice they lean in for · Lesson 7",
    tile: "speech-run",
    title: "A speech, with all of it",
    lines: [
      { text: "Now, all of it together.", mood: "happy", tag: "[warm]" },
      { text: "Speeches written to be heard make the best practice.", mood: "ready" },
      { text: "So read one aloud, like you mean it.", mood: "ready" },
      { text: "Breathe low.", mood: "closed", tag: "[calm]" },
      { text: "Finish your words.", mood: "ready" },
      { text: "Slow down for the key lines.", mood: "ready" },
      { text: "Pause between sentences.", mood: "ready" },
      { text: "And let your endings fall.", mood: "ready" },
      { text: "Here’s mine, from a toast I gave.", mood: "happy", tag: "[cheerful]" },
      { text: "A breath, then slowly: “Thank you all for coming tonight.”", mood: "ready" },
      { text: "A pause. And the rest came easy.", mood: "happy" },
      { text: "Then shadow it: speak along with a recording, and match it.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // All together
      { from: 0, to: 0, ground: "art-sky", visual: { kind: "bubble", text: "!" } },
      // A speech
      { from: 1, to: 2, ground: "art-plum", visual: { kind: "tile" } },
      // Everything at once
      { from: 3, to: 7, ground: "art-leaf", visual: { kind: "list", title: "Read it with", items: [{ label: "1", text: "A low breath", at: 3 }, { label: "2", text: "Every word finished", at: 4 }, { label: "3", text: "Slow key lines", at: 5 }, { label: "4", text: "Pauses between", at: 6 }, { label: "5", text: "Endings that fall", at: 7 }] } },
      // The blob's toast
      { from: 8, to: 10, ground: "art-bloom", visual: { kind: "example", title: "My toast", quote: "“Thank you all for coming tonight.”" } },
      // Shadowing
      { from: 11, to: 11, ground: "art-coral", visual: { kind: "bubble", text: "go" } },
    ],
    close: { heading: "Read it like you mean it", items: [{ sign: "1", label: "Low breath" }, { sign: "2", label: "Clear endings" }, { sign: "3", label: "Falling ends" }], action: "Read one speech aloud" },
  },
];
