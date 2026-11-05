// @vitest-environment jsdom
// The Chart Kit's components (second design pass): the frame with its emphasised headline, the voice ribbon with its values on focus, the tiny fingerprint, then and now, the over-weeks line, the pause bars and the pitch over your words
import { afterEach, describe, expect, it } from "vitest";
// Load the tools for drawing a component
import { cleanup, render, screen, within } from "@testing-library/react";
// Load what is being checked
import { ChartCard, Emphasised } from "@/components/charts/ChartCard";
import { VoiceRibbon } from "@/components/charts/VoiceRibbon";
import { TakeFingerprint } from "@/components/charts/TakeFingerprint";
import { ThenAndNow } from "@/components/charts/ThenAndNow";
import { OverWeeks } from "@/components/charts/OverWeeks";
import { PauseBars } from "@/components/charts/PauseBars";
import { PitchOverWords } from "@/components/charts/PitchOverWords";
import { ChartKey } from "@/components/charts/ChartKey";
// Load the ribbon type
import type { Ribbon } from "@/core/chartKit";

// Remove the drawn component after each check
afterEach(cleanup);

// A ten-second ribbon: speech, a three-second pause, speech, a one-second pause, speech, and a pause word at 7.5 s
const RIBBON: Ribbon = { levels: [0, 1, 0.5, 0, 0, 0, 1, 0, 0.6, 0], duration: 10, ums: [7.5] };

describe("ChartCard", () => {
  // The headline is the heading, its key words emphasised, the label and note around it
  it("names the card by its headline and emphasises the key words", () => {
    // A card
    render(<ChartCard id="c" label="After a take" headline={<Emphasised text="You paused right before your point." em="right before your point" />} note="Gaps are pauses."><p>chart</p></ChartCard>);
    // The region, its heading's text, the emphasised words and the note
    const region = screen.getByRole("region", { name: "You paused right before your point." });
    // Confirm
    expect([within(region).getByRole("heading").textContent, region.querySelector("em")?.textContent, !!within(region).getByText("After a take"), !!within(region).getByText("Gaps are pauses.")]).toEqual(["You paused right before your point.", "right before your point", true, true]);
  });

  // The label can be the heading instead
  it("can be named by its label", () => {
    // A card named by its label
    render(<ChartCard id="c" label="Energy" heading="label" headline="Strong start."><p>chart</p></ChartCard>);
    // The region is named by the label
    expect(screen.getByRole("region", { name: "Energy" })).toBeTruthy();
  });
});

describe("VoiceRibbon", () => {
  // Bars, pauses, pause words, a sentence, and values on focus
  it("draws bars, real pauses and pause words, says so, and lists each value to focus", () => {
    // The ribbon, the long pause lit
    render(<VoiceRibbon ribbon={RIBBON} width={100} height={40} lit={[{ start: 4, end: 5 }]} pauseNames={{ lit: "right before your point" }} />);
    // The picture's sentence
    const picture = screen.getByRole("img");
    // The values
    const values = within(screen.getByRole("list", { name: "Pauses and pause words" })).getAllByRole("listitem");
    // Confirm the sentence, the bars, the lit pause, the dot and each value (all focusable)
    expect([picture.getAttribute("aria-label"), picture.querySelectorAll("[data-stretch]").length, picture.querySelectorAll("[data-pause='lit']").length, picture.querySelectorAll("[data-um]").length, values.map((item) => item.getAttribute("aria-label")), values.every((item) => item.tabIndex === 0)]).toEqual(["Your voice as a ribbon, with 2 real pauses and 1 pause word.", 4, 1, 1, ["A 3.0-second pause, right before your point, at 0:03", "A 1.0-second pause, at 0:07", "A pause word at 0:07"], true]);
  });

  // Pause words hidden: no dots, not said
  it("leaves pause words out when they are hidden", () => {
    // The ribbon without pause words
    render(<VoiceRibbon ribbon={RIBBON} pauseWords={false} />);
    // No dots, and the sentence leaves them out
    expect([document.querySelectorAll("[data-um]").length, screen.getByRole("img").getAttribute("aria-label")]).toEqual([0, "Your voice as a ribbon, with 2 real pauses."]);
  });
});

