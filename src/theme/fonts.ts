// Loads the theme fonts from Google Fonts at build time and serves them from our own site

// Load the font loaders for the web fonts the themes use
import { Atkinson_Hyperlegible_Next, Newsreader, Young_Serif } from "next/font/google";

// Notebook body font: designed for readability
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", variable: "--font-atkinson" });
// Notebook display font: a soft serif for headings and prompts
const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-young-serif" });
// Calm studio font (script-page direction): an editorial serif with italics and optical sizes
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], display: "swap", variable: "--font-newsreader" });

// Class names that define every font variable; put on the page root so any theme can use them
export const fontVariables = [atkinson.variable, youngSerif.variable, newsreader.variable].join(" ");
