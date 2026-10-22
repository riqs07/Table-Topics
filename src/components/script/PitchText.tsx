"use client";
// Pitch shown in the text (decision 111, the standard voice view on a take's page): each word sits a little higher or lower with its pitch against the speaker's usual, peaks are bold in the accent, each phrase ends with a fell, held or rose mark, a statement that rose has its last word in the warm highlight, and a flat phrase is muted

// Load the end marks
import { EndIcon } from "@/components/script/PitchShapes";
// Load the word lift and the phrase type
import { textLift, type Phrase } from "@/core/pitchPhrases";

// The most phrases shown in the text (the rest are on the phrase-by-phrase page)
export const TEXT_PHRASES = 12;

// The end marks' names, read out after each phrase
const END_NAMES = { fell: "ending fell", held: "ending held", rose: "ending rose" } as const;

// The words of the take, lifted and marked by their pitch
export function PitchText({ phrases }: { phrases: ReadonlyArray<Phrase> }) {
  // The phrases shown
  const shown = phrases.slice(0, TEXT_PHRASES);
  // The words
  return (
    <>
      {/* What the picture means */}
      <p className="mt-2 text-footnote text-ink-muted">Words sit higher when your pitch went up and lower when it went down. Bold words were your peaks.</p>
      {/* The words, with room above and below for the lifts */}
      <p data-pitch-text className="mt-3 text-lede leading-[2.6]">
        {/* Each phrase */}
        {shown.map((phrase) => (
          <span key={phrase.index} data-phrase={phrase.index} data-flat={phrase.flat || undefined}>
            {/* Each word */}
            {phrase.words.map((word, place) => {
              // The last word of a statement that rose takes the warm highlight
              const rising = phrase.risingStatement && place === phrase.words.length - 1;
              // Its look: the highlight, a peak, muted in a flat phrase, or plain
              const look = rising ? "rounded-md bg-warm-tint px-1 text-warm-ink" : word.peak ? "font-bold text-accent" : phrase.flat ? "text-ink-muted" : "";
              // The word, lifted by its pitch, then a space
              return (
                <span key={place}>
                  {/* The word */}
                  <span data-peak={word.peak || undefined} className={`inline-block leading-normal ${look}`} style={{ transform: `translateY(${textLift(word.step)}px)` }}>{word.text}</span>
                  {/* The space after it (none after the last, where the mark goes) */}
                  {place < phrase.words.length - 1 ? " " : ""}
                </span>
              );
            })}
            {/* How it ended */}
            {phrase.ending && <span className="ml-1 inline-block align-middle"><EndIcon end={phrase.ending} label={END_NAMES[phrase.ending]} /></span>}
            {/* Room before the next phrase */}
            {" "}
          </span>
        ))}
      </p>
      {/* More phrases than shown */}
      {phrases.length > shown.length && <p className="text-footnote text-ink-muted">And {phrases.length - shown.length} more {phrases.length - shown.length === 1 ? "phrase" : "phrases"}, phrase by phrase below.</p>}
    </>
  );
}
