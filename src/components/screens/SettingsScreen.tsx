"use client";
// The Settings screen: your history (folded), light or dark, how long recordings are kept, the coach, export and import, and deleting everything

// Load React's state and effect tools
import { useEffect, useState, type ChangeEvent } from "react";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the day label helper for the export file name
import { dayKey } from "@/core/dates";
// Load the progress type of a long export or import (the tools themselves load when used, decision 99)
import type { Progress } from "@/data/exportFile";
// Load the recording-days choices and reader (decision 98)
import { RECORDING_DAY_CHOICES, READINGS_DAYS, recordingDays } from "@/core/retention";
// Load the settings record type
import type { SettingsRecord } from "@/data/records";
// Load the sample sessions (development only)
import { sampleSessions } from "@/data/sampleData";
// Load the passphrase storage
import { readPassphrase, savePassphrase } from "@/data/passphrase";
// Load the shortest passphrase allowed
import { MIN_PASSPHRASE_LENGTH } from "@/config/headers";
// Load the passphrase fingerprint
import { passphraseFingerprint } from "@/core/passphraseCheck";
// Load the sentence for send results
import { sendResultMessage } from "@/core/feedbackMessages";
// Load what is known about keeping the data safe
import { markExported, readSafetyFacts, readStorageUsed } from "@/data/storageSafety";
// Load the words for the last copy
import { lastCopyText, storageUsedText, type SafetyFacts } from "@/core/storageSafety";
// Load the light and dark choice
import { COLOR_MODES, readColorMode, saveColorMode, type ColorMode } from "@/data/colorMode";
// Load the practice time section
import { PracticeTime } from "@/components/script/PracticeTime";
// Load the timing tones choice
import { readTimingTones, saveTimingTones } from "@/data/timingTones";
// Load the space bar shortcut choice
import { readSpaceShortcut, saveSpaceShortcut } from "@/data/spaceShortcut";
// Load the shared button looks
import { PRESS, QUIET, RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the switch row
import { CheckRow } from "@/components/script/CheckRow";
// Load the shared heading look
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
// Load the choice of what to get better at most, and the reader for the saved one (decision 97)
import { FocusPicker } from "@/components/script/FocusPicker";
import { readPracticeFocus } from "@/core/practiceFocus";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the deeper-analysis status check (decision 91)
import { checkDeepSetup, type DeepSetup } from "@/data/deepAnalysisClient";
// Load the check-in's days and the safe reader for its settings (decision 100)
import { WEEKDAY_NAMES, readCheckInSettings } from "@/core/checkIn";
// Load the reader for how a conversation turn ends (decision 101)
import { turnEndingOf, type TurnEnding } from "@/core/endOfTurn";
// Load the month's conversation minutes check (decision 102)
import { conversationMinutes, type ConversationMinutes } from "@/data/conversationClient";

// How far a long export or import has got, as a whole percentage
const PROGRESS_PERCENT = (progress: Progress) => (progress.total > 0 ? Math.floor((progress.done / progress.total) * 100) : 100);
// Whether development-only tools are shown
const DEVELOPMENT = process.env.NODE_ENV !== "production";

// "1 session", "2 sessions"
function count(n: number, word: string): string {
  // Add an s unless there is exactly one
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// The light and dark choice: three buttons side by side, the chosen one filled
function ColorModeChoice() {
  // The saved choice, read once when drawn
  const [mode, setMode] = useState<ColorMode>(readColorMode);

  // Save and show a new choice
  function choose(next: ColorMode) {
    // Store and apply it
    saveColorMode(next);
    // Mark it chosen
    setMode(next);
  }

  // The three buttons
  return (
    <div role="group" aria-label="Appearance" className="grid max-w-md grid-cols-3 gap-1 rounded-2xl bg-paper p-1">
      {/* One button per choice */}
      {COLOR_MODES.map((choice) => (
        // One choice, filled when chosen
        <button key={choice.id} type="button" aria-pressed={mode === choice.id} onClick={() => choose(choice.id)} className={`min-h-11 rounded-xl px-3 ${PRESS} ${mode === choice.id ? "bg-fill font-semibold text-fill-ink" : "text-ink-muted hover:bg-card hover:text-ink"}`}>{choice.name}</button>
      ))}
    </div>
  );
}

// Timing tones: a soft tone and a buzz when the light changes, for speaking without looking (off by default; decision 77)
function TimingTonesChoice() {
  // The saved choice, read once when drawn
  const [on, setOn] = useState(readTimingTones);

  // Save a new choice
  function change(event: React.ChangeEvent<HTMLInputElement>) {
    // Store it
    saveTimingTones(event.target.checked);
    // Show it
    setOn(event.target.checked);
  }

  // A labelled switch
  return (
    <CheckRow checked={on} onChange={change} detail="A soft tone when the light turns on and two at red, so you can keep your eyes up. Android phones buzz too. iPhones stay quiet on silent.">Timing tones</CheckRow>
  );
}

// The space bar shortcut on recording screens: on unless switched off (WCAG 2.1.4; decision 79)
function SpaceShortcutChoice() {
  // The saved choice, read once when drawn
  const [on, setOn] = useState(readSpaceShortcut);

  // Save a new choice
  function change(event: React.ChangeEvent<HTMLInputElement>) {
    // Store it
    saveSpaceShortcut(event.target.checked);
    // Show it
    setOn(event.target.checked);
  }

  // A labelled switch
  return <CheckRow checked={on} onChange={change} detail="On a computer keyboard. Switch it off if it gets pressed by accident.">Space bar starts and stops recording</CheckRow>;
}

// What the server said about deeper analysis, in words (decision 91)
function deepSetupText(setup: DeepSetup): string {
  // Each state
  switch (setup.state) {
    // Both parts
    case "ready": return "Ready: transcription and voice analysis are set up on the server.";
    // One part
    case "partial": return setup.transcription ? "Partly ready: transcription is set up; voice analysis isn’t, so voice measures won’t come back." : "Partly ready: voice analysis is set up; transcription isn’t, so pause-word and pause measures stay the phone’s.";
    // Neither
    case "not-set-up": return "Deeper analysis isn’t set up on the server yet. Until it is, nothing is sent and takes keep the phone’s measures.";
    // No passphrase
    case "needs-passphrase": return "Needs the passphrase from “Set up the coach” above. Until then nothing is sent.";
    // Refused
    case "wrong-passphrase": return "The server didn’t accept the saved passphrase, so nothing is sent.";
    // Unreachable
    case "unreachable": return "Couldn’t reach the server to check. It is checked again next time you open Settings.";
  }
}

// "Send my recordings for deeper analysis" (decision 91): off unless chosen; when on, says whether the server is set up
function DeepAnalysisChoice({ settings, onSave, fetchFn }: { settings: SettingsRecord; onSave: (next: SettingsRecord) => void; fetchFn?: typeof fetch }) {
  // Whether it is on
  const on = settings.deepAnalysis === true;
  // What the server said, or null while checking
  const [setup, setSetup] = useState<DeepSetup | null>(null);
  // Ask the server whenever it is switched on (and when the page opens with it on)
  useEffect(() => {
    // Nothing to check while off
    if (!on) return;
    // Ignore a late answer
    let cancelled = false;
    // Ask
    void checkDeepSetup(readPassphrase(), fetchFn).then((result) => {
      // Shown when still wanted
      if (!cancelled) setSetup(result);
    });
    // Stop updating when switched off or closed
    return () => {
      // Ignore the answer
      cancelled = true;
      // Ask again next time
      setSetup(null);
    };
  }, [on, fetchFn]);
  // The switch, what it means, and the server's state when on
  return (
    <div>
      {/* The switch */}
      <CheckRow checked={on} onChange={(event) => onSave({ ...settings, deepAnalysis: event.target.checked })} detail="Off unless you switch it on.">Send my recordings for deeper analysis</CheckRow>
      {/* What leaves the phone */}
      <p className="mt-2 text-footnote text-ink-muted">Each take you save is sent once to a transcription service (AssemblyAI) and to VoiceLab’s own voice-analysis server. They measure your pause words, where your pauses fall, and how your voice sounds, then send the numbers back to this phone. Neither keeps your recording or transcript. Your phone’s own measures are always kept.</p>
      {/* The server's state, when on */}
      {on && <p role="status" data-deep-setup={setup?.state ?? "checking"} className="mt-2 text-footnote">{setup ? deepSetupText(setup) : "Checking the server…"}</p>}
      {/* What is wrong with the server's settings, by name */}
      {on && setup && "problems" in setup && setup.problems.length > 0 && <ul className="mt-1 list-disc pl-5 text-footnote text-ink-muted">{setup.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
    </div>
  );
}

// The two ways a conversation turn can end, with what each means (decision 101)
const TURN_ENDINGS: ReadonlyArray<{ id: TurnEnding; name: string; detail: string }> = [
  // Tap Done
  { id: "tap", name: "Tap when done", detail: "Your turn lasts until you tap Done." },
  // By itself
  { id: "auto", name: "Automatically", detail: "Your turn ends when you stop talking for a moment. Done still works, and “I wasn’t finished” gives the turn back. Worked out on this phone; nothing extra is sent." },
];

// "Ending your turn" in a conversation: two buttons side by side, the chosen one filled, and what it means
function TurnEndingChoice({ settings, onSave }: { settings: SettingsRecord; onSave: (next: SettingsRecord) => void }) {
  // The saved choice
  const chosen = turnEndingOf(settings);
  // The buttons and the line about the chosen one
  return (
    <div>
      {/* The choice's name */}
      <p id="turn-ending-label">Ending your turn</p>
      {/* The two buttons */}
      <div role="group" aria-labelledby="turn-ending-label" className="mt-2 grid max-w-md grid-cols-2 gap-1 rounded-2xl bg-paper p-1">
        {/* One button per choice */}
        {TURN_ENDINGS.map((choice) => (
          // One choice, filled when chosen
          <button key={choice.id} type="button" aria-pressed={chosen === choice.id} onClick={() => onSave({ ...settings, turnEnding: choice.id })} className={`min-h-11 rounded-xl px-3 ${PRESS} ${chosen === choice.id ? "bg-fill font-semibold text-fill-ink" : "text-ink-muted hover:bg-card hover:text-ink"}`}>{choice.name}</button>
        ))}
      </div>
      {/* What the chosen one means */}
      <p className="mt-2 text-footnote text-ink-muted">{TURN_ENDINGS.find((choice) => choice.id === chosen)?.detail}</p>
    </div>
  );
}

// The month's conversation minutes left (decision 102): asked of the server when a passphrase is saved; nothing shown without one, since the people then use their recorded lines, which cost nothing
function ConversationMinutesLine({ fetchFn }: { fetchFn?: typeof fetch }) {
  // The passphrase saved on this device
  const [passphrase] = useState(() => (typeof window === "undefined" ? "" : readPassphrase()));
  // What the server said: the minutes, "unknown" when it could not say, or null while asking
  const [minutes, setMinutes] = useState<ConversationMinutes | "unknown" | null>(null);
  // Ask once
  useEffect(() => {
    // Nothing to ask without a passphrase
    if (!passphrase) return;
    // Ignore a late answer
    let cancelled = false;
    // Ask
    void conversationMinutes(passphrase, fetchFn).then((result) => {
      // Shown when still wanted
      if (!cancelled) setMinutes(result ?? "unknown");
    });
    // Stop updating when closed
    return () => {
      // Ignore the answer
      cancelled = true;
    };
  }, [passphrase, fetchFn]);
  // No passphrase: nothing to say
  if (!passphrase) return null;
  // The minutes, or why they are not known
  return (
    <p role="status" data-conversation-minutes={minutes === null ? "checking" : minutes === "unknown" ? "unknown" : minutes.minutesLeft} className="mt-3 text-footnote text-ink-muted">
      {minutes === null ? "Checking conversation minutes…" : minutes === "unknown" ? "Couldn’t check this month’s conversation minutes. It is checked again next time you open Settings." : `${minutes.minutesLeft} of ${minutes.minutesPerMonth} conversation minutes left this month. Each minute of a conversation with written lines counts once; with none left, the people use their recorded lines.`}
    </p>
  );
}

// A section of the settings page: a section heading and its content
function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  // Ruled block with a run-in heading
  return (
    <section id={id} className={`mt-4 scroll-mt-6 p-5 text-lede ${CARD}`}>
      {/* Heading */}
      <h2 className={SECTION_HEADING}>{title}</h2>
      {/* Content */}
      <div className="mt-2">{children}</div>
    </section>
  );
}

// Settings can also be given a network function (replaced in tests)
interface SettingsScreenProps extends ScreenProps {
  // Network function for sending feedback
  fetchFn?: typeof fetch;
}

// Draw the Settings screen
export function SettingsScreen({ fetchFn, ...props }: SettingsScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // The passphrase being typed (starts with the saved one)
  const [passphrase, setPassphrase] = useState(() => (typeof window === "undefined" ? "" : readPassphrase()));
  // How many sessions are waiting for feedback
  const [pendingCount, setPendingCount] = useState(0);
  // Saved settings, once loaded
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  // A message to show after an action
  const [message, setMessage] = useState("");
  // A long export or import under way: what it is doing and how far it has got (decision 99)
  const [working, setWorking] = useState<{ what: "Exporting" | "Importing"; progress: Progress } | null>(null);
  // Fingerprint of the passphrase saved on this device, to compare with the server's (shown by pnpm live-check)
  const [fingerprint, setFingerprint] = useState("");

  // Work out the saved passphrase's fingerprint once in the browser
  useEffect(() => {
    // The saved passphrase
    const saved = readPassphrase();
    // Nothing saved, nothing to show
    if (!saved) return;
    // Work it out and show it
    void passphraseFingerprint(saved).then(setFingerprint);
  }, []);
  // Whether the delete confirmation is showing
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // How safe the data is from the browser clearing it, and when a copy was last saved (null until read)
  const [safety, setSafety] = useState<SafetyFacts | null>(null);
  // How much this device holds for the app, in bytes (null until read, or where the browser cannot say)
  const [storageUsed, setStorageUsed] = useState<number | null>(null);

  // Load the settings once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load and keep the settings
    repo.getSettings(today).then((loaded) => {
      // Keep them only if the screen is still open
      if (!cancelled) setSettings(loaded);
    }).catch((error: unknown) => {
      // Say why, with the way forward (the choices that need them stay hidden)
      if (!cancelled) setMessage(`Your settings could not be loaded (${error instanceof Error ? error.message : String(error)}). Reload the page to try again.`);
    });
    // Read how safe the data is from the browser clearing it
    void readSafetyFacts(0, today).then((facts) => {
      // Keep them only if the screen is still open
      if (!cancelled) setSafety(facts);
    });
    // Read how much the device holds for the app
    void readStorageUsed().then((bytes) => {
      // Keep it only if the screen is still open
      if (!cancelled) setStorageUsed(bytes);
    });
    // Count sessions waiting for feedback, through the database's lookup (decision 99)
    repo.listPendingSessions().then((pending) => {
      // Keep the count only if the screen is still open
      if (!cancelled) setPendingCount(pending.length);
    }).catch(() => {
      // The count stays at none; a storage problem is explained by the settings message above
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Save changed settings and say so
  async function saveSettingsWith(next: SettingsRecord, said: string) {
    // Save them
    await repo.saveSettings(next);
    // Show the new values
    setSettings(next);
    // Say what happened
    setMessage(said);
  }

  // Let the coach read the user's notes, or stop it
  async function changeShareNotes(event: ChangeEvent<HTMLInputElement>) {
    // Nothing to do before settings load
    if (!settings) return;
    // Build the new settings
    const next = { ...settings, shareNotes: event.target.checked };
    // Save them
    await repo.saveSettings(next);
    // Show the new value
    setSettings(next);
    // Say what happened
    setMessage("Saved.");
  }

  // Save a new number of days of recordings and remove recordings older than that (decision 98)
  async function changeRetention(event: ChangeEvent<HTMLSelectElement>) {
    // Nothing to do before settings load
    if (!settings) return;
    // Build the new settings
    const next = { ...settings, recordingDays: Number(event.target.value) };
    // Saving and tidying can fail
    try {
      // Save them
      await repo.saveSettings(next);
      // Show the new value
      setSettings(next);
      // The upkeep's code, loaded when needed
      const { tidyRecordings } = await import("@/data/housekeeping");
      // Remove recordings older than the new choice (and readings past their time)
      const removed = await tidyRecordings(repo, today ?? new Date());
      // Say what happened
      setMessage(removed.audio > 0 ? `Saved. ${count(removed.audio, "older recording")} removed.` : "Saved.");
    } catch (error) {
      // Say why, with the way forward
      setMessage(`That could not be saved (${error instanceof Error ? error.message : String(error)}). Reload the page and try again.`);
    }
  }

  // Save which check-in recordings are kept, then tidy at once when fewer are kept (decision 100)
  async function changeCheckInKeep(event: ChangeEvent<HTMLSelectElement>) {
    // Nothing to do before settings load
    if (!settings) return;
    // The choice
    const keep = event.target.value === "thinned" ? "thinned" : "all";
    // Build the new settings
    const next = { ...settings, checkIn: { ...readCheckInSettings(settings.checkIn), keep } as const };
    // Saving and tidying can fail
    try {
      // Save them
      await repo.saveSettings(next);
      // Show the new value
      setSettings(next);
      // The upkeep's code, loaded when needed
      const { tidyRecordings } = await import("@/data/housekeeping");
      // Remove check-in recordings no longer kept, once past the recording days
      const removed = await tidyRecordings(repo, today ?? new Date());
      // Say what happened
      setMessage(removed.audio > 0 ? `Saved. ${count(removed.audio, "older recording")} removed.` : "Saved.");
    } catch (error) {
      // Say why, with the way forward
      setMessage(`That could not be saved (${error instanceof Error ? error.message : String(error)}). Reload the page and try again.`);
    }
  }

  // Download everything as a file, written compactly a part at a time with progress shown (decision 99)
  async function exportData() {
    // Nothing to do before the date is known, or while another export or import runs
    if (!today || working) return;
    // Under way
    setWorking({ what: "Exporting", progress: { done: 0, total: 0 } });
    // Reading and writing can fail
    try {
      // The export's code, loaded when needed
      const { buildExport, exportParts } = await import("@/data/exportFile");
      // Gather it
      const file = await buildExport(repo, today);
      // Written a part at a time, saying how far it has got
      const parts = await exportParts(file, { onProgress: (progress) => setWorking({ what: "Exporting", progress }) });
      // Saved as a file
      download(parts, today);
      // Remember when the copy was saved, for the reminder on Today
      markExported(today);
      // Show the new date here too
      setSafety(await readSafetyFacts(0, today));
      // Say what happened
      setMessage(`Exported ${count(file.sessions.length, "session")}. Recordings are not included.`);
    } catch (error) {
      // Say why, with the way forward
      setMessage(`The export could not be made (${error instanceof Error ? error.message : String(error)}). Try again.`);
    } finally {
      // Done
      setWorking(null);
    }
  }

  // Hand the file's parts to the browser as a download named with today's date
  function download(parts: string[], day: Date) {
    // Turn it into a downloadable file
    const url = URL.createObjectURL(new Blob(parts, { type: "application/json" }));
    // Make a temporary download link
    const link = document.createElement("a");
    // Point it at the file
    link.href = url;
    // Name the file with today's date
    link.download = `voicelab-export-${dayKey(day)}.json`;
    // Start the download
    link.click();
    // Free the file's memory once the browser has taken it
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  // Read a chosen export file and add its data
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    // Take the chosen file
    const file = event.target.files?.[0];
    // Nothing chosen, or another export or import runs
    if (!file || working) return;
    // Under way
    setWorking({ what: "Importing", progress: { done: 0, total: 0 } });
    // Try to read and import it
    try {
      // The import's code, loaded when needed
      const { importExport, parseExport } = await import("@/data/exportFile");
      // Check the file fully, then import it a chunk at a time, saying how far it has got
      const counts = await importExport(repo, parseExport(await file.text()), today ?? new Date(), { onProgress: (progress) => setWorking({ what: "Importing", progress }) });
      // Show the joined settings, so a later change here never writes back the old copy (decision 86)
      setSettings(await repo.getSettings(today ?? new Date()));
      // And the new waiting count
      setPendingCount((await repo.listPendingSessions()).length);
      // Say what came in, and that what was here was kept
      setMessage(`Imported ${count(counts.added, "new session")}.${counts.kept > 0 ? ` ${count(counts.kept, "session")} already here kept ${counts.kept === 1 ? "its" : "their"} recordings and notes.` : ""}`);
    } catch (error) {
      // Show the plain reason it was refused
      setMessage((error as Error).message);
    } finally {
      // Done
      setWorking(null);
    }
    // Clear the chooser so the same file can be picked again
    event.target.value = "";
  }

  // Save the passphrase on this device
  function storePassphrase() {
    // A passphrase shorter than the server accepts can never work, so say so instead of saving it
    if (passphrase.trim() && passphrase.trim().length < MIN_PASSPHRASE_LENGTH) return setMessage(`The passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters, the same as APP_ACCESS_SECRET on the server. It was not saved.`);
    // Save it
    savePassphrase(passphrase);
    // Say what happened
    setMessage(passphrase.trim() ? "Passphrase saved on this device." : "Passphrase removed.");
    // Show the new fingerprint, or none
    if (passphrase.trim()) void passphraseFingerprint(passphrase.trim()).then(setFingerprint);
    // (none when removed)
    else setFingerprint("");
  }

  // Send every session waiting for feedback now
  async function sendNow() {
    // The sender's code, loaded when needed (decision 99)
    const { sendPendingFeedback } = await import("@/data/feedbackClient");
    // Send with the saved passphrase
    const result = await sendPendingFeedback(repo, { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
    // Update the waiting count
    setPendingCount((await repo.listPendingSessions()).length);
    // Say what happened
    setMessage(sendResultMessage(result.sent, result.stoppedBy, result.reason));
  }

  // Delete everything after the second tap
  async function deleteEverything() {
    // Hide the confirmation
    setConfirmingDelete(false);
    // The browser database can refuse
    try {
      // Remove every record and recording
      await repo.deleteAllData();
      // Show fresh settings, so a later change here never writes the deleted ones back (decision 86)
      setSettings(await repo.getSettings(today ?? new Date()));
      // Nothing waits for the coach now
      setPendingCount(0);
      // Say what happened
      setMessage("Everything is deleted.");
    } catch (error) {
      // Say why, with the way forward
      setMessage(`Not everything could be deleted (${error instanceof Error ? error.message : String(error)}). Try again.`);
    }
  }

  // Fill the app with sample sessions to preview the screens (development only)
  async function loadSamples() {
    // Nothing to do before the date is known
    if (!today) return;
    // Save each sample session
    for (const session of sampleSessions(today)) await repo.saveSession(session);
    // Say what happened
    setMessage("Sample sessions added. Open “Show your practice history” above to see them.");
  }

  // Draw the page
  return (
    // A single readable column
    <main id="main" className={PAGE}>
      {/* Title and a link home */}
      <Masthead title="VoiceLab" section="settings" />
      {/* The page's name */}
      <PageTitle title="Settings" />

      {/* Result of the last action, read out to screen readers (takes no room until there is one) */}
      <p role="status" className={message ? "mt-4 text-accent" : "sr-only"}>{message}</p>

      {/* History, on its own page (decision 79) */}
      <Section title="History">
        <RowLink href="/history">See your practice history</RowLink>
        {/* Every measure across takes, kept out of the main tabs (decision 90) */}
        <div className="border-t border-rule"><RowLink href="/profile">Your speaking profile</RowLink></div>
      </Section>

      {/* Light, dark, or follow the device (drawn in the browser only, where the saved choice can be read) */}
      {today && <Section title="Appearance">
        <ColorModeChoice />
      </Section>}

      {/* When the user practises, and a daily reminder (decision 78) */}
      {settings && <Section title="Your practice time" id="practice-time">
        <PracticeTime settings={settings} onSave={(next, said) => void saveSettingsWith(next, said)} />
      </Section>}

      {/* The weekly check-in's day (decision 100) */}
      {settings && <Section title="Weekly check-in" id="check-in">
        <p>
          Check in every{" "}
          <select aria-label="Check-in day" value={readCheckInSettings(settings.checkIn)?.day ?? ""} onChange={(event) => void saveSettingsWith({ ...settings, checkIn: { ...readCheckInSettings(settings.checkIn), ...(event.target.value === "" ? { day: undefined } : { day: Number(event.target.value) }) } }, "Saved. Your check-in moves to that day.")} className="min-h-11 max-w-full border-b border-ink bg-transparent">
            {/* Not chosen: the day of the first check-in */}
            <option value="">day of my first one</option>
            {/* One option per day */}
            {WEEKDAY_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </p>
        {/* What it is */}
        <p className="mt-2 text-footnote text-ink-muted">About 6 minutes: the same passage, the same pitch, a story and a surprise question. Missed? It stays open two more days.</p>
      </Section>}

      {/* What the user wants to get better at most, changed at any time (decision 97) */}
      {settings && <Section title="What you want to get better at" id="focus">
        <p className="text-footnote text-ink-muted">Pick one or two. About half of each day’s practice comes from them, and Practice and Learn show them first.</p>
        <FocusPicker value={readPracticeFocus(settings.practiceFocus) ?? []} onChange={(next) => void saveSettingsWith({ ...settings, practiceFocus: next }, next.length ? "Saved. Today’s practice follows it." : "Saved. Today’s practice is the usual mix.")} label="What you want to get better at" />
      </Section>}

      {/* Whether Today shows the run (decision 78; named for what it holds, so it is not mistaken for the Today tab) */}
      {settings && <Section title="Practice days">
        <CheckRow checked={settings.hideStreak !== true} onChange={(event) => void saveSettingsWith({ ...settings, hideStreak: !event.target.checked }, "Saved.")} detail="Days practised in the last week, and your run. Two rest days a week never break a run, and two days in a row after a longer break win it back.">Show my practice days</CheckRow>
      </Section>}

      {/* Pause words and fluency (decision 79) */}
      {settings && <Section title="Pause words">
        <p className="text-footnote text-ink-muted">Um, uh, like and the rest. A few are normal; listeners hear them as a sign you are thinking.</p>
        <div className="mt-3 flex flex-col gap-2">
          {/* Counts on or off */}
          <CheckRow checked={settings.showPauseWords !== false && settings.stammer !== true} onChange={(event) => void saveSettingsWith({ ...settings, showPauseWords: event.target.checked }, "Saved.")} detail={settings.stammer ? "Off while “I stammer” is on." : "On results, History and Today."}>Show pause-word counts</CheckRow>
          {/* I stammer */}
          <CheckRow checked={settings.stammer === true} onChange={(event) => void saveSettingsWith({ ...settings, stammer: event.target.checked }, "Saved.")} detail="Hides pause words, repeats and judgements about fluency, and asks the coach to leave fluency alone.">I stammer</CheckRow>
        </div>
      </Section>}

      {/* Cues while speaking (drawn in the browser only, where the saved choice can be read) */}
      {today && <Section title="While speaking">
        <div className="flex flex-col gap-2">
          {/* Tones */}
          <TimingTonesChoice />
          {/* The space bar, only on devices with a keyboard and a mouse or trackpad (never on a phone or tablet) */}
          <div data-keyboard-only className="hidden keyboard:block"><SpaceShortcutChoice /></div>
        </div>
      </Section>}

      {/* Conversations: how a turn ends (decision 101) */}
      {settings && <Section title="Talk with someone" id="conversations">
        <TurnEndingChoice settings={settings} onSave={(next) => void saveSettingsWith(next, "Saved.")} />
        <ConversationMinutesLine fetchFn={fetchFn} />
      </Section>}

      {/* How long recordings are kept */}
      <Section title="Your recordings">
        {/* The limit as a sentence with a choice in it (decision 98) */}
        <p>
          Keep recordings from the last{" "}
          <select aria-label="Keep recordings from the last" value={recordingDays(settings)} onChange={changeRetention} className="min-h-11 border-b border-ink bg-transparent">
            {/* One option per choice */}
            {RECORDING_DAY_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>{" "}
          days. Also kept: your very first recording, takes you star, and your check-ins.
        </p>
        {/* What else is kept, and for how long */}
        <p className="mt-2 text-footnote text-ink-muted">Detailed charts (pitch, volume and word timing) are kept for {READINGS_DAYS} days, and for as long as you keep a take starred. Every transcript, number, note and piece of feedback is always kept.</p>
        {/* Check-in recordings, which are kept as markers, and what they take (decision 100) */}
        {settings && (
          <p className="mt-3">
            Check-ins:{" "}
            <select aria-label="Check-in recordings to keep" value={readCheckInSettings(settings.checkIn)?.keep === "thinned" ? "thinned" : "all"} onChange={(event) => void changeCheckInKeep(event)} className="min-h-11 max-w-full border-b border-ink bg-transparent">
              {/* Every one */}
              <option value="all">keep every one</option>
              {/* Fewer */}
              <option value="thinned">first, last 12, one a month</option>
            </select>
          </p>
        )}
        {/* What they take */}
        <p className="mt-2 text-footnote text-ink-muted">A check-in is about 1.4 MB: about 75 MB a year if you keep every one. Keeping fewer is about 30 MB after a year, then 17 MB a year.</p>
        {/* How much the device holds, where the browser can say */}
        {storageUsedText(storageUsed) && <p className="mt-2 text-footnote text-ink-muted">{storageUsedText(storageUsed)}</p>}
      </Section>

      {/* Coach feedback (drawn in the browser only, where the saved passphrase can be read) */}
      {today && <Section title="Coach (advanced)">
        {/* What works without it */}
        <p className="text-ink-muted">Adds a written note to each session. Needs a passphrase set up on the server.</p>
        {/* The setup, folded away until wanted */}
        <details className="mt-3">
          {/* Open it */}
          <summary className={`${TEXT_LINK} cursor-pointer`}>Set up the coach</summary>
          {/* What the passphrase is for */}
          <p className="mt-2 text-ink-muted">Feedback needs the passphrase you set on the server. It is kept on this device only and is not in exports.</p>
          {/* Passphrase field and save */}
          <p className="mt-3 flex flex-wrap items-baseline gap-3">
            {/* The field */}
            <input type="password" aria-label="Passphrase" autoComplete="current-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-rule bg-card px-3 py-1" />
            {/* Save */}
            <button type="button" onClick={storePassphrase} className={SECONDARY}>Save passphrase</button>
          </p>
          {/* The saved passphrase's fingerprint, to compare with the one pnpm live-check prints for APP_ACCESS_SECRET */}
          {fingerprint && <p className="mt-2 text-footnote text-ink-muted">Fingerprint: {fingerprint}. It should match the fingerprint pnpm live-check shows for APP_ACCESS_SECRET.</p>}
          {/* Waiting sessions, with a way to send them now */}
          {pendingCount > 0 && (
            <p className="mt-3">
              {pendingCount} {pendingCount === 1 ? "session is" : "sessions are"} waiting for feedback.{" "}
              {/* Send now */}
              <button type="button" onClick={sendNow} className={SECONDARY}>Send now</button>
            </p>
          )}
          {/* Whether the coach may read the user's own notes */}
          <div className="mt-4"><CheckRow checked={settings?.shareNotes === true} onChange={changeShareNotes} detail="Your notes are sent with the transcript, and the coach answers them. Feedback then waits until you have saved your notes. Off by default.">Let the coach read my notes after I listen back.</CheckRow></div>
        </details>
      </Section>}

      {/* Deeper analysis of each take on the server (decision 91; drawn once the settings are loaded) */}
      {today && settings && <Section title="Deeper analysis (advanced)">
        <DeepAnalysisChoice settings={settings} fetchFn={fetchFn} onSave={(next) => void saveSettingsWith(next, "Saved.")} />
      </Section>}

      {/* Export and import */}
      <Section title="Your data" id="your-data">
        {/* Where it lives */}
        <p className="text-ink-muted">VoiceLab keeps your recordings (for the days you chose above), transcripts and settings on this device. Your browser’s speech recognition turns your words into text; in most browsers Apple or Google does that on their servers, so they hear the audio.{settings?.deepAnalysis ? " With deeper analysis on, each take’s recording is also sent once for analysis and not kept there." : ""}</p>
        {/* How safe it is from the browser clearing it, and when a copy was last saved (drawn in the browser only) */}
        {/* Room is kept for this line while it loads, so the sections below do not jump (decision 76) */}
        {!(today && safety) && <p aria-hidden="true" className="mt-2 min-h-12" />}
        {today && safety && <p className="mt-2 min-h-12 text-footnote text-ink-muted">{safety.persisted ? "Protected from being cleared by the browser." : safety.iosSafari && !safety.installed ? "Safari may clear this if VoiceLab is not used for a while. Add it to your Home Screen to keep it." : "The browser may clear this if space runs low."} {lastCopyText(safety.daysSinceExport)}.</p>}
        {/* Export */}
        <button type="button" onClick={exportData} disabled={working !== null} className={`${SECONDARY} mt-3`}>Export my data</button>
        {/* Import */}
        <p className="mt-3">
          <label className={`${SECONDARY} cursor-pointer`}>
            Import a file
            {/* The hidden file chooser, opened by the label */}
            <input type="file" accept="application/json,.json" aria-label="Import a file" onChange={importData} disabled={working !== null} className="sr-only" />
          </label>
        </p>
        {/* A long export or import under way, with how far it has got (decision 99) */}
        {working && (
          <div role="status" className="mt-3 max-w-sm">
            {/* What it is doing */}
            <p className="text-footnote text-ink-muted">{working.what} your data… {PROGRESS_PERCENT(working.progress)}%</p>
            {/* The bar, in the theme's colours (a native progress bar draws in the browser's own green) */}
            <div role="progressbar" aria-label={`${working.what} your data`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={PROGRESS_PERCENT(working.progress)} className="mt-1 h-2 w-full overflow-hidden rounded-full bg-rule">
              {/* The part done */}
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${PROGRESS_PERCENT(working.progress)}%` }} />
            </div>
          </div>
        )}
      </Section>

      {/* Delete everything */}
      <Section title="Start over">
        {/* First step */}
        {!confirmingDelete && (
          <button type="button" onClick={() => setConfirmingDelete(true)} className={QUIET}>Delete all my data</button>
        )}
        {/* Confirmation step */}
        {confirmingDelete && (
          <div>
            {/* What will happen */}
            <p>This removes every recording, transcript, and setting on this device. It cannot be undone.</p>
            {/* Confirm */}
            <button type="button" onClick={deleteEverything} className={`mt-3 min-h-11 rounded-2xl bg-ink px-4 font-semibold text-paper-raised ${PRESS}`}>Yes, delete everything</button>
            {/* Back out */}
            <button type="button" onClick={() => setConfirmingDelete(false)} className={`${QUIET} ml-4`}>Keep my data</button>
          </div>
        )}
      </Section>

      {/* Development-only tools */}
      {DEVELOPMENT && (
        <Section title="While building (not in the released app)">
          {/* Fill with sample sessions */}
          <button type="button" onClick={loadSamples} className={SECONDARY}>Fill with sample sessions</button>
        </Section>
      )}
    </main>
  );
}
