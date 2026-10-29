// Guided courses (decision 131): a course for one focus, made of lessons, each lesson made of short parts, each part a few steps (learn, see it when there is something to see, try, wrap up) that use the modes the app already has. The words here are a first draft to get the flow working; the real lessons come later (see documents/plan-courses.md)

// Load the focus areas a course belongs to
import type { FocusAreaId } from "@/core/practiceFocus";
// Load the kinds of session a part can record
import type { SessionMode } from "@/data/records";

// What a part's practice is compared on between tries, and when its prompt comes back: pause words, pace or length (more measures, such as time to the point, come with the real content)
export type CourseMeasure = "fillers" | "pace" | "length";

// The idea a part teaches, read first
export interface PartLearn {
  // The idea in one line, large
  headline: string;
  // A few sentences on it
  body: string;
  // A weaker way to say it (optional)
  instead?: string;
  // The better way (optional)
  tryThis?: string;
}

// Something to see before trying: a short video, a model answer, or both (optional on a part)
export interface PartSee {
  // A YouTube video, shown through YouTube's privacy-enhanced player, with the stretch to watch in seconds (optional)
  video?: { youtubeId: string; title: string; start?: number; end?: number };
  // A model answer: the question, the answer, and the words in it to highlight (optional)
  model?: { question: string; answer: string; highlight: string; notice: string };
}

// A part's practice: a kind of session the app already has, on a fixed prompt (so it can come back later), with one goal
export interface PartPractice {
  // The kind of session
  mode: Extract<SessionMode, "talk" | "response" | "free">;
  // The prompt it uses
  promptId: string;
  // The one thing to do
  goal: string;
  // One try, or two when a second try helps
  tries: 1 | 2;
  // What the tries are compared on
  measure: CourseMeasure;
}

// One part of a lesson, a few minutes long
export interface CoursePart {
  // Stable id, unique across every course (kept in saved progress)
  id: string;
  // Its name
  title: string;
  // The idea
  learn: PartLearn;
  // Something to see, when there is something
  see?: PartSee;
  // The practice, when the part has some
  practice?: PartPractice;
}

// One lesson: one skill, in a few parts
export interface CourseLesson {
  // Stable id within its course
  id: string;
  // Its name
  title: string;
  // One line on it
  blurb: string;
  // Its parts, in order
  parts: ReadonlyArray<CoursePart>;
}

// One course
export interface Course {
  // Stable id (kept in saved progress through its parts)
  id: string;
  // The focus it belongs to
  focus: FocusAreaId;
  // Its name
  title: string;
  // One line on what it does
  blurb: string;
  // What you can do by the end
  outcomes: ReadonlyArray<string>;
  // Whether its words are still a draft (shown on the course page until the real lessons are written)
  draft: boolean;
  // Its lessons, in order
  lessons: ReadonlyArray<CourseLesson>;
}

