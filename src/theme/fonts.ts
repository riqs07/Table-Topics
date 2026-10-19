// Loads the theme fonts from Google Fonts at build time and serves them from our own site

// Load the font loaders for the web fonts the themes use
import { Atkinson_Hyperlegible_Next, Fraunces, Newsreader, Young_Serif } from "next/font/google";

// Notebook body font: designed for readability
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", variable: "--font-atkinson" });
// Notebook display font: a soft serif for headings and prompts (not preloaded: only the style page uses it; decision 76)
const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-young-serif", preload: false });
// The earlier calm studio serif, with italics and optical sizes (not preloaded: only the style page uses it now; decision 76)
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], display: "swap", variable: "--font-newsreader", preload: false });

// Class names that define every font variable; put on the page root so any theme can use them
// Fraunces: the display face for headlines and numbers (decision 69)
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-fraunces" });

// Every font's variable, set on the page root
export const fontVariables = [atkinson.variable, youngSerif.variable, newsreader.variable, fraunces.variable].join(" ");
