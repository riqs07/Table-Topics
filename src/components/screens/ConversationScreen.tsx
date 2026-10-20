"use client";
// A spoken conversation with a persona (decisions 83 and 84): they speak, you answer out loud and tap Done, for about three minutes; then it is saved and the coach reviews the whole conversation. With the coach set up, each conversation is in a new situation and every line is written for it and spoken in the persona's voice; without it, the persona says their recorded lines in their own situation

// Load React's state, ref, effect and external-store tools
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the masthead
import { Masthead } from "@/components/script/Masthead";
// Load the shared button looks
import { PRIMARY, QUIET, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the voice shapes
import { StartBlob, StatusBlob, VoiceBlob } from "@/components/script/VoiceShapes";
// Load the microphone help
import { ALLOW_STEPS, PROBLEM_TEXT } from "@/components/script/microphoneHelp";
// Load the shared screen starting points
import { subscribeToNothing, useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the tab title
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the take recorder
import { useTakeRecorder } from "@/components/screens/useTakeRecorder";
// Load the personas and situations
import { findLine, findPersona, findScenario, pickSituation, scenarioText, type Persona, type Scenario } from "@/content/conversations";
// Load the small-talk unit type, for a conversation opened from a unit page
import type { UnitId } from "@/content/smallTalk";
// Load the saved recordings, for each recorded line's length
import { voiceClip } from "@/content/voiceClips";
// Load the turn rules
import { CONVERSATION_LIMIT_SECONDS, isGoodbye, listeningLine, openingLine, scriptedNext, stageAt, type ConversationStage } from "@/core/conversationTurn";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the client that asks for the next line
import { nextLine, type LineRequest, type WrittenLine } from "@/data/conversationClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";
// Load the saver
import { saveConversationSession } from "@/data/conversationSessions";
// Load the turn type
import type { ConversationTurn } from "@/data/records";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";

// The longest one turn of yours runs before it ends by itself, in seconds
const MAX_TURN_SECONDS = 60;
// How far past the limit a turn of yours may run before it ends by itself, in seconds
const LIMIT_GRACE_SECONDS = 15;
// How long to wait for the next line before a listening sound plays, in milliseconds
const LISTEN_DELAY_MS = 650;

// Where the conversation is
type Phase =
  // Before starting: the situation and what to practise
  | "intro"
  // The persona is speaking
  | "them"
  // Their next line is on its way
  | "thinking"
  // Your turn: the microphone starting, recording, or a problem to retry
  | "you"
  // Being saved
  | "saving"
  // Nothing was heard from you, so nothing was saved
  | "empty"
  // The connection dropped before you said anything, so nothing was saved
  | "lost"
  // Saving failed
  | "failed";

// Asks for the persona's next written line: the line, or null when it could not be written
export type WriteLine = (request: LineRequest) => Promise<WrittenLine | null>;

// The real asker: the conversation route with the saved passphrase
const askRoute: WriteLine = (request) => nextLine(request, { passphrase: readPassphrase() });

// Whether the coach is set up on this device (a passphrase is saved)
const passphraseSaved = () => readPassphrase() !== "";

// What the conversation page is given
interface ConversationScreenProps extends ScreenProps {
  // Who to talk with
  characterId: string;
  // Only situations practising this skill (from a unit page), or every situation
  skill?: UnitId;
  // The browser's microphone, transcriber, capture and voice
  services: RecordingServices;
  // Where to go once saved (the router in the app)
  navigate: (path: string) => void;
  // How the next line is written (the route in the app, a fake in checks)
  writeLine?: WriteLine;
  // Whether the coach is set up (a saved passphrase in the app)
  coachReady?: () => boolean;
  // The clock (replaced in checks)
  clock?: () => Date;
  // How long to wait before a listening sound, in milliseconds (shorter in checks)
  listenDelayMs?: number;
}

// Draw the conversation with the persona named, or say they could not be found
export function ConversationScreen({ characterId, ...rest }: ConversationScreenProps) {
  // Who it is with
  const persona = findPersona(characterId);
  // Known: the conversation
  if (persona) return <Conversation persona={persona} {...rest} />;
  // Unknown: say so, with the way back
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title and the way out */}
      <Masthead title="Conversation" nav={false} close={{ href: "/conversations", label: "Close, back to Conversations" }} />
      {/* What happened */}
      <h1 className="mt-8 font-display text-statement font-semibold tracking-tight">That person could not be found.</h1>
      {/* The way back */}
      <p className="mt-4"><Link href="/conversations" className={TEXT_LINK}>See everyone to talk with</Link></p>
    </main>
  );
}

