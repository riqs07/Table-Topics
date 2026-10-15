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
  // Speak up early
  { id: "c10", text: "Speak first in a meeting or group, even for one sentence." },
  // Ask in public
  { id: "c03", text: "Ask one question in a meeting or class." },
  // Point first, for real
  { id: "c15", text: "Give a 30-second update in a meeting, with your point first." },
  // Explain it
  { id: "c14", text: "Explain something you know well to someone who does not." },
  // The opening pause
  { id: "c16", text: "Pause for two seconds before you start speaking in a meeting." },
  // Say what you think
  { id: "c06", text: "Share one opinion in a group conversation." },
  // Structure on the spot
  { id: "c17", text: "Answer a question in a meeting with a point, a reason and an example." },
  // A clean ending
  { id: "c18", text: "Tell a short story to a group, and end it on purpose." },
  // Volunteer to speak
  { id: "c19", text: "Offer to give a toast, a thank-you, or an introduction at the next gathering." },
  // An introduction
  { id: "c20", text: "Introduce a colleague or friend to a group." },
  // Take the floor
  { id: "c21", text: "Volunteer to present one item or slide at work or in a club." },
  // Speak it, don't type it
  { id: "c22", text: "Send someone a one-minute voice note explaining an idea." },
  // Disagree out loud
  { id: "c23", text: "Disagree politely in a meeting, and give your reason." },
  // Find a room to practise in
  { id: "c24", text: "Visit a speaking club, such as Toastmasters, as a guest." },
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
