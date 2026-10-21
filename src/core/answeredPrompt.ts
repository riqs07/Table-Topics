// What a take answered, shown at the top of its results so the numbers have their context (decision 77)

// Load the prompt lookup
import { findPrompt } from "@/content/prompts";
// Load the story seeds: bank prompts and guided stories (decisions 92 and 93)
import { seedText } from "@/content/stories";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// The prompt as shown: a small heading and the words
export interface AnsweredPrompt {
  // Such as "Your topic"
  label: string;
  // The question or topic itself
  text: string;
}

// The prompt a session answered, or null for kinds whose results already show it (readings, small talk) or that have none (free talk)
export function answeredPrompt(session: SessionRecord): AnsweredPrompt | null {
  // An audience question, as it was asked
  if (session.mode === "qa") return session.question ? { label: "The question", text: session.question } : null;
  // A short speech's own topic
  if (session.mode === "outline") return session.outline ? { label: "Your topic", text: session.outline.topic } : null;
  // A story from the bank by its prompt, or a guided story by its title (one from a moment note is shown by its own page; decisions 92 and 93)
  if (session.mode === "story") {
    // The seed's words
    const seed = seedText(session.promptId);
    // Labelled by its kind
    return seed ? { label: seed.guided ? "Your guided story" : "Your story", text: seed.text } : null;
  }
  // Only spoken prompts from here on
  if (!["talk", "response", "standard", "warmup", "bookend"].includes(session.mode)) return null;
  // The prompt, if it still exists
  const prompt = findPrompt(session.promptId);
  // A Table Topic is "your topic"; the rest are prompts
  return prompt ? { label: session.mode === "talk" ? "Your topic" : "The prompt", text: prompt.text } : null;
}