// The conversation itself
function Conversation({ persona, skill, services, navigate, writeLine = askRoute, coachReady = passphraseSaved, clock: givenClock, listenDelayMs = LISTEN_DELAY_MS, ...props }: Omit<ConversationScreenProps, "characterId"> & { persona: Persona }) {
  // The repository once in the browser
  const { repo } = useScreenBasics(props);
  // The clock
  const [clock] = useState(() => givenClock ?? (() => new Date()));
  // Whether this browser can turn speech into text (worked out in the browser only)
  const supported = useSyncExternalStore(subscribeToNothing, () => services.speechSupported(), () => true);
  // Whether the coach is set up, so lines can be written (worked out in the browser only)
  const coach = useSyncExternalStore(subscribeToNothing, coachReady, () => false);
  // The recorder, listening for words (its clock is this turn's; the whole conversation's is in the header)
  const { recording, stopping, levels, elapsed: turnSeconds, problem, start, stop } = useTakeRecorder({ services, clock, raw: false, words: true });
  // Where the conversation is
  const [phase, setPhase] = useState<Phase>("intro");
  // Their latest line, shown as they say it
  const [caption, setCaption] = useState("");
  // Whether your last turn was not caught
  const [missed, setMissed] = useState(false);
  // Seconds since the conversation started, ticking while it runs
  const [elapsed, setElapsed] = useState(0);
  // How many earlier conversations with them (null until read), so the situation moves on each time
  const [earlier, setEarlier] = useState<number | null>(null);
  // How many times "another situation" was tapped
  const [skipped, setSkipped] = useState(0);
  // Whether the coach could not be reached, so the recorded lines are used instead
  const [fellBack, setFellBack] = useState(false);
  // Every turn so far (kept outside rendering, since the turns run across several awaits)
  const turns = useRef<ConversationTurn[]>([]);
  // When it started
  const startedAt = useRef<Date | null>(null);
  // Whether it is still running (false once ended or the page closes, so waiting steps stop)
  const alive = useRef(false);
  // Whether it is being saved, so it is saved once
  const saving = useRef(false);
  // Name the tab
  usePageTitle(`Talk with ${persona.name}`);

  // Written lines when the coach is set up and was reached; otherwise the recorded lines
  const written = coach && !fellBack;
  // The situation: a new one each conversation with written lines, their own with recorded lines
  const situation: { scenario: Scenario; twist: number } = written ? pickSituation(persona, (earlier ?? 0) + skipped, skill) : { scenario: findScenario(persona.home)!, twist: 0 };
  // The situation
  const { scenario, twist } = situation;

  // Count earlier conversations with them, so the situation moves on and the recorded opening changes
  useEffect(() => {
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read the sessions
    void repo.listSessions().then((sessions) => {
      // Keep the count while the page is open
      if (!cancelled) setEarlier(sessions.filter((session) => session.mode === "conversation" && session.promptId === persona.id).length);
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [persona.id, repo]);

  // Get the recorded lines ready, so the listening sounds (and, without the coach, every line) play at once
  useEffect(() => {
    // Each line
    for (const line of persona.lines) services.prepareSpeech?.(line.id);
  }, [persona, services]);

  // Stop the voice and every waiting step if the page closes mid-conversation
  useEffect(() => () => {
    // No longer running
    alive.current = false;
    // Quiet
    services.stopSpeaking?.();
  }, [services]);

  // Seconds since the start
  const secondsIn = () => (startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0);

  // Tick the clock while the conversation runs
  useEffect(() => {
    // Only while talking
    if (phase !== "them" && phase !== "thinking" && phase !== "you") return;
    // Twice a second
    const timer = setInterval(() => setElapsed(startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0), 500);
    // Not once it stops
    return () => clearInterval(timer);
  }, [clock, phase]);

  // Add a turn
  function add(turn: ConversationTurn) {
    // To the list
    turns.current = [...turns.current, turn];
  }

  // Say recorded lines in order, adding each to the conversation (or not, for a line that is not part of it); true if one was a goodbye
  async function sayRecorded(ids: ReadonlyArray<string>, keep = true): Promise<boolean> {
    // Each line
    for (const id of ids) {
      // Stop if the conversation ended
      if (!alive.current) return false;
      // The line
      const line = findLine(persona, id);
      // Unknown: skip it
      if (!line) continue;
      // They are speaking
      setPhase("them");
      // Their words on screen
      setCaption(line.text);
      // Part of the conversation, counted as said even if it is cut short
      if (keep) add({ who: "them", text: line.text, lineId: line.id, seconds: voiceClip(line.id)?.seconds ?? 0 });
      // Say it (called straight away, so the first line plays within the Start tap)
      await services.speak?.(line.text, line.id).catch(() => null);
    }
    // Whether it ended the conversation
    return keep && ids.some((id) => isGoodbye(persona, id));
  }

  // Say a written line, adding it to the conversation (or not, when asking you to say it again); true if it was a goodbye
  async function sayWritten(line: WrittenLine, keep = true): Promise<boolean> {
    // Stop if the conversation ended
    if (!alive.current) return false;
    // They are speaking
    setPhase("them");
    // Their words on screen
    setCaption(line.text);
    // Part of the conversation, counted as said even if it is cut short
    if (keep) add({ who: "them", text: line.text, seconds: 0 });
    // Say it in their voice, or the phone's own
    await services.speakAudio?.(line.audio, line.text).catch(() => undefined);
    // Whether it ended the conversation
    return keep && line.goodbye;
  }

  // Ask for their next written line, with a listening sound if it takes a moment
  async function ask(stage: ConversationStage, heard: boolean): Promise<WrittenLine | null> {
    // Their next line is on its way
    setPhase("thinking");
    // Ask
    const asking = writeLine({ personaId: persona.id, scenarioId: scenario.id, twist, turns: turns.current, stage, heard }).catch(() => null);
    // A listening sound, if it takes a moment
    const sound: { playing: Promise<unknown> | null } = { playing: null };
    // Play it after a short wait (not before their first line, or when asking you to say it again)
    const timer = stage === "open" || !heard ? null : setTimeout(() => {
      // Only while still running
      if (!alive.current) return;
      // The sound for this turn
      const line = listeningLine(persona, turns.current);
      // Play it, kept out of the conversation
      sound.playing = services.speak?.(line.text, line.id).catch(() => null) ?? null;
    }, listenDelayMs);
    // The line
    const line = await asking;
    // No sound needed if it came in time
    if (timer) clearTimeout(timer);
    // Let a listening sound finish
    if (sound.playing) await sound.playing;
    // The line, or nothing
    return line;
  }

  // Your turn: start recording
  async function yourTurn() {
    // Stop if the conversation ended
    if (!alive.current) return;
    // Your turn
    setPhase("you");
    // Open the microphone and record
    await start();
    // Ended while the microphone opened: let it go
    if (!alive.current) await stop();
  }

  // Done: end your turn, then let them answer
  async function done() {
    // Your take
    const take = await stop();
    // Nothing was under way, or the conversation ended
    if (!take || !alive.current) return;
    // What you said
    const text = take.transcript.trim();
    // Nothing caught after time is up: never ask again (the turn would end itself at once, over and over), so say goodbye and save
    if (!text && stageAt(secondsIn()) === "end") return farewell();
    // Nothing caught: they ask you to say it again, then it is your turn again
    if (!text) {
      // Say why on screen
      setMissed(true);
      // With written lines, a line for it, kept out of the conversation
      if (written) {
        // Asked for
        const again = await ask(stageAt(secondsIn()), false);
        // The connection dropped
        if (!again) return lose();
        // Said, kept in the conversation only if it says goodbye; a goodbye ends it
        if (await sayWritten(again, again.goodbye)) return save();
      } else {
        // Their recorded line for it, kept out of the conversation
        await sayRecorded([persona.again], false);
      }
      // Try again
      await yourTurn();
      // Nothing more
      return;
    }
    // Caught
    setMissed(false);
    // Your turn
    add({ who: "you", text, seconds: take.durationSec });
    // How far in
    const stage = stageAt(secondsIn());
    // Their reply ends the conversation
    let ended: boolean;
    // Written: ask for the next line
    if (written) {
      // Asked for
      const reply = await ask(stage, true);
      // The connection dropped: save what was said
      if (!reply) return lose();
      // Said
      ended = await sayWritten(reply);
    } else {
      // Recorded: the next step of the script, or a goodbye near the end
      ended = await sayRecorded(scriptedNext(persona, turns.current, stage !== "talk"));
    }
    // A goodbye, or time is up: save
    if (ended || stage === "end") return save();
    // Your turn again
    await yourTurn();
  }

  // Start: their opening line, then your turn
  async function begin() {
    // Running
    alive.current = true;
    // Not saving
    saving.current = false;
    // From the beginning
    turns.current = [];
    // Now
    startedAt.current = clock();
    // From zero
    setElapsed(0);
    // Nothing missed yet
    setMissed(false);
    // Recorded: the opening starts within this tap, which lets phones play the later lines too
    if (!written) {
      // The opening, then your turn
      await sayRecorded([openingLine(persona, earlier ?? 0).id]);
      // Your turn
      return yourTurn();
    }
    // Written: unlock the player within this tap, since the opening arrives over the network
    services.unlockSpeech?.();
    // The opening
    const opening = await ask("open", true);
    // The coach could not be reached: back to the start, with their recorded lines instead
    if (!opening) {
      // No longer running
      alive.current = false;
      // Use the recordings
      setFellBack(true);
      // Back to the start
      setPhase("intro");
      // Nothing more
      return;
    }
    // Said, then your turn
    await sayWritten(opening);
    // Your turn
    await yourTurn();
  }

  // Time is up and your last turn was not caught: their goodbye, then save
  async function farewell() {
    // Nothing missed to show
    setMissed(false);
    // Written: ask for a goodbye
    if (written) {
      // Asked for
      const goodbye = await ask("end", true);
      // The connection dropped: save what was said
      if (!goodbye) return lose();
      // Said
      await sayWritten(goodbye);
    } else {
      // Recorded: a goodbye line
      await sayRecorded(scriptedNext(persona, turns.current, true));
    }
    // Save (stopped by the page closing, the goodbye still ends it)
    return save();
  }

  // The connection dropped mid-conversation: save what was said
  async function lose() {
    // Save, saying why if nothing of yours was said
    await save(true);
  }

  // End early: keep what you were saying, then save
  async function end() {
    // No longer running, so waiting steps stop
    alive.current = false;
    // Quiet
    services.stopSpeaking?.();
    // A take under way
    const take = await stop();
    // Keep its words, if any
    if (take && take.transcript.trim()) add({ who: "you", text: take.transcript.trim(), seconds: take.durationSec });
    // Save
    await save();
  }

  // Save the conversation and open its results (lost: the connection dropped)
  async function save(lost = false) {
    // Once
    if (saving.current) return;
    // Saving now
    saving.current = true;
    // No longer running
    alive.current = false;
    // Show it
    setPhase("saving");
    // Nothing heard from you: nothing to save
    if (!turns.current.some((turn) => turn.who === "you" && turn.text.trim() !== "")) {
      // Say so
      setPhase(lost ? "lost" : "empty");
      // Ready to start again
      saving.current = false;
      // Nothing more
      return;
    }
    // Save, noting any failure
    try {
      // A new id
      const id = crypto.randomUUID();
      // Saved, waiting for the coach
      await saveConversationSession(repo, { id, characterId: persona.id, scenarioId: scenario.id, twist, turns: turns.current, durationSec: secondsIn() }, clock());
      // Its results, where the coach's notes arrive
      navigate(`/sessions?id=${id}`);
    } catch {
      // Not saved
      setPhase("failed");
      // Ready to try again
      saving.current = false;
    }
  }

  // End a turn of yours that runs too long, or past the time limit
  useEffect(() => {
    // Only while recording
    if (!recording) return;
    // Seconds left before it ends by itself
    const left = Math.min(MAX_TURN_SECONDS, CONVERSATION_LIMIT_SECONDS + LIMIT_GRACE_SECONDS - (startedAt.current ? (clock().getTime() - startedAt.current.getTime()) / 1000 : 0));
    // End it then
    const timer = setTimeout(() => void done(), Math.max(0, left) * 1000);
    // Not if it ends first
    return () => clearTimeout(timer);
    // done reads only refs and steady tools, so it need not restart the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, recording]);

  // Whether the conversation is under way
  const talking = phase === "them" || phase === "thinking" || phase === "you";
  // The situation's words, with the name filled in
  const named = (text: string) => scenarioText(text, persona);

  // Draw the page
  return (
    // Dark while you speak (the stage, decision 69)
    <main data-area={recording ? "stage" : undefined} className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title, the time, and the way out (none mid-conversation; End saves it instead) */}
      <Masthead title="Conversation" nav={false} close={talking || phase === "saving" ? null : { href: "/conversations", label: "Close, back to Conversations" }}>{talking ? `${formatClock(elapsed)} of ${formatClock(CONVERSATION_LIMIT_SECONDS)}` : ""}</Masthead>

      {/* Before starting: the situation and what to practise (once the earlier conversations are counted) */}
      {phase === "intro" && earlier !== null && (
        <section aria-labelledby="talk-heading" className="mt-8 md:max-w-2xl">
          {/* The situation */}
          <p className="text-footnote font-semibold text-accent">{scenario.title}</p>
          {/* Who to talk with */}
          <h1 id="talk-heading" className="mt-1 font-display text-statement font-semibold tracking-tight">Talk with {persona.name}</h1>
          {/* Where you are */}
          <p className="mt-3 max-w-[48ch] text-lede">{named(scenario.setting)}</p>
          {/* What to practise */}
          <div className={`mt-5 p-4 ${CARD}`}>
            {/* Small heading */}
            <p className="text-footnote text-ink-muted">Practise</p>
            {/* The skill */}
            <p className="mt-1 text-lede">{named(scenario.practise)}</p>
          </div>
          {/* The coach could not be reached */}
          {fellBack && <p role="status" className="mt-4 max-w-[48ch] text-lede">The coach couldn’t be reached, so {persona.name} will use recorded lines here.</p>}
          {/* How it works */}
          <p className="mt-4 max-w-[52ch] text-footnote text-ink-muted">About 3 minutes. {persona.name} speaks first. Answer out loud, then tap Done. {persona.name}’s voice is AI, by ElevenLabs.{coach ? "" : " Set the passphrase in Settings for a new situation each time."}</p>
          {/* No speech-to-text in this browser */}
          {!supported && <p role="alert" className="mt-4 max-w-[48ch] text-lede">This browser can’t turn speech into text, so {persona.name} can’t follow what you say. Try Chrome, Edge or Safari.</p>}
          {/* Start, or another situation */}
          {supported && (
            <p className="mt-6 flex flex-wrap gap-3">
              {/* Start */}
              <button type="button" onClick={() => void begin()} className={PRIMARY}>Start</button>
              {/* Another situation, when lines are written */}
              {written && <button type="button" onClick={() => setSkipped(skipped + 1)} className={QUIET}>Another situation</button>}
            </p>
          )}
        </section>
      )}

      {/* The conversation */}
      {(talking || phase === "saving") && (
        <section aria-labelledby="line-heading" className="mt-8 flex flex-col md:max-w-2xl">
          {/* Who, and where */}
          <p className="text-footnote font-semibold text-accent">{persona.name} · {scenario.title}</p>
          {/* Their latest line, announced as it changes */}
          <h1 id="line-heading" aria-live="polite" className="mt-3 font-display text-statement font-semibold tracking-tight">{caption || "…"}</h1>
          {/* Not caught last time */}
          {missed && phase === "you" && <p role="status" className="mt-3 text-lede">That wasn’t caught. Say it again, then tap Done.</p>}
          {/* A problem, explained plainly */}
          {problem && phase === "you" && <p role="alert" className="mt-4 max-w-[48ch] text-lede">{PROBLEM_TEXT[problem]}</p>}
          {/* A blocked microphone: how to allow it */}
          {problem === "microphone-blocked" && phase === "you" && (
            // One step per device
            <ul aria-label="How to allow the microphone" className="mt-3 max-w-[52ch] list-disc space-y-2 pl-5 text-lede">
              {/* Each step */}
              {ALLOW_STEPS.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {/* The shape: them speaking, their line on its way, your turn, or saving */}
          {phase === "saving" ? (
            <StatusBlob compact={false} label="Saving…" detail="one moment" />
          ) : phase === "them" ? (
            <StatusBlob compact={false} label={persona.name} detail="is talking" />
          ) : phase === "thinking" ? (
            <StatusBlob compact={false} label={persona.name} detail={caption ? "is listening" : "is about to speak"} />
          ) : recording ? (
            <VoiceBlob levels={levels} signal="none" clock={formatClock(turnSeconds)} onStop={() => void done()} compact={false} action="Done" />
          ) : stopping ? (
            <StatusBlob compact={false} label="One moment…" detail="catching your words" />
          ) : problem ? (
            <StartBlob compact={false} onStart={() => void yourTurn()} label="Try again" detail="your turn" />
          ) : (
            <StatusBlob compact={false} label="Your turn" detail="allow the microphone" />
          )}
          {/* What to do while recording */}
          {recording && <p className="text-center text-footnote text-ink-muted md:text-left">Your turn. Tap Done when you’ve finished.</p>}
          {/* End early, saving what was said */}
          {talking && !stopping && <p className="mt-4 text-center md:text-left"><button type="button" onClick={() => void end()} className={QUIET}>End conversation</button></p>}
        </section>
      )}

      {/* Nothing heard from you, or the connection dropped first */}
      {(phase === "empty" || phase === "lost") && (
        <section aria-labelledby="empty-heading" className="mt-8 md:max-w-2xl">
          {/* What happened */}
          <h1 id="empty-heading" className="font-display text-statement font-semibold tracking-tight">{phase === "lost" ? "The conversation couldn’t continue, so nothing was saved." : "Nothing was heard from you, so nothing was saved."}</h1>
          {/* Try again */}
          <p className="mt-6"><button type="button" onClick={() => void begin()} className={PRIMARY}>Start again</button></p>
        </section>
      )}

      {/* Saving failed */}
      {phase === "failed" && (
        <section aria-labelledby="failed-heading" className="mt-8 md:max-w-2xl">
          {/* What happened */}
          <h1 id="failed-heading" role="alert" className="font-display text-statement font-semibold tracking-tight">This conversation could not be saved.</h1>
          {/* Try again */}
          <p className="mt-6"><button type="button" onClick={() => void save()} className={SECONDARY}>Try saving again</button></p>
        </section>
      )}
    </main>
  );
}
