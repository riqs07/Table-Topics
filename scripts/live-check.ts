// Live check: sends three sample sessions to the real coach and prints the feedback and cost.
// Run it yourself with `pnpm live-check` after putting ANTHROPIC_API_KEY in .env.local.
// It never prints the key. Share the output (not the key) in the chat.

// Load the coach model settings and prices
import { COACH_EFFORT, COACH_MODEL, COACH_PRICE_PER_MILLION } from "@/config/models";
// Load the coach input type
import type { CoachInput } from "@/core/coachPrompt";
// Load the Claude coach
import { createClaudeCoach } from "@/server/coach";

// Three sample sessions that exercise different focuses and a retry
const SAMPLES: Array<{ name: string; input: CoachInput }> = [
  // Lots of fillers, focus on fillers
  { name: "Filler-heavy", input: { transcript: "Um, so, the best part of my week was, uh, like, I went to the park and, um, you know, there was this dog and, uh, it was really, like, funny.", durationSec: 25, focusId: "cut-fillers", previousChange: null } },
  // Trailing off, focus on finishing sentences
  { name: "Trailing off", input: { transcript: "I think the thing about my job is that sometimes I feel like, I don't know. It's like when you have a lot going on and. Anyway, I like the people.", durationSec: 20, focusId: "start-and-finish", previousChange: null } },
  // A retry after a filler fix
  { name: "Retry", input: { transcript: "The best part of my week was the park. There was a dog chasing its own tail, and I laughed out loud.", durationSec: 18, focusId: "cut-fillers", previousChange: "Replace \"um\" with a short pause before each new thought." } },
];

// Run every sample and report
async function main() {
  // Stop early with a clear message if the key is missing
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local and run `pnpm live-check` again.");
  // Make the real coach
  const coach = createClaudeCoach(process.env.ANTHROPIC_API_KEY);
  // Running total of estimated cost
  let totalCost = 0;
  // Say which model and effort are being checked
  console.log(`Model: ${COACH_MODEL}, effort: ${COACH_EFFORT}\n`);
  // Try each sample in turn
  for (const sample of SAMPLES) {
    // Time the call
    const started = Date.now();
    // Ask for feedback
    const result = await coach.getFeedback(sample.input);
    // Work out how long it took
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    // Report a decline and move on
    if (result.status === "declined") { console.log(`${sample.name}: DECLINED (${seconds}s)\n`); continue; }
    // Estimate this call's cost from its token counts
    const cost = (result.usage.inputTokens * COACH_PRICE_PER_MILLION.input + result.usage.outputTokens * COACH_PRICE_PER_MILLION.output) / 1_000_000;
    // Add it to the total
    totalCost += cost;
    // Print the sample's feedback and numbers
    console.log(`${sample.name} (${seconds}s, ${result.usage.inputTokens} in / ${result.usage.outputTokens} out, about $${cost.toFixed(4)})\n  Keep: ${result.feedback.keep}\n  Change: ${result.feedback.change}\n  Retry cue: ${result.feedback.retryCue}\n`);
  }
  // Print the total
  console.log(`Estimated total for ${SAMPLES.length} sessions: $${totalCost.toFixed(4)}`);
}

// Run, and exit with an error code if anything failed
main().catch((error: unknown) => {
  // Print the problem without any secrets
  console.error(`Live check failed: ${(error as Error).message}`);
  // Signal failure to the shell
  process.exit(1);
});
