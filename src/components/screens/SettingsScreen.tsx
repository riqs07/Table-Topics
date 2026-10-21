"use client";
// The Settings screen: your history (folded), light or dark, how long recordings are kept, the coach, export and import, and deleting everything

// Load React's state and effect tools
import { useEffect, useState, type ChangeEvent } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the shared page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the day label helper for the export file name
import { dayKey } from "@/core/dates";
// Load the export and import tools
import { buildExport, importExport, parseExport } from "@/data/exportFile";
// Load the settings record type
import type { SettingsRecord } from "@/data/records";
// Load the sample sessions (development only)
import { sampleSessions } from "@/data/sampleData";
// Load the waiting-feedback sender
import { sendPendingFeedback } from "@/data/feedbackClient";
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
// Load the shared page shell
import { PAGE } from "@/components/script/layout";
// Load the deeper-analysis status check (decision 91)
import { checkDeepSetup, type DeepSetup } from "@/data/deepAnalysisClient";

// Choices for how many recent sessions keep their audio
const RETENTION_CHOICES = [10, 30, 60, 100];
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
    // Count sessions waiting for feedback
    repo.listSessions().then((sessions) => {
      // Keep the count only if the screen is still open
      if (!cancelled) setPendingCount(sessions.filter((session) => session.feedbackStatus === "pending").length);
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

  // Save a new audio limit and remove audio beyond it
  async function changeRetention(event: ChangeEvent<HTMLSelectElement>) {
    // Nothing to do before settings load
    if (!settings) return;
    // Build the new settings
    const next = { ...settings, audioRetention: Number(event.target.value) };
    // Save them
    await repo.saveSettings(next);
    // Remove audio beyond the new limit
    const removed = await repo.pruneAudio();
    // Show the new value
    setSettings(next);
    // Say what happened
    setMessage(removed > 0 ? `Saved. ${count(removed, "older recording")} removed.` : "Saved.");
  }

  // Download everything as a file
  async function exportData() {
    // Nothing to do before the date is known
    if (!today) return;
    // Build the export
    const file = await buildExport(repo, today);
    // Turn it into a downloadable file
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    // Make a temporary download link
    const link = document.createElement("a");
    // Point it at the file
    link.href = url;
    // Name the file with today's date
    link.download = `voicelab-export-${dayKey(today)}.json`;
    // Start the download
    link.click();
    // Free the file's memory
    URL.revokeObjectURL(url);
    // Remember when the copy was saved, for the reminder on Today
    markExported(today);
    // Show the new date here too
    setSafety(await readSafetyFacts(0, today));
    // Say what happened
    setMessage(`Exported ${count(file.sessions.length, "session")}. Recordings are not included.`);
  }

  // Read a chosen export file and add its data
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    // Take the chosen file
    const file = event.target.files?.[0];
    // Nothing chosen
    if (!file) return;
    // Try to read and import it
    try {
      // Check the file fully, then import
      const counts = await importExport(repo, parseExport(await file.text()), today ?? new Date());
      // Show the joined settings, so a later change here never writes back the old copy (decision 86)
      setSettings(await repo.getSettings(today ?? new Date()));
      // And the new waiting count
      setPendingCount((await repo.listSessions()).filter((session) => session.feedbackStatus === "pending").length);
      // Say what came in, and that what was here was kept
      setMessage(`Imported ${count(counts.added, "new session")}.${counts.kept > 0 ? ` ${count(counts.kept, "session")} already here kept ${counts.kept === 1 ? "its" : "their"} recordings and notes.` : ""}`);
    } catch (error) {
      // Show the plain reason it was refused
      setMessage((error as Error).message);
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
    // Send with the saved passphrase
    const result = await sendPendingFeedback(repo, { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
    // Update the waiting count
    setPendingCount((await repo.listSessions()).filter((session) => session.feedbackStatus === "pending").length);
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

      {/* How long recordings are kept */}
      <Section title="Your recordings">
        {/* The limit as a sentence with a choice in it */}
        <p>
          Keep recordings from your last{" "}
          <select aria-label="Keep recordings from your last" value={settings?.audioRetention ?? 30} onChange={changeRetention} className="min-h-11 border-b border-ink bg-transparent">
            {/* One option per choice */}
            {RETENTION_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>{" "}
          sessions. Also kept: your very first recording, and the first take of up to 20 prompts you have recorded again on a later day, so you can hear then and now. Every transcript and note is always kept.
        </p>
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
        <p className="text-ink-muted">Everything stays on this device; your browser’s speech service (Google in Chrome, Apple in Safari) turns speech into text.{settings?.deepAnalysis ? " With deeper analysis on, each take’s recording is also sent once for analysis and not kept there." : ""}</p>
        {/* How safe it is from the browser clearing it, and when a copy was last saved (drawn in the browser only) */}
        {/* Room is kept for this line while it loads, so the sections below do not jump (decision 76) */}
        {!(today && safety) && <p aria-hidden="true" className="mt-2 min-h-12" />}
        {today && safety && <p className="mt-2 min-h-12 text-footnote text-ink-muted">{safety.persisted ? "Protected from being cleared by the browser." : safety.iosSafari && !safety.installed ? "Safari may clear this if VoiceLab is not used for a while. Add it to your Home Screen to keep it." : "The browser may clear this if space runs low."} {lastCopyText(safety.daysSinceExport)}.</p>}
        {/* Export */}
        <button type="button" onClick={exportData} className={`${SECONDARY} mt-3`}>Export my data</button>
        {/* Import */}
        <p className="mt-3">
          <label className={`${SECONDARY} cursor-pointer`}>
            Import a file
            {/* The hidden file chooser, opened by the label */}
            <input type="file" accept="application/json,.json" aria-label="Import a file" onChange={importData} className="sr-only" />
          </label>
        </p>
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
          {/* Links to design pages */}
          <p className="mt-3 text-ink-muted">
            <Link href="/style" className={TEXT_LINK}>Style page</Link>
            {" · "}
            <Link href="/wireframes" className={TEXT_LINK}>Wireframes</Link>
          </p>
        </Section>
      )}
    </main>
  );
}
