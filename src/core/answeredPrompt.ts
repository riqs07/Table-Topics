// What a take answered, shown at the top of its results so the numbers have their context (decision 77)

// Load the prompt lookup
import { findPrompt } from "@/content/prompts";
// Load the story prompts (decision 92)
import { findStoryPrompt } from "@/content/stories";
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
  // A story from the bank, by its prompt (one from a moment note is shown by its own page; decision 92)
  if (session.mode === "story") return findStoryPrompt(session.promptId) ? { label: "Your story", text: findStoryPrompt(session.promptId)!.text } : null;
  // Only spoken prompts from here on
  if (!["talk", "response", "standard", "warmup", "bookend"].includes(session.mode)) return null;
  // The prompt, if it still exists
  const prompt = findPrompt(session.promptId);
  // A Table Topic is "your topic"; the rest are prompts
  return prompt ? { label: session.mode === "talk" ? "Your topic" : "The prompt", text: prompt.text } : null;
}