// The courses, in the order Practice shows them
export const COURSES: ReadonlyArray<Course> = [
  // Thinking on your feet: the first course (decision 131)
  {
    id: "stop-freezing",
    focus: "spot",
    title: "Stop freezing",
    blurb: "Answer a surprise question without the long “um”.",
    outcomes: ["Start within a couple of seconds, with a pause instead of an “um”", "Say your point in the first sentence", "End on purpose, then stop"],
    draft: true,
    lessons: [
      // Lesson 1
      {
        id: "beat",
        title: "Buy a beat",
        blurb: "Pause instead of filling the silence.",
        parts: [
          // A pause, not a filler
          { id: "sf-beat-1", title: "Pause, don’t fill", learn: { headline: "A pause sounds sure. An “um” sounds lost.", body: "When a question surprises you, silence feels long to you and short to everyone else. Take one breath before your first word, and pause again whenever you would reach for “um”.", instead: "“Um, so, uh, I think…”", tryThis: "(a breath) “I think…”" }, practice: { mode: "talk", promptId: "t003", goal: "Take a breath before your first word, and pause instead of saying “um”.", tries: 2, measure: "fillers" } },
          // Start soon
          { id: "sf-beat-2", title: "Start within two seconds", learn: { headline: "Start with the first true thing you can say.", body: "You do not need the whole answer before you begin. Say the first honest thing that comes to mind, then build on it." }, practice: { mode: "talk", promptId: "t006", goal: "Start speaking within a couple of seconds of seeing the topic.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 2
      {
        id: "point",
        title: "Point first",
        blurb: "Say your answer in the first sentence.",
        parts: [
          // The idea and a model answer
          { id: "sf-point-1", title: "Answer first", learn: { headline: "Say your answer first. Explain after.", body: "When a question surprises you, the instinct is to warm up out loud: background, context, “so basically…”. Listeners decide what you think from your first sentence. Put the answer there, then give your reasons.", instead: "“So, um, I guess it kind of depends, there are a lot of things to think about…”", tryThis: "“Autumn. The light is better, and nobody expects much of you.”" }, see: { model: { question: "Should everyone learn to cook?", answer: "Yes, the basics. Five meals you can make without a recipe saves money and gets you through any week. My dad taught me one each birthday, and I still cook all five.", highlight: "Yes, the basics.", notice: "The answer is three words long and comes before any reason." } }, practice: { mode: "talk", promptId: "t004", goal: "Say your answer in the first sentence.", tries: 2, measure: "fillers" } },
          // Again, on another kind of question
          { id: "sf-point-2", title: "Point first, again", learn: { headline: "Pick a side, even a small one.", body: "“It depends” is a way of not answering. Choose the side you lean to, say it, and let the reasons carry the nuance." }, practice: { mode: "talk", promptId: "t011", goal: "Pick a side in your first sentence.", tries: 1, measure: "fillers" } },
          // A third go
          { id: "sf-point-3", title: "Out of the blue", learn: { headline: "Your first sentence is the headline.", body: "If someone heard only your first sentence, would they know your answer? Aim for yes." }, practice: { mode: "talk", promptId: "t012", goal: "Make your first sentence the whole answer in short.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 3
      {
        id: "pre",
        title: "Point, reason, example",
        blurb: "Three beats that fill a minute.",
        parts: [
          // The three beats
          { id: "sf-pre-1", title: "Three beats", learn: { headline: "Point, reason, example.", body: "Say what you think, say why, then give one example from your own life. Three beats are enough for a minute, and they keep you from wandering." }, see: { model: { question: "What would you name a boat?", answer: "Second Wind. Boats are for people who finally have time again. My uncle bought his the year he retired and called it exactly that.", highlight: "Second Wind.", notice: "Point, then a reason, then one real example." } }, practice: { mode: "talk", promptId: "t008", goal: "Point, then a reason, then one example.", tries: 2, measure: "length" } },
          // A full minute
          { id: "sf-pre-2", title: "Make it a minute", learn: { headline: "An example buys you time.", body: "When you run dry, tell the example in more detail: where you were, who was there, what happened." }, practice: { mode: "talk", promptId: "t009", goal: "Keep going to a minute with one detailed example.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 4
      {
        id: "land",
        title: "Land it",
        blurb: "End on your point, then stop.",
        parts: [
          // End on purpose
          { id: "sf-land-1", title: "End on purpose", learn: { headline: "Finish where you started.", body: "Say your point once more in a few words, then stop. Trailing off with “so, yeah” undoes a good answer.", instead: "“…so yeah, I don’t know, that’s kind of it.”", tryThis: "“So: crisps. Every time.”" }, practice: { mode: "talk", promptId: "t010", goal: "Say your point again at the end, then stop.", tries: 2, measure: "fillers" } },
          // Then stop
          { id: "sf-land-2", title: "Then stop", learn: { headline: "Silence after the end is fine.", body: "Once you have said your last line, stop talking. Let the silence mark the end." }, practice: { mode: "talk", promptId: "t005", goal: "Stop cleanly after your last line.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 5
      {
        id: "run",
        title: "The run",
        blurb: "Everything at once, twice in a row.",
        parts: [
          // Two in a row
          { id: "sf-run-1", title: "Two in a row", learn: { headline: "Breathe, point, reason, example, land.", body: "Put the four lessons together on a new topic, then do it again straight away." }, practice: { mode: "talk", promptId: "t007", goal: "Breathe, point first, one example, then land it.", tries: 2, measure: "fillers" } },
        ],
      },
    ],
  },
];
