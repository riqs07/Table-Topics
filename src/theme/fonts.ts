// Loads the theme fonts from Google Fonts at build time and serves them from our own site

// Load the font loaders for the three web fonts the themes use
import { Atkinson_Hyperlegible_Next, Figtree, Young_Serif } from "next/font/google";

// Notebook body font: designed for readability
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", variable: "--font-atkinson" });
// Notebook display font: a soft serif for headings and prompts
const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-young-serif" });
// Calm studio font: a modern sans
const figtree = Figtree({ subsets: ["latin"], display: "swap", variable: "--font-figtree" });

// Class names that define every font variable; put on the page root so any theme can use them
export const fontVariables = [atkinson.variable, youngSerif.variable, figtree.variable].join(" ");
