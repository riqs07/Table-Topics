"use client";
// The Settings screen: how long recordings are kept, export and import, and deleting everything

// Load React's state and effect tools
import { useEffect, useState, type ChangeEvent } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
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

// Choices for how many recent sessions keep their audio
const RETENTION_CHOICES = [10, 30, 60, 100];
// Whether development-only tools are shown
const DEVELOPMENT = process.env.NODE_ENV !== "production";

// "1 session", "2 sessions"
function count(n: number, word: string): string {
  // Add an s unless there is exactly one
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// A section of the settings page: an italic run-in heading and its content
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  // Ruled block with a run-in heading
  return (
    <section className="mt-8 border-t border-rule pt-4 text-lede">
      {/* Heading */}
      <h2 className="italic">{title}</h2>
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
    });
    // Count sessions waiting for feedback
    repo.listSessions().then((sessions) => {
      // Keep the count only if the screen is still open
      if (!cancelled) setPendingCount(sessions.filter((session) => session.feedbackStatus === "pending").length);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

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
      const counts = await importExport(repo, parseExport(await file.text()));
      // Say what came in
      setMessage(`Imported ${count(counts.sessions, "session")} and ${count(counts.challenges, "challenge")}.`);
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
    // Remove every record and recording
    await repo.deleteAllData();
    // Hide the confirmation
    setConfirmingDelete(false);
    // Say what happened
    setMessage("Everything is deleted.");
  }

  // Fill the app with sample sessions to preview the screens (development only)
  async function loadSamples() {
    // Nothing to do before the date is known
    if (!today) return;
    // Save each sample session
    for (const session of sampleSessions(today)) await repo.saveSession(session);
    // Say what happened
    setMessage("Sample sessions added. Open History to see them.");
  }

  // Draw the page
  return (
    // A single readable column
    <main className="mx-auto min-h-dvh max-w-2xl bg-paper-raised px-6 pt-6 pb-16 md:pt-10">
      {/* Title and a link home */}
      <Masthead title="Settings" section="settings" />

      {/* Result of the last action, read out to screen readers */}
      <p role="status" className="mt-4 min-h-6 italic text-accent">{message}</p>

      {/* How long recordings are kept */}
      <Section title="Your recordings">
        {/* The limit as a sentence with a choice in it */}
        <p>
          Keep recordings from your last{" "}
          <select aria-label="Keep recordings from your last" value={settings?.audioRetention ?? 30} onChange={changeRetention} className="min-h-11 border-b border-ink bg-transparent">
            {/* One option per choice */}
            {RETENTION_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>{" "}
          sessions. Your first recording is always kept. Transcripts and feedback are never removed.
        </p>
      </Section>

      {/* Coach feedback (drawn in the browser only, where the saved passphrase can be read) */}
      {today && <Section title="Coach (advanced)">
        {/* What works without it */}
        <p className="text-ink-muted">Without the coach, each session picks one change from your numbers. The coach adds a written note, and needs a passphrase set up on the server.</p>
        {/* The setup, folded away until wanted */}
        <details className="mt-3">
          {/* Open it */}
          <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4">Set up the coach</summary>
          {/* What the passphrase is for */}
          <p className="mt-2 text-ink-muted">Feedback needs the passphrase you set on the server. It is kept on this device only and is not in exports.</p>
          {/* Passphrase field and save */}
          <p className="mt-3 flex flex-wrap items-baseline gap-3">
            {/* The field */}
            <input type="password" aria-label="Passphrase" autoComplete="current-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} className="min-h-11 min-w-0 flex-1 border-b border-ink bg-transparent py-1" />
            {/* Save */}
            <button type="button" onClick={storePassphrase} className="inline-flex min-h-11 items-center underline underline-offset-4">Save passphrase</button>
          </p>
          {/* The saved passphrase's fingerprint, to compare with the one pnpm live-check prints for APP_ACCESS_SECRET */}
          {fingerprint && <p className="mt-2 text-footnote italic text-ink-muted">Fingerprint: {fingerprint}. It should match the fingerprint pnpm live-check shows for APP_ACCESS_SECRET.</p>}
          {/* Waiting sessions, with a way to send them now */}
          {pendingCount > 0 && (
            <p className="mt-3">
              {pendingCount} {pendingCount === 1 ? "session is" : "sessions are"} waiting for feedback.{" "}
              {/* Send now */}
              <button type="button" onClick={sendNow} className="inline-flex min-h-11 items-center underline underline-offset-4">Send now</button>
            </p>
          )}
          {/* Whether the coach may read the user's own notes */}
          <label className="mt-4 flex min-h-11 items-start gap-3">
            {/* The switch */}
            <input type="checkbox" checked={settings?.shareNotes === true} onChange={changeShareNotes} className="mt-1 size-5 flex-none accent-accent" />
            {/* What it does */}
            <span>
              {/* The choice */}
              Let the coach read my notes after I listen back.
              {/* What that means */}
              <span className="block text-footnote text-ink-muted">Your notes are sent with the transcript, and the coach answers them. Feedback then waits until you have saved your notes. Off by default.</span>
            </span>
          </label>
        </details>
      </Section>}

      {/* Export and import */}
      <Section title="Your data">
        {/* Why to export */}
        <p className="text-ink-muted">Everything lives on this device. Browsers can clear saved data, so keep a copy now and then.</p>
        {/* Export */}
        <button type="button" onClick={exportData} className="inline-flex min-h-11 items-center mt-3 underline underline-offset-4">Export my data</button>
        {/* Import */}
        <p className="mt-3">
          <label className="cursor-pointer underline underline-offset-4">
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
          <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex min-h-11 items-center underline underline-offset-4">Delete all my data</button>
        )}
        {/* Confirmation step */}
        {confirmingDelete && (
          <div>
            {/* What will happen */}
            <p>This removes every recording, transcript, and setting on this device. It cannot be undone.</p>
            {/* Confirm */}
            <button type="button" onClick={deleteEverything} className="mt-3 min-h-11 bg-ink px-4 text-paper-raised">Yes, delete everything</button>
            {/* Back out */}
            <button type="button" onClick={() => setConfirmingDelete(false)} className="ml-4 inline-flex min-h-11 items-center italic text-ink-muted underline underline-offset-4">Keep my data</button>
          </div>
        )}
      </Section>

      {/* Development-only tools */}
      {DEVELOPMENT && (
        <Section title="While building (not in the released app)">
          {/* Fill with sample sessions */}
          <button type="button" onClick={loadSamples} className="inline-flex min-h-11 items-center underline underline-offset-4">Fill with sample sessions</button>
          {/* Links to design pages */}
          <p className="mt-3 text-ink-muted">
            <Link href="/style" className="inline-flex min-h-11 items-center underline underline-offset-4">Style page</Link>
            {" · "}
            <Link href="/wireframes" className="inline-flex min-h-11 items-center underline underline-offset-4">Wireframes</Link>
          </p>
        </Section>
      )}
    </main>
  );
}
