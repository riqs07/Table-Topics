// Loads the theme fonts (from Google Fonts at build time, and the body font from this project) and serves them from our own site

// Load the font loaders for the web fonts the themes use
import { Fraunces, Newsreader, Young_Serif } from "next/font/google";
// Load the loader for a font file kept in this project
import localFont from "next/font/local";

// Notebook body font: designed for readability
// (kept in this project rather than fetched: the same Latin subset Google serves, with the zero redrawn without its slash, which read as "1:0̸0" in times; src/theme/fonts/OFL.txt and decision 89)
const atkinson = localFont({ src: "./fonts/AtkinsonHyperlegibleNext-OpenZero.woff2", weight: "200 800", style: "normal", display: "swap", variable: "--font-atkinson" });
// Notebook display font: a soft serif for headings and prompts (not preloaded: only the other themes use it; decision 76)
const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-young-serif", preload: false });
// The earlier calm studio serif, with italics and optical sizes (not preloaded: only the other themes use it now; decision 76)
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], display: "swap", variable: "--font-newsreader", preload: false });

// Class names that define every font variable; put on the page root so any theme can use them
// Fraunces: the display face for headlines and numbers (decision 69)
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-fraunces" });

// Every font's variable, set on the page root
export const fontVariables = [atkinson.variable, youngSerif.variable, newsreader.variable, fraunces.variable].join(" ");
