// Each full speech without its text: id, title, speaker, year, kind and number of parts (decision 88). Written by `pnpm speech-index` from src/content/speeches.ts; do not edit by hand

// One speech in the index
export interface SpeechSummary {
  // Id, such as "jfk-inaugural" (a part's id adds its number: "jfk-inaugural-2")
  id: string;
  // The speech's name
  title: string;
  // Who gave it
  speaker: string;
  // The year it was given
  year: number;
  // Whether it was a graduation (commencement) address
  commencement: boolean;
  // How many parts it is read in
  partCount: number;
}

// Every full speech, oldest first, in the same order as FULL_SPEECHES
export const SPEECH_INDEX: ReadonlyArray<SpeechSummary> = [
  // Give me liberty or give me death, Patrick Henry, 1775
  { id: "henry-liberty", title: "Give me liberty or give me death", speaker: "Patrick Henry", year: 1775, commencement: false, partCount: 10 },
  // What to the slave is the Fourth of July?, Frederick Douglass, 1852
  { id: "douglass-fourth", title: "What to the slave is the Fourth of July?", speaker: "Frederick Douglass", year: 1852, commencement: false, partCount: 18 },
  // A House Divided, Abraham Lincoln, 1858
  { id: "lincoln-house-divided", title: "A House Divided", speaker: "Abraham Lincoln", year: 1858, commencement: false, partCount: 28 },
  // Second Inaugural Address, Abraham Lincoln, 1865
  { id: "lincoln-second-inaugural", title: "Second Inaugural Address", speaker: "Abraham Lincoln", year: 1865, commencement: false, partCount: 7 },
  // The Atlanta Exposition Address, Booker T. Washington, 1895
  { id: "washington-atlanta", title: "The Atlanta Exposition Address", speaker: "Booker T. Washington", year: 1895, commencement: false, partCount: 15 },
  // Citizenship in a Republic (The Man in the Arena), Theodore Roosevelt, 1910
  { id: "roosevelt-citizenship", title: "Citizenship in a Republic (The Man in the Arena)", speaker: "Theodore Roosevelt", year: 1910, commencement: false, partCount: 80 },
  // Making the World Safe for Democracy, Woodrow Wilson, 1917
  { id: "wilson-war-message", title: "Making the World Safe for Democracy", speaker: "Woodrow Wilson", year: 1917, commencement: false, partCount: 36 },
  // First Inaugural Address, Franklin D. Roosevelt, 1933
  { id: "fdr-first-inaugural", title: "First Inaugural Address", speaker: "Franklin D. Roosevelt", year: 1933, commencement: false, partCount: 16 },
  // The Four Freedoms, Franklin D. Roosevelt, 1941
  { id: "fdr-four-freedoms", title: "The Four Freedoms", speaker: "Franklin D. Roosevelt", year: 1941, commencement: false, partCount: 28 },
  // A Date Which Will Live in Infamy, Franklin D. Roosevelt, 1941
  { id: "fdr-infamy", title: "A Date Which Will Live in Infamy", speaker: "Franklin D. Roosevelt", year: 1941, commencement: false, partCount: 4 },
  // Farewell Address, Dwight D. Eisenhower, 1961
  { id: "eisenhower-farewell", title: "Farewell Address", speaker: "Dwight D. Eisenhower", year: 1961, commencement: false, partCount: 18 },
  // Inaugural Address, John F. Kennedy, 1961
  { id: "jfk-inaugural", title: "Inaugural Address", speaker: "John F. Kennedy", year: 1961, commencement: false, partCount: 12 },
  // Myth and Reality, John F. Kennedy, 1962
  { id: "jfk-yale", title: "Myth and Reality", speaker: "John F. Kennedy", year: 1962, commencement: true, partCount: 37 },
  // A Strategy of Peace, John F. Kennedy, 1963
  { id: "jfk-american-university", title: "A Strategy of Peace", speaker: "John F. Kennedy", year: 1963, commencement: true, partCount: 33 },
  // The Great Society, Lyndon B. Johnson, 1964
  { id: "lbj-michigan", title: "The Great Society", speaker: "Lyndon B. Johnson", year: 1964, commencement: true, partCount: 16 },
  // To Fulfill These Rights, Lyndon B. Johnson, 1965
  { id: "lbj-howard", title: "To Fulfill These Rights", speaker: "Lyndon B. Johnson", year: 1965, commencement: true, partCount: 23 },
  // Address at Notre Dame, Ronald Reagan, 1981
  { id: "reagan-notre-dame", title: "Address at Notre Dame", speaker: "Ronald Reagan", year: 1981, commencement: true, partCount: 32 },
];