describe("TakeFingerprint", () => {
  // Decoration in a History row
  it("draws a small, still ribbon hidden from screen readers", () => {
    // A tiny copy with a pause word
    render(<TakeFingerprint mini={{ v: 1, bins: Array.from({ length: 32 }, (_, index) => (index % 5 === 0 ? 0 : 6)), ums: [3] }} />);
    // The wrapper, no picture role, no values to focus, one dot
    expect([!!document.querySelector("[data-mini-fingerprint]"), screen.queryByRole("img"), screen.queryByRole("list"), document.querySelectorAll("[data-um]").length]).toEqual([true, null, null, 1]);
  });
});

describe("ThenAndNow", () => {
  // Two ribbons, the earlier grey, with the number
  it("draws the earlier take grey above this one, with the change as a number", () => {
    // The pair
    render(<ThenAndNow before={{ ...RIBBON, ums: [1, 2, 7.5] }} after={RIBBON} names={{ before: "Day 1", after: "Today" }} stat={{ value: "2.3", caption: "pause words a minute today", then: "day 1: 6.1" }} />);
    // The pictures' names and the number
    expect([screen.getAllByRole("img").map((picture) => picture.getAttribute("aria-label")), !!screen.getByText("2.3"), document.querySelectorAll(".fill-chart-ghost[data-stretch]").length]).toEqual([["Day 1, drawn grey: pause words in 3 places.", "Today: pause words in 1 place."], true, 4]);
  });
});

describe("OverWeeks", () => {
  // One line, the ghost, the latest value, a value per week to focus
  it("draws the weeks as one line with the first as a ghost and a value per week", () => {
    // Three weeks, the middle one missing
    render(<OverWeeks weeks={[{ label: "Two weeks ago", value: 4 }, { label: "Last week", value: null }, { label: "This week", value: 2 }]} format={(value) => value.toFixed(1)} tip={(week) => `${week.label}: ${week.value === null ? "none" : week.value.toFixed(1)}`} listLabel="By week" label="Pause words a minute over three weeks." ghostName="two weeks ago" />);
    // The values to focus, the ghost and the latest value printed
    expect([within(screen.getByRole("list", { name: "By week" })).getAllByRole("listitem").map((item) => item.getAttribute("aria-label")), !!document.querySelector("[data-ghost]"), !!screen.getByRole("img", { name: "Pause words a minute over three weeks." })]).toEqual([["Two weeks ago: 4.0", "Last week: none", "This week: 2.0"], true, true]);
  });
});

describe("PauseBars", () => {
  // A bar per mark against the band, grey outside it, each value to focus
  it("draws a bar per mark against the band, in or grey, with each value", () => {
    // Three marks
    render(<PauseBars gaps={[{ after: "today", seconds: 1.5 }, { after: "then", seconds: 0.4 }, { after: "so", seconds: null }]} target={{ shortest: 0.9, longest: 2.5 }} listLabel="Pause at each mark" label="Pauses." />);
    // The bars in and out, and the values
    expect([[...document.querySelectorAll("[data-inside]")].map((bar) => bar.getAttribute("data-inside")), document.querySelector("[data-inside='false']")?.getAttribute("class"), within(screen.getByRole("list", { name: "Pause at each mark" })).getAllByRole("listitem").map((item) => item.getAttribute("aria-label"))]).toEqual([["true", "false"], "fill-chart-ghost", ["after “today”: 1.5 s", "after “then”: 0.4 s", "after “so”: not heard"]]);
  });
});

describe("PitchOverWords", () => {
  // The soft line, the ghost and a clean fall over the words
  it("draws your line over your words with the ghost under it and a teal dot for a clean fall", () => {
    // One row
    render(<PitchOverWords width={200} words={[{ text: "for", start: 0, end: 0.3 }, { text: "Friday.", start: 0.3, end: 0.9 }]} slots={[{ index: 0, left: 0, width: 36 }, { index: 1, left: 40, width: 60 }]} path="M0 30 C50 20 100 25 190 40" under="M0 34 L190 34" fell={{ x: 190, y: 40 }} label="Your endings fell." />);
    // The line, the ghost, the fall and the words
    expect([!!document.querySelector("[data-curve].stroke-chart-voice"), !!document.querySelector("[data-under].stroke-chart-ghost"), !!document.querySelector("[data-fell]"), !!screen.getByText("Friday.")]).toEqual([true, true, true, true]);
  });
});

describe("ChartKey", () => {
  // Each mark with its name
  it("names each mark", () => {
    // A key
    render(<ChartKey items={[{ kind: "ghost", name: "Last try" }, { kind: "pitch", name: "This try" }]} />);
    // Both names
    expect([!!screen.getByText("Last try"), !!screen.getByText("This try")]).toEqual([true, true]);
  });
});
