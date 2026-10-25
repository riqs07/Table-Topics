"use client";
// Reads which story to tell from the address (/stories/tell?prompt=... or ?moment=..., with &plan= inside today's practice; decision 92), and a template or focus to start on (&template= from the Stories page, decision 126; &focus= from a Learn card's link, decision 94)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the set-up screen
import { TellStoryScreen } from "@/components/screens/TellStoryScreen";
// Load the moment-seed id maker and the checks for a template or focus named in the address
import { isStoryFocus, isStoryTemplate, momentSeedId } from "@/content/stories";

// Draw the set-up for the story named in the address
export function TellStoryFromAddress() {
  // The address's query
  const params = useSearchParams();
  // A moment note's id, if the story comes from one
  const moment = params.get("moment");
  // The story's seed: the moment's, or the prompt's
  const storyId = moment ? momentSeedId(moment) : (params.get("prompt") ?? "");
  // The plan step, when inside today's practice
  const plan = /^\d+$/.test(params.get("plan") ?? "") ? Number(params.get("plan")) : null;
  // A template to start on, when the address names a real one
  const template = params.get("template");
  // A focus to start on, when the address names a real one
  const focus = params.get("focus");
  // The screen, started afresh for each story and starting choice
  return <TellStoryScreen key={`${storyId}|${template}|${focus}`} storyId={storyId} planStep={plan} initialTemplate={isStoryTemplate(template) ? template : null} initialFocus={isStoryFocus(focus) ? focus : null} />;
}
