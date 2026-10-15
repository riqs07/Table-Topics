// The one recommended next step on Today: a dated talk first, then a first prepared answer, then the mode that trains this week's focus

// Load the day's pickers
import { bookendForDay, drillForDay, promptForDay, tableTopicForDay } from "@/content/prompts";

// What the recommendation needs to know
export interface NextStepInput {
  // Today
  day: Date;
  // How many sessions there are
  sessionCount: number;
  // This week's focus
  focusId: string;
  // The next talk with a date, with today's sentence, or null
  nextTalk: { id: string; title: string; headline: string } | null;
}

// The recommendation
export interface NextStep {
  // What it is, in a few words
  label: string;
  // The task or today's step
  detail: string;
  // Where it leads
  href: string;
  // The button's words
  action: string;
  // Why this one, in a sentence
  why: string;
}

// Pick the one next step
export function nextStep({ day, sessionCount, focusId, nextTalk }: NextStepInput): NextStep {
  // A talk with a date comes first
  if (nextTalk) return { label: `“${nextTalk.title}”`, detail: nextTalk.headline, href: `/talk?id=${nextTalk.id}`, action: "Open today’s plan", why: "Your talk comes first." };
  // Today's prepared answer
  const prompt = promptForDay(day);
  // A prepared answer, with a reason
  const prepared = (why: string): NextStep => ({ label: "Prepared answer · about 5 minutes", detail: prompt.text, href: `/session?mode=response&prompt=${prompt.id}`, action: "Start", why });
  // A new user starts with a prepared answer, which becomes the starting point
  if (sessionCount === 0) return prepared("Your first prepared answer becomes your starting point, to compare with later.");
  // Otherwise the mode that trains this week's focus
  switch (focusId) {
    // Openings
    case "strong-opening": {
      // Today's opening task
      const item = bookendForDay(day, "opening");
      // The drill
      return { label: "Opening drill · 45 seconds", detail: item.text, href: `/session?mode=bookend&prompt=${item.id}`, action: "Start", why: "This week’s focus is a strong opening." };
    }
    // Closes
    case "strong-close": {
      // Today's closing task
      const item = bookendForDay(day, "close");
      // The drill
      return { label: "Closing drill · 45 seconds", detail: item.text, href: `/session?mode=bookend&prompt=${item.id}`, action: "Start", why: "This week’s focus is a strong close." };
    }
    // Pausing
    case "pausing": {
      // Today's drill
      const item = drillForDay(day);
      // The drill
      return { label: "Pause drill · 1 minute", detail: item.title ?? item.text, href: `/session?mode=pause&prompt=${item.id}`, action: "Start", why: "This week’s focus is pausing." };
    }
    // Fillers: speaking on the spot shows them most
    case "cut-fillers": {
      // Today's question
      const item = tableTopicForDay(day);
      // The Table Topic
      return { label: "Table Topic · 1 to 2 minutes", detail: "A surprise question, answered on the spot.", href: `/session?mode=talk&prompt=${item.id}`, action: "Start", why: "This week’s focus is cutting filler words, and surprise questions bring them out." };
    }
    // Structure, and anything else
    default:
      return prepared(focusId === "clear-structure" ? "This week’s focus is clear structure." : "A prepared answer practises everything at once.");
  }
}
