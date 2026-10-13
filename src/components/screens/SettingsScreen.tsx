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

// Draw the Settings screen
export function SettingsScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Saved settings, once loaded
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  // A message to show after an action
  const [message, setMessage] = useState("");
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
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

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
      <Masthead title="Settings">
        <Link href="/" className="hover:underline">Back to the prompt</Link>
      </Masthead>

      {/* Result of the last action, read out to screen readers */}
      <p role="status" className="mt-4 min-h-6 italic text-accent">{message}</p>

      {/* How long recordings are kept */}
      <Section title="Your recordings">
        {/* The limit as a sentence with a choice in it */}
        <p>
          Keep recordings from your last{" "}
          <select aria-label="Keep recordings from your last" value={settings?.audioRetention ?? 30} onChange={changeRetention} className="border-b border-ink bg-transparent">
            {/* One option per choice */}
            {RETENTION_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>{" "}
          sessions. Your first recording is always kept. Transcripts and feedback are never removed.
        </p>
      </Section>

      {/* Export and import */}
      <Section title="Your data">
        {/* Why to export */}
        <p className="text-ink-muted">Everything lives on this device. Browsers can clear saved data, so keep a copy now and then.</p>
        {/* Export */}
        <button type="button" onClick={exportData} className="mt-3 underline underline-offset-4">Export my data</button>
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
          <button type="button" onClick={() => setConfirmingDelete(true)} className="underline underline-offset-4">Delete all my data</button>
        )}
        {/* Confirmation step */}
        {confirmingDelete && (
          <div>
            {/* What will happen */}
            <p>This removes every recording, transcript, and setting on this device. It cannot be undone.</p>
            {/* Confirm */}
            <button type="button" onClick={deleteEverything} className="mt-3 bg-ink px-4 py-2 text-paper-raised">Yes, delete everything</button>
            {/* Back out */}
            <button type="button" onClick={() => setConfirmingDelete(false)} className="ml-4 italic text-ink-muted underline underline-offset-4">Keep my data</button>
          </div>
        )}
      </Section>

      {/* Development-only tools */}
      {DEVELOPMENT && (
        <Section title="While building (not in the released app)">
          {/* Fill with sample sessions */}
          <button type="button" onClick={loadSamples} className="underline underline-offset-4">Fill with sample sessions</button>
          {/* Links to design pages */}
          <p className="mt-3 text-ink-muted">
            <Link href="/style" className="underline underline-offset-4">Style page</Link>
            {" · "}
            <Link href="/wireframes" className="underline underline-offset-4">Wireframes</Link>
          </p>
        </Section>
      )}
    </main>
  );
}
