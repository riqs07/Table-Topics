"use client";
// The week at the foot of the rail on a computer (Desktop Screens, "Part: side rail"): how many of the last seven days had practice, as seven squares, today dashed until it is done. Counts only, never a broken streak

// Load React's state and effect hooks
import { useEffect, useState } from "react";
// Load the seven-day strip
import { weekStrip, type StripDay } from "@/core/weekStrip";
// Load the practice takes (leaving out check-ins and such)
import { practiceSessions } from "@/core/sessionHome";
// Load the app's database
import { browserRepository } from "@/data/browserRepository";

// The card, once the takes have loaded (nothing before, so the rail never flashes zeros)
export function RailWeek() {
  // The last seven days, once known
  const [days, setDays] = useState<StripDay[] | null>(null);
  // Read the takes once, after the first draw
  useEffect(() => {
    // Whether the rail is still on screen
    let live = true;
    // The takes, as dates, into the strip
    browserRepository()
      .listSessions()
      .then((sessions) => live && setDays(weekStrip(practiceSessions(sessions).map((session) => new Date(session.createdAt)), new Date())))
      // With no database (a private window), the card stays away
      .catch(() => live && setDays(null));
    // Stop when the rail goes
    return () => {
      live = false;
    };
  }, []);
  // Nothing until known, and nothing for a new user with no takes yet
  if (!days || !days.some((day) => day.practised)) return null;
  // How many days had practice
  const count = days.filter((day) => day.practised).length;
  // Whether today is done
  const todayDone = days.at(-1)?.practised ?? false;
  // The card
  return (
    <div data-rail-week className="mt-6 hidden flex-col gap-2.5 rounded-[18px] border-2 border-rule p-3.5 md:flex">
      {/* The count */}
      <span className="text-sm font-extrabold">{count} of the last 7 days</span>
      {/* The squares, oldest first */}
      <ul aria-label="The last seven days" className="flex gap-1.5">
        {days.map((day) => (
          // One day: green when practised, dashed for today until done
          <li key={day.key} aria-label={`${day.name}: ${day.practised ? "practised" : day.isToday ? "still open" : "no practice"}`} className={`size-5 rounded-[7px] ${day.practised ? "bg-accent" : day.isToday ? "border-2 border-dashed border-accent" : "bg-rule"}`} />
        ))}
      </ul>
      {/* A kind line */}
      <span className="text-xs font-bold text-ink-muted">{todayDone ? "Today is done." : "Today is still open."}</span>
    </div>
  );
}
