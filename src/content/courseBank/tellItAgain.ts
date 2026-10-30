// Tell it again, better (decision 155): the second course for telling stories, for someone with a few good stories who tells them flat or too long. Built on documents/research/storytelling-2026-10.md (retelling tightens a story and repetition is the best-supported practice method; start close to the change; the five-second moment; constructed dialogue; evaluation, the point; one goal per telling; a daily one-line note) and documents/plan-storytelling.md. Stories that land teaches the parts of a story; this course polishes a few signature stories over many tellings

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const TELL_IT_AGAIN: Course = {
  id: "tell-it-again",
  focus: "stories",
  title: "Tell it again, better",
  blurb: "Pick a few good stories and polish them, one telling at a time.",
  outcomes: ["Catch a story a day in one line, and pick your five", "Start each story close to the moment it changed", "Slow down the few seconds that matter", "Give someone one line, in words that sound like them", "End on what it meant, and tell it tighter each time"],
  draft: false,
  lessons: [
    // Lesson 1
    {
      id: "find",
      title: "Find your five",
      blurb: "A line a day, then the few worth polishing.",
      parts: [
        // A daily one-line note (Dicks's daily habit; practical)
        { id: "ta-find-1", title: "One line a day", learn: { headline: "Each evening, write one line.", body: "Stories slip away by the end of the week. Each evening, write one line about the moment from today most worth telling. Not a diary: one line. A week of lines is seven stories you’d have forgotten.", instead: "“Nothing happened today.”", tryThis: "“The bus waited for the man with the cake.”", card: "story-small-moments", link: { href: "/session?mode=moment&prompt=moment", label: "Write today’s moment" } }, practice: { mode: "story", promptId: "sp30", story: { length: "short" }, goal: "Say it in one line first, then tell it in about a minute.", tries: 1, measure: "length" } },
        // Picking a few signature stories (story bank; "five" is a starting number)
        { id: "ta-find-2", title: "Pick your five", learn: { headline: "Keep five stories you know well.", body: "You don’t need fifty stories. You need a few you can tell well, each showing something different: a mistake, a win, a change of mind, someone you admire, a funny one. Five is a good start, not a rule. Those are the ones you’ll polish.", card: "story-bank", link: { href: "/stories", label: "Open Your stories" } }, practice: { mode: "story", promptId: "sp16", story: { template: "turning-point", length: "short" }, goal: "Tell it as one of your five: about a minute, with one point.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 2
    {
      id: "close",
      title: "Start close to the change",
      blurb: "Find the moment it changed, then begin just before it.",
      parts: [
        // Find the change, start near it (Dicks; practical)
        { id: "ta-close-1", title: "Find the change first", learn: { headline: "Find the moment it changed, then start just before it.", body: "Every story turns on one moment when something changed. Find that moment first. Then move your first line as close to it as you can. Whatever comes before it is something you can probably cut.", instead: "“So we’d booked the trip months before, and the night before we left…”", tryThis: "“At the gate, the man looked up: ‘Your seat’s been given away.’”", card: "story-start-middle" }, practice: { mode: "story", promptId: "sp26", story: { focus: "middle", length: "short" }, goal: "Find your moment of change, and start one line before it.", tries: 2, measure: "length" } },
        // Open on the opposite of the ending (practical)
        { id: "ta-close-2", title: "Start on the opposite", learn: { headline: "Open on the opposite of how it ends.", body: "If you end sure, start in doubt. If you end as friends, start as strangers. The gap between your first line and your last is the story, so make the first line show the before." }, see: { model: { question: "Tell me about something that turned out better than you expected.", answer: "I was sure I’d hate the choir. I only went to keep my neighbour company. Three months later, I’m the one texting her: “Rehearsal tonight?”", highlight: "I was sure I’d hate the choir.", notice: "The first line is the opposite of the last, so the change is the story." } }, practice: { mode: "story", promptId: "sp34", story: { template: "turning-point", length: "short" }, goal: "Make your first line the opposite of your last.", tries: 1, measure: "length" } },
        // Preview the stakes, not the outcome (practical)
        { id: "ta-close-3", title: "The stakes, not the ending", learn: { headline: "Say what could go wrong. Keep how it ends.", body: "A first line that shows the stakes pulls people in. A first line that gives away the ending lets them off. Say early what could go wrong, and save how it turned out for last.", instead: "“This is the story of how I still made it to the wedding.”", tryThis: "“The wedding was at two. At one, the road was under water.”" }, practice: { mode: "story", promptId: "sp05", story: { length: "short" }, goal: "Say what was at stake in your first lines, and keep how it ended for last.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 3
    {
      id: "slow",
      title: "Slow down the moment",
      blurb: "Spend your time on the few seconds that matter.",
      parts: [
        // The five-second moment (Dicks; practical)
        { id: "ta-slow-1", title: "The five seconds", learn: { headline: "Rush the run-up. Slow down the moment.", body: "Most stories spend minutes getting there, then rush the moment itself. Flip it. Cut the run-up to a line, and spend the time you saved on the few seconds when it changed: what you saw, what you thought, what you felt.", instead: "“…and then I found out I’d got the job, and anyway, after that…”", tryThis: "“The email said, ‘We’re delighted…’ I read it three times. Then I sat down on the stairs.”", card: "story-turn" }, practice: { mode: "story", promptId: "sp28", story: { focus: "detail", length: "full" }, goal: "Cut the run-up to one line, and slow down the moment it changed.", tries: 2, measure: "length" } },
        // Slipping into the present for the key moment (Wolfson; moderate)
        { id: "ta-slow-2", title: "Slip into now", learn: { headline: "Try the present tense, just for the big moment.", body: "Good tellers often slip into the present at the key moment: “So I open the door, and there’s…”. It’s the switch that marks the moment, not a trick. If it feels natural, try it there, and only there.", instead: "“I turned the corner and I saw the sea.”", tryThis: "“I turn the corner, and there it is: the sea.”", card: "story-present-tense" }, practice: { mode: "story", promptId: "sp24", story: { length: "short" }, goal: "Tell the moment itself in the present: “I turn the corner, and…”", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 4
    {
      id: "said",
      title: "Let them speak",
      blurb: "One line in words that sound like them.",
      parts: [
        // Constructed dialogue (Tannen; moderate)
        { id: "ta-said-1", title: "Your version of their words", learn: { headline: "It doesn’t have to be word for word.", body: "Linguists found that everyday tellers give their own version of what someone said, and it pulls listeners into the scene. You don’t need the exact words. You need words that sound like them, at the moment that matters.", instead: "“He told me not to worry about it.”", tryThis: "“He just shrugged: ‘Happens to everyone. Twice, to me.’”", card: "story-dialogue" }, practice: { mode: "story", promptId: "sp20", story: { focus: "dialogue", length: "short" }, goal: "Say the advice in their words, at the moment they said it.", tries: 2, measure: "length" } },
        // The line goes at the turn (Labov's most reportable event with Tannen's dialogue; moderate)
        { id: "ta-said-2", title: "Put the line at the turn", learn: { headline: "Save their line for the moment it changed.", body: "One line of what someone said works hardest at the turn. In the set-up, it slows you down. At the moment things changed, it lets listeners hear it happen. One line, in the right place, is enough." }, practice: { mode: "story", promptId: "sp17", story: { focus: "dialogue", length: "short" }, goal: "Give the stranger one line, at the moment your day turned.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 5
    {
      id: "meant",
      title: "End on what it meant",
      blurb: "Say why it mattered. Then tell it again, tighter.",
      parts: [
        // Evaluation, the point (Labov; moderate)
        { id: "ta-meant-1", title: "Say why it mattered", learn: { headline: "The line most stories leave out.", body: "Linguists who studied spoken stories found that good ones say why they were worth telling. It’s the part most often missing. End on what’s different now (“Ever since then…”), then stop.", instead: "“…so yeah, that was that, really.”", tryThis: "“Ever since then, I ask for directions before I’m lost.”", card: "story-end-point" }, practice: { mode: "story", promptId: "sp32", story: { focus: "point", length: "short" }, goal: "End on what’s different now, then stop.", tries: 2, measure: "length" } },
        // One goal per telling (repetition and feedback research; strong)
        { id: "ta-meant-2", title: "One thing per telling", learn: { headline: "Tell it again, with one thing to fix.", body: "Telling the same story again is the best-supported way to tell it more easily. Each time, pick one thing: start closer, slow the moment, add the line, or say the point. One, not all four.", card: "story-retell" }, practice: { mode: "story", promptId: "sp35", story: { length: "short" }, goal: "Tell it twice. The second time, fix one thing and nothing else.", tries: 2, measure: "length" } },
        // Tighter, not faster; the first telling stays the record (retelling research; strong and moderate)
        { id: "ta-meant-3", title: "Tighter, not faster", learn: { headline: "Polish the telling, not the facts.", body: "Retold stories get shorter and more focused, and that’s progress, as long as the moment and the point stay. Retelling shapes your memory too, so keep your first telling as the record. Each cut is an editing choice.", card: "story-length", link: { href: "/practice/four-three-two", label: "Open the 4/3/2 drill" } }, practice: { mode: "story", promptId: "sp07", story: { length: "short" }, goal: "Tell it twice. The second time, keep the moment and the last line, and cut the rest.", tries: 2, measure: "length" } },
      ],
    },
  ],
};
