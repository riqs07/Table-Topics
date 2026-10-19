// The last short speech planned, kept in this browser only so it is there to reuse or tweak (decision 73; not part of the export)

// Load the plan type and its tidier
import { cleanOutline, type Outline } from "@/core/outline";

// Key the draft is stored under
const KEY = "voicelab-outline-draft";

// The last plan as stored text, or null when there is none or storage is blocked (text, so it can be compared between renders)
export function readOutlineDraftText(): string | null {
  // Storage can be blocked (private browsing), so guard the read
  try {
    // The stored text
    return localStorage.getItem(KEY);
  } catch {
    // Blocked: no draft
    return null;
  }
}

// A stored plan read back, tidied (null when missing or unreadable)
export function parseOutlineDraft(stored: string | null): Outline | null {
  // Nothing saved
  if (!stored) return null;
  // Unreadable text counts as nothing
  try {
    // Its parts
    const parsed = JSON.parse(stored) as Partial<Outline>;
    // Tidied, so anything odd is dropped
    return cleanOutline(typeof parsed.topic === "string" ? parsed.topic : "", Array.isArray(parsed.points) ? parsed.points.filter((point): point is string => typeof point === "string") : [], typeof parsed.goalMinutes === "number" ? parsed.goalMinutes : 2);
  } catch {
    // Unreadable: no draft
    return null;
  }
}

// Keep a plan for next time
export function saveOutlineDraft(outline: Outline): void {
  // Storage can be blocked, so guard the write
  try {
    // Store it as text
    localStorage.setItem(KEY, JSON.stringify(outline));
  } catch {
    // The plan still works this time
  }
}
