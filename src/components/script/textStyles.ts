// Shared text looks, so headings and labels match on every page (design pass, decision 59)

// A section heading inside a page, such as "Speak on the spot" or "Keep going"
export const SECTION_HEADING = "font-display text-2xl font-semibold leading-tight";
// A small label over a block, such as "Today's mission · Follow up" (plain, never italic or uppercase)
export const LABEL = "text-footnote font-bold text-ink-muted";
// A card lifted off the page: white, softly rounded, with a soft shadow (decision 69)
export const CARD = "rounded-[22px] border-2 border-rule bg-card shadow-card";
// A list of rows inside one card, with hairlines between the rows (decision 69)
export const CARD_LIST = "divide-y-2 divide-rule rounded-[22px] border-2 border-rule bg-card px-4 shadow-card";

// The small uppercase label above a card's title (UI rewrite)
export const LAB = "text-xs font-extrabold uppercase tracking-[.07em] text-ink-muted";

// The same label on a coloured tint, where the muted ink would be too faint (UI rewrite)
export const LAB_ON_TINT = "text-xs font-extrabold uppercase tracking-[.07em] text-ink";

// A speech bubble from Sage or the blob, its tail on the left pointing at the speaker (UI rewrite; the tail is drawn in globals.css)
export const BUBBLE = "vl-bubble relative rounded-[20px] border-2 border-rule bg-card px-4 py-3 font-bold";

// A small pill: a length, "Up next", a tag (UI rewrite)
export const CHIP = "inline-block rounded-full bg-paper px-2.5 py-1 text-chip font-extrabold text-ink-muted";

// The same pill in the accent's tint, for good news ("Up next", "Done")
export const CHIP_GOOD = "inline-block rounded-full bg-accent-tint px-2.5 py-1 text-chip font-extrabold text-accent-tint-ink";

// A chunky progress bar's track (UI rewrite)
export const PBAR = "block h-3.5 overflow-hidden rounded-full bg-rule";

// Its filled part, with a darker lower edge
export const PBAR_FILL = "block h-full origin-left rounded-full bg-accent shadow-bar";
