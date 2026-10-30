// Toasts and tributes (decision 155): the second course for a talk coming up, for someone who has to give a toast, a leaving speech or a thank-you and dreads it. Built on documents/research/storytelling-2026-10.md (the toast type: one story showing one quality, about them, two to five minutes, then raise a glass; openings and endings; retelling), section 5 of documents/research/charisma-conversation-duolingo-2026-10.md (nerves that barely show, "I'm excited") and documents/plan-story-types.md (the toast template). Ready by the day covers talks in general; this course stays on toasts, tributes and thank-yous

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const TOASTS_AND_TRIBUTES: Course = {
  id: "toasts-and-tributes",
  focus: "talk",
  title: "Toasts and tributes",
  blurb: "A toast, a leaving speech or a thank-you: short, warm and about them.",
  outcomes: ["Pick one story that shows one thing about them", "Open on them, not on your nerves", "Keep it to a few warm minutes", "End by raising a glass, or on the thanks", "Stand up on the day with three words in your head"],
  draft: false,
  lessons: [
    // Lesson 1
    {
      id: "story",
      title: "One story, one quality",
      blurb: "Show who they are with one moment, not a list.",
      parts: [
        // One moment instead of a list of virtues
        { id: "tt-story-1", title: "One story, not a list", learn: { headline: "Don’t list their virtues. Tell one story.", body: "“Kind, funny and generous” is a list, and lists slide past. One moment with them, told well, shows the quality instead. Pick the story first; the rest of the toast follows it.", instead: "“Sam is kind, funny, generous and always there for you.”", tryThis: "“The night my car broke down, Sam drove an hour in her pyjamas to fetch me.”", card: "story-one-thing" }, practice: { mode: "story", promptId: "sp53", story: { template: "toast", length: "full" }, goal: "Tell one moment with them that shows one thing about them.", tries: 2, measure: "length" } },
        // Naming the quality the story shows
        { id: "tt-story-2", title: "Say what it shows", learn: { headline: "Then say what it shows, in a few words.", body: "After the story, name the quality it shows: “That’s Sam. She turns up.” One short line makes sure everyone takes the same thing from it. You can be in the story, but they’re the hero of it.", link: { href: "/stories/tell?prompt=gs41", label: "Practise the shape on given details: A toast to Alex" } }, see: { model: { question: "Say a few words about a family member at a celebration.", answer: "When I was nine, my uncle spent a whole Saturday teaching me to ride a bike, running behind me holding the seat. Halfway down the street I looked back, and he was miles away, waving. That’s him. He lets you think you did it yourself.", highlight: "That’s him. He lets you think you did it yourself.", notice: "One story, then one short line that names what it shows about him." } }, practice: { mode: "story", promptId: "sp58", story: { template: "toast", length: "short" }, goal: "After your story, say in one line what it shows about them.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 2
    {
      id: "open",
      title: "Open on them",
      blurb: "Your first line is about them, not your nerves.",
      parts: [
        // No apology for being nervous
        { id: "tt-open-1", title: "Not “I’m not good at this”", learn: { headline: "Open on them, not on your nerves.", body: "“I’m not much of a speaker, so bear with me” points everyone at the thing you least want them to see. Speakers think their nerves show far more than they do, so don’t announce them. Start with the person: their name, and how you know them.", instead: "“Sorry, I’m terrible at this, I’ll keep it short…”", tryThis: "“I’ve known Priya for twelve years, and she’s still the first person I call.”", card: "nerves-show" }, practice: { mode: "story", promptId: "sp55", story: { template: "toast", length: "short" }, goal: "Make your first line about them: their name and how you know them.", tries: 2, measure: "fillers" } },
        // How you know them, then straight into the story
        { id: "tt-open-2", title: "How you know them, in one line", learn: { headline: "Who you are to them, in one line. Then the story.", body: "The room wants to know why you’re the one speaking. Answer that in a sentence (“We shared a desk for six years”), then go straight to your moment. Start as close to it as you can." }, see: { model: { question: "Give a short toast at a friend’s birthday dinner.", answer: "I met Tom on our first day at college, when he lent me a pen and never asked for it back. Twenty years on, he’s still lending me things: his car, his sofa, his very good advice. To Tom.", highlight: "I met Tom on our first day at college", notice: "The first line says how they know each other, and the next is already a moment." } }, practice: { mode: "response", promptId: "p044", goal: "Say how you know them in your first line, then go straight to a moment.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 3
    {
      id: "short",
      title: "Short and sweet",
      blurb: "A few warm minutes beat a long, wandering one.",
      parts: [
        // Two or three minutes
        { id: "tt-short-1", title: "Two or three minutes", learn: { headline: "Aim for two or three minutes.", body: "Toasts and tributes usually run two to five minutes, and the short end is the safe end. One story, one line on what it shows, one raised glass: that fits in three. If it runs long, cut a story, never the ending.", card: "story-length" }, practice: { mode: "story", promptId: "sp54", story: { template: "toast", length: "full" }, goal: "Keep it under three minutes: one story, one line, the end.", tries: 2, measure: "length" } },
        // Cutting what isn't about them
        { id: "tt-short-2", title: "Keep it about them", learn: { headline: "Cut what isn’t about them.", body: "Long toasts drift: the background, your own news, a second and a third story. For each part, ask whether it shows who they are. If it doesn’t, it goes, however much you like it.", instead: "“So I’d just moved to the city, and I was having a terrible year, and work was…”", tryThis: "“On Jo’s first day, she fixed the kettle nobody else could.”", link: { href: "/stories/tell?prompt=gs42", label: "Practise on given details: Jo’s leaving drinks" } } },
      ],
    },
    // Lesson 4
    {
      id: "glass",
      title: "Raise the glass",
      blurb: "End on them, then the toast, then stop.",
      parts: [
        // The raised glass as the ending
        { id: "tt-glass-1", title: "End with the glass", learn: { headline: "Finish by raising your glass to them.", body: "A toast has the cleanest ending there is. Say what the story shows, ask everyone to raise their glasses, and say their name. Then stop: no “anyway, that’s it”.", instead: "“…so yeah, anyway, that’s about it, cheers I guess.”", tryThis: "“So please raise your glasses. To the team!”", card: "skills-close" }, practice: { mode: "story", promptId: "sp57", story: { template: "toast", length: "short" }, goal: "End by asking everyone to raise a glass, say who to, then stop.", tries: 2, measure: "fillers" } },
        // A thank-you ends on what changed
        { id: "tt-glass-2", title: "A thank-you ends on the thanks", learn: { headline: "End on what changed, then “thank you”.", body: "Not every tribute has a glass. For a thank-you, end on what is different because of them, then say thank you, plainly, to them. It’s the line they’ll keep.", card: "story-end-point" }, see: { model: { question: "Thank someone who helped you more than they know.", answer: "When I started, I was sure I’d be found out within a week. You sat with me every Friday for a month, and never once made me feel slow. I’m still here, and I still do Fridays your way. Thank you.", highlight: "I still do Fridays your way. Thank you.", notice: "It ends on what is different because of them, then a plain thank-you." } }, practice: { mode: "story", promptId: "sp56", story: { template: "toast", length: "short" }, goal: "End on what changed because of them, then say thank you.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 5
    {
      id: "day",
      title: "On the day",
      blurb: "Call it excitement, and carry three words.",
      parts: [
        // Nerves named as excitement
        { id: "tt-day-1", title: "Call it excitement", learn: { headline: "Racing heart? Call it excitement.", body: "Nerves and excitement feel much the same in the body. In studies, saying “I’m excited” out loud, instead of telling yourself to calm down, helped people feel more excited. It didn’t change how their speeches were rated, so treat it as a way to feel better, not a trick.", instead: "“Calm down. Calm down.”", tryThis: "“I’m excited.”", card: "nerves-excited" }, practice: { mode: "response", promptId: "p045", goal: "Say “I’m excited” out loud first, then give your thank-you.", tries: 1, measure: "fillers" } },
        // Three cue words, said out loud a few times
        { id: "tt-day-2", title: "Three words, out loud", learn: { headline: "Carry three words, not a script.", body: "A toast read from a page sounds read. Shrink yours to three words, one for each beat: their name, the story, the glass. Then say it out loud a few times before the day; each telling comes out shorter and easier.", card: "story-retell" }, practice: { mode: "response", promptId: "p046", goal: "Pick three words (them, the story, the glass) and give it from those alone.", tries: 2, measure: "fillers" } },
      ],
    },
  ],
};
