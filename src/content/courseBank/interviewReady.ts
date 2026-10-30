// Interview ready (decision 155): a second course for speaking at work, for a job interview coming up. Built on documents/research/storytelling-2026-10.md (the who-I-am and STAR answer types, saying "I", a result you can measure, evaluation as the point of a story, retelling, one goal per telling) and documents/plan-story-types.md (the "Who I am" and "Interview answer" templates and their checks)

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const INTERVIEW_READY: Course = {
  id: "interview-ready",
  focus: "work",
  title: "Interview ready",
  blurb: "Have your answer ready for “tell me about yourself” and “tell me about a time when…”.",
  outcomes: ["Answer “tell me about yourself” with one moment, linked to now", "Tell a “tell me about a time…” story as situation, task, action, result", "Say what you did, with “I” and a number", "Answer the mistake or weakness question honestly, as something you learned", "Say why you want the role, and ask a real question back"],
  draft: false,
  lessons: [
    // Lesson 1: the who-I-am story
    {
      id: "yourself",
      title: "Tell me about yourself",
      blurb: "One moment, not your CV, linked to now.",
      parts: [
        // One moment instead of a list of jobs
        { id: "ir-yourself-1", title: "One moment, not your CV", learn: { headline: "Start from one moment, not your CV.", body: "They already have your CV. Reading it out gives them nothing to hold. Pick one moment that shows what you care about, tell it in a few lines, then link it to the work you do now.", instead: "“So I did my degree, then I worked at a bank for two years, then I moved into…”", tryThis: "“At sixteen I ran the till in my aunt’s café, and I loved fixing the queue. I still do: I plan deliveries now.”", card: "story-one-thing" }, practice: { mode: "story", promptId: "sp41", story: { template: "who-i-am", length: "short" }, goal: "Start from one moment, then link it to what you do now.", tries: 2, measure: "length" } },
        // What the moment showed, and how it leads to now
        { id: "ir-yourself-2", title: "Link it to now", learn: { headline: "Say what it showed you. Then bring it to now.", body: "A moment matters only if it leads somewhere. Say in one line what it showed you about yourself, then where that shows up in your work today. That last line is your bridge into the rest of the interview.", card: "story-end-point" }, see: { model: { question: "Tell me about yourself.", answer: "When I was twelve, our street flooded, and I spent a week helping my dad work out which neighbours needed what. I found I liked turning a mess into a list. That’s still my job: I run projects, and I’m happiest when a messy one starts to make sense.", highlight: "I found I liked turning a mess into a list.", notice: "One moment, one line on what it showed, then straight to now." } }, practice: { mode: "story", promptId: "sp42", story: { template: "who-i-am", length: "short" }, goal: "Say what the moment showed you, then how it shows up in your work now.", tries: 1, measure: "length" } },
        // Short enough to leave room for questions
        { id: "ir-yourself-3", title: "Two minutes, then stop", learn: { headline: "Under two minutes, then stop.", body: "A who-I-am answer is one memory, not your whole life. Trying to fit everything in helps nobody. Aim for a minute or two, end on now, and let their next question do the rest.", card: "story-length" }, practice: { mode: "story", promptId: "sp44", story: { template: "who-i-am", length: "short" }, goal: "Tell it in under two minutes, end on now, then stop.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 2: the STAR answer
    {
      id: "star",
      title: "The STAR answer",
      blurb: "Situation, task, action, result, with most of the time on the last two.",
      parts: [
        // The four beats
        { id: "ir-star-1", title: "Situation, task, action, result", learn: { headline: "Situation, task, action, result.", body: "“Tell me about a time when…” wants a short story in four beats. Set the scene in a line, say what your job was, then say what you did and how it turned out. Most of the time goes on the last two.", instead: "“It was a really busy time, and there was a lot going on, and the whole team was under pressure, and…”", tryThis: "“We had 400 open tickets. My job was to clear them. I sorted them by cause and fixed the top three. Two weeks later: under 50.”" }, practice: { mode: "story", promptId: "sp47", story: { template: "interview", length: "short" }, goal: "Situation, task, action, result, in that order.", tries: 2, measure: "length" } },
        // A short set-up, a long middle
        { id: "ir-star-2", title: "Short set-up, long action", learn: { headline: "One line of set-up. Most of it on what you did.", body: "The usual slip is a long situation and a rushed ending. Give the background in a sentence or two. Then slow down for your steps, one by one, and the result." }, see: { model: { question: "Tell me about a time you had to learn something quickly.", answer: "Our booking system changed on a Friday, and I was on the front desk alone on Monday. Over the weekend I worked through the guide, practised ten bookings on the test version, and wrote the five steps I kept forgetting on one card. On Monday I took 60 bookings, and the card is now pinned by every desk.", highlight: "Over the weekend I worked through the guide, practised ten bookings on the test version, and wrote the five steps I kept forgetting on one card.", notice: "One sentence of situation; most of the answer is what I did, step by step." } }, practice: { mode: "story", promptId: "sp49", story: { template: "interview", length: "short" }, goal: "Set the scene in two sentences at most, then spend most of your time on what you did.", tries: 1, measure: "length" } },
        // A few stories, told again
        { id: "ir-star-3", title: "Keep a few stories ready", learn: { headline: "Five stories answer most questions.", body: "Most “tell me about a time…” questions can be answered from five or six stories you know well: a problem, a mistake, a disagreement, a time you led. Tell each one out loud before the day. A story told again comes out tighter.", card: "story-bank", link: { href: "/stories", label: "Find more interview questions in Stories" } }, practice: { mode: "story", promptId: "sp52", story: { template: "interview", length: "short" }, goal: "Tell it twice. Make the second telling tighter.", tries: 2, measure: "length" } },
      ],
    },
    // Lesson 3: owning what you did
    {
      id: "own",
      title: "Own it",
      blurb: "Say “I”, not only “we”, and give a number.",
      parts: [
        // "I" as well as "we"
        { id: "ir-own-1", title: "Say “I”", learn: { headline: "Say “I”, not only “we”.", body: "They are hiring you, not your team. Give the team its credit in a line, then say what you did yourself. If every sentence starts with “we”, they can’t tell which part was yours.", instead: "“We looked at the numbers and we decided to change the rota.”", tryThis: "“The team agreed something had to change. I pulled the numbers and wrote the new rota.”" }, practice: { mode: "story", promptId: "sp51", story: { template: "interview", length: "short" }, goal: "Say “I” at least as often as “we”.", tries: 2, measure: "length" } },
        // A result you can count
        { id: "ir-own-2", title: "Give it a number", learn: { headline: "Give a result they can count.", body: "“It went well” slides past. “We cut it from twelve days to four” sticks. A number, a time saved or how many people it helped makes the result real. No exact figure? Give an honest rough one.", instead: "“And in the end it went really well.”", tryThis: "“In the end, sign-ups went from about 20 a week to 70.”", card: "point-concrete" }, practice: { mode: "response", promptId: "p017", goal: "End with a result you can count: a number, a time, or how many people.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 4: the mistake or weakness question
    {
      id: "hard",
      title: "The hard one",
      blurb: "A real mistake, told as what you learned.",
      parts: [
        // A real mistake, with most of the time on the fix
        { id: "ir-hard-1", title: "A real one", learn: { headline: "Pick a real mistake. Spend most of it on the fix.", body: "“Tell me about a mistake” checks two things: are you honest, and do you learn? Pick a real one, small enough to tell calmly. Say it in a line, then spend the rest on what you did about it. Owning a mistake usually lands better than you fear.", instead: "“My biggest weakness? I’m probably too much of a perfectionist.”", tryThis: "“I used to say yes to everything, and I missed a deadline. Now I check my week before I agree to more.”", card: "story-vulnerable" }, practice: { mode: "story", promptId: "sp50", story: { template: "interview", length: "short" }, goal: "Say the mistake in one line, then spend most of it on what you did about it.", tries: 2, measure: "length" } },
        // The lesson as the last line
        { id: "ir-hard-2", title: "End on what you’d keep", learn: { headline: "End on what you do differently now.", body: "The last line of an interview answer is what you learned, or what you’d keep doing. It’s the line that says why the story mattered. Without it, they’re left asking “so what?”", card: "story-end-point" }, see: { model: { question: "What’s one of your weaknesses?", answer: "I used to agree to everything. Last spring that meant I missed a deadline I’d promised a colleague. Since then, I check my week before I say yes, and I give a date I can keep. I haven’t missed one since.", highlight: "Since then, I check my week before I say yes", notice: "The weakness takes one line; the answer ends on what changed." } }, practice: { mode: "response", promptId: "p051", goal: "End on what you do differently now, in one line.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 5: why this role, a question back, and the run
    {
      id: "close",
      title: "Your close",
      blurb: "Why this role, a question back, and the run.",
      parts: [
        // Why you want it, linked to a moment
        { id: "ir-close-1", title: "Why this role", learn: { headline: "Why this job? One reason that’s yours.", body: "Listeners want to know who you are and why you’re here before they weigh your answers. “Why this role?” is the second half. Name one thing about the job that matches something you care about, and bring back a moment as proof." }, practice: { mode: "story", promptId: "sp43", story: { template: "who-i-am", length: "short" }, goal: "Tell where it started, then link it to the kind of work you want next.", tries: 1, measure: "length" } },
        // A real question at the end
        { id: "ir-close-2", title: "A question back", learn: { headline: "Have one real question ready.", body: "“Any questions for us?” is still part of the interview. Ask about something only they can answer: what a good first three months looks like, or what the team is stuck on. Then listen to the answer.", instead: "“No, I think you’ve covered everything.”", tryThis: "“What would a really good first three months look like in this role?”" } },
        // Everything together, twice
        { id: "ir-close-3", title: "The run", learn: { headline: "STAR, “I”, a number, and what you’d keep.", body: "Put it together on a new question, then tell it again straight away. The second telling is usually the better one: notice what got shorter.", card: "story-retell" }, practice: { mode: "story", promptId: "sp48", story: { template: "interview", length: "full" }, goal: "Situation, task, action, result, with “I” and a number, then what you’d keep.", tries: 2, measure: "fillers" } },
      ],
    },
  ],
};
