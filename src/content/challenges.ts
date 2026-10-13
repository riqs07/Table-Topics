// Weekly real-world challenges, easiest first. DRAFT: approved at checkpoint C13 before shipping

// One weekly challenge
export interface Challenge {
  // Stable id
  id: string;
  // The task as shown to the user
  text: string;
}

// Every challenge, in the order a new user meets them
export const CHALLENGES: ReadonlyArray<Challenge> = [
  // Week 1
  { id: "c01", text: "Say good morning first to someone you see every day." },
  // Week 2
  { id: "c02", text: "Ask a shop or cafe worker how their day is going." },
  // Week 3
  { id: "c03", text: "Ask one question in a meeting or class." },
  // Week 4
  { id: "c04", text: "Give someone a specific compliment." },
  // Week 5
  { id: "c05", text: "Phone a business instead of messaging or booking online." },
  // Week 6
  { id: "c06", text: "Share one opinion in a group conversation." },
  // Week 7
  { id: "c07", text: "Start a short chat with a neighbor or colleague you rarely talk to." },
  // Week 8
  { id: "c08", text: "Tell a friend a short story about your week, out loud." },
  // Week 9
  { id: "c09", text: "Ask someone you do not know well for a recommendation." },
  // Week 10
  { id: "c10", text: "Speak first in a meeting or group, even for one sentence." },
  // Week 11
  { id: "c11", text: "Disagree politely about something small." },
  // Week 12
  { id: "c12", text: "Introduce yourself to someone new." },
  // Week 13
  { id: "c13", text: "Leave a voice message instead of a text." },
  // Week 14
  { id: "c14", text: "Explain something you know well to someone who does not." },
];

// The challenge for the nth week of practice (0 is the first week); cycles once the list is used up
export function challengeForWeek(weekNumber: number): Challenge {
  // Number of challenges
  const count = CHALLENGES.length;
  // Wrap around, keeping the result positive
  const index = ((weekNumber % count) + count) % count;
  // Look up the challenge (always present because the index is in range)
  return CHALLENGES[index] as Challenge;
}
