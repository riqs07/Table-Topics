"use client";
// Settings → Your practice time (decision 78): a moment of the day to tie practice to, shown on Today, and a daily reminder as a calendar file made on the device

// Load React's state tool
import { useState } from "react";
// Load the shared button styles
import { QUIET, SECONDARY } from "@/components/script/Buttons";
// Load the calendar file maker
import { isReminderTime, reminderCalendar } from "@/core/reminder";
// Load the settings type
import type { SettingsRecord } from "@/data/records";

// Moments most people already have each day, to pick from
const ANCHORS = ["after my morning coffee", "on my commute", "at lunch", "after work", "before bed"];

// The section's content
export function PracticeTime({ settings, onSave }: { settings: SettingsRecord; onSave: (next: SettingsRecord, message: string) => void }) {
  // The moment being typed (starts with the saved one)
  const [anchor, setAnchor] = useState(settings.anchor ?? "");
  // The reminder's time (eight in the morning until chosen)
  const [time, setTime] = useState(settings.reminderTime ?? "08:00");

  // Save a moment (empty removes it)
  function saveAnchor(text: string) {
    // Tidy it
    const tidy = text.trim().slice(0, 60);
    // Show the tidy version
    setAnchor(tidy);
    // Save it (an empty moment is removed)
    onSave({ ...settings, anchor: tidy }, tidy ? "Saved. Today shows your time." : "Practice time removed.");
  }

  // Make the calendar file and hand it to the device, keeping the time for next time
  function addToCalendar() {
    // A valid time, or eight o'clock
    const chosen = isReminderTime(time) ? time : "08:00";
    // The file's text
    const text = reminderCalendar({ time: chosen, anchor, url: window.location.origin, now: new Date() });
    // As a calendar file
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
    // A temporary download link
    const link = document.createElement("a");
    // Point it at the file
    link.href = url;
    // Its name
    link.download = "voicelab-reminder.ics";
    // Open it (phones offer to add it to the calendar)
    link.click();
    // Free the memory
    URL.revokeObjectURL(url);
    // Remember the time
    onSave({ ...settings, reminderTime: chosen }, "Reminder made. Open it to add it to your calendar.");
  }

  // The moment, then the reminder
  return (
    <>
      {/* Why */}
      <p>Tie practice to a moment you already have each day.</p>
      {/* The moment in the user's words */}
      <label className="mt-3 block">
        {/* Its label */}
        <span className="block text-footnote text-ink-muted">I’ll practise…</span>
        {/* The field */}
        <input value={anchor} maxLength={60} onChange={(event) => setAnchor(event.target.value)} placeholder="after my morning coffee" className="mt-1 min-h-11 w-full max-w-md border-b border-ink bg-transparent" />
      </label>
      {/* Quick picks, each saved straight away */}
      <div role="group" aria-label="Common moments" className="mt-3 flex flex-wrap gap-2">
        {/* One per moment */}
        {ANCHORS.map((moment) => <button key={moment} type="button" aria-pressed={anchor === moment} onClick={() => saveAnchor(moment)} className={`${QUIET} text-footnote ${anchor === moment ? "border-ink text-ink" : ""}`}>{moment}</button>)}
      </div>
      {/* Save the typed one */}
      <p className="mt-3"><button type="button" onClick={() => saveAnchor(anchor)} className={SECONDARY}>Save</button></p>
      {/* The reminder's time */}
      <label className="mt-6 flex flex-wrap items-center gap-3">
        {/* Its label */}
        <span>Remind me daily at</span>
        {/* The time */}
        <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="min-h-11 border-b border-ink bg-transparent" />
      </label>
      {/* Make the calendar file */}
      <p className="mt-3"><button type="button" onClick={addToCalendar} className={SECONDARY}>Add a daily reminder to my calendar</button></p>
      {/* How it works */}
      <p className="mt-2 text-footnote text-ink-muted">Your calendar does the reminding. Nothing is sent anywhere.</p>
    </>
  );
}
