// Know your voice (decision 155): the second course for how you sound. It teaches reading your own measures and changing one thing at a time, built on documents/research/speech-analysis-2026-10.md (pauses and speed predict how fluent you sound, and mid-sentence pauses matter most, Bosker et al. 2013; "uh" and "um" are signals, Clark & Fox Tree 2002; pitch variety and charisma, Rosenberg & Hirschberg 2005 and Niebuhr et al. 2016; louder, more varied delivery reads as confident, Van Zant & Berger; one take is noise, compare with your own takes) and on what the app shows (documents/architecture/measurements.md; decisions 81, 103 and 111). Every part practises on a reading, a pause drill or a lesson, so tries compare like with like

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const KNOW_YOUR_VOICE: Course = {
  id: "know-your-voice",
  focus: "voice",
  title: "Know your voice",
  blurb: "Read what your recordings say, then change one thing at a time.",
  outcomes: ["Find where your pauses fall, and move them between ideas", "Read your two pace numbers, and slow down for the line that matters", "Read your pitch range and how your statements ended", "Use volume with variety, and keep it to the last line", "Change one thing at a time, and tell a real change from noise"],
  draft: false,
  lessons: [
    // Lesson 1
    {
      id: "pauses",
      title: "Where your pauses fall",
      blurb: "Between ideas, not inside them.",
      parts: [
        // Pause placement, the best-evidenced number
        { id: "kv-pauses-1", title: "Pauses mid-sentence", learn: { headline: "Check where you paused, not how often.", body: "Listeners judge how fluent you sound mostly by your pauses and your speed. A pause between sentences sounds like thinking; one inside a sentence sounds like searching. After a take, open “See all measures for this take” and find Pauses mid-sentence. Lower is smoother.", instead: "“I went to the… shop, and… bought some bread.”", tryThis: "“I went to the shop and bought some bread. (a pause) Then…”", card: "profile-pause-place" }, practice: { mode: "read", promptId: "r002", goal: "Pause only at the commas and full stops, then check Pauses mid-sentence.", tries: 1, measure: "pace" } },
        // Pause words as signals
        { id: "kv-pauses-2", title: "“Um” is a signal", learn: { headline: "“Um” is a signal, not a slip.", body: "“Uh” tells listeners a short delay is coming, and “um” a longer one. A few are normal, and the evidence that they hurt is mixed. Treat Pause words as a habit to watch, not a score. If you swap one for silence, swap the one in the middle of a sentence.", card: "nerves-um" }, practice: { mode: "pause", promptId: "d004", goal: "A silent pause at each mark, with no “um” inside it.", tries: 1, measure: "fillers" } },
        // Longer runs between pauses
        { id: "kv-pauses-3", title: "Words per run", learn: { headline: "Longer runs sound smoother.", body: "Words per run counts the words you say between pauses. When it’s low, your sentences are coming out in pieces. Plan the next phrase in the gap, then say it in one go: fewer, better-placed pauses, with longer runs between them." }, practice: { mode: "pause", promptId: "d002", goal: "Say each piece between the marks in one go, with no stop inside it.", tries: 2, measure: "pace" } },
      ],
    },
    // Lesson 2
    {
      id: "pace",
      title: "Your pace",
      blurb: "Fast is fine. Slow the line that matters.",
      parts: [
        // The two pace numbers
        { id: "kv-pace-1", title: "Two paces", learn: { headline: "You have two paces. Read both.", body: "Overall pace counts your words a minute with the pauses in. Pace while talking leaves the pauses out. If the first is slow and the second quick, you’re not a slow speaker: you pause a lot. If both are high, you talk fast and rarely stop." }, practice: { mode: "read", promptId: "r017", goal: "Read at your own speed, then compare your two pace numbers.", tries: 1, measure: "pace" } },
        // Brisk is fine; slow the key line
        { id: "kv-pace-2", title: "Slow the key line", learn: { headline: "Brisk is fine. Rushed is not.", body: "When recordings were sped up, listeners rated the speaker as more capable, but warmth dropped when it got too fast. So there’s no right number to hit. Keep a lively pace, and give your one key line more room.", instead: "Every line at the same quick speed", tryThis: "Brisk, then slower for the line you want remembered", card: "voice-pace" }, practice: { mode: "read", promptId: "r023", goal: "Slow down for “We choose to go to the moon”, and let the rest move.", tries: 2, measure: "pace" } },
      ],
    },
    // Lesson 3
    {
      id: "pitch",
      title: "Your pitch range",
      blurb: "Variety, and endings that fall.",
      parts: [
        // Range in steps
        { id: "kv-pitch-1", title: "Your range in steps", learn: { headline: "Your range shows how much your voice moved.", body: "Listeners rate speakers with more pitch variety as more charismatic. The app measures your range in steps, from your lower notes to your higher ones, and sets it beside your own usual range. Under three steps reads as fairly flat. Lift the key word in each sentence and watch the number.", card: "charisma-voice" }, practice: { mode: "read", promptId: "r020", goal: "Lift the word that matters in each sentence, then read your range in steps.", tries: 1, measure: "pace" } },
        // Peaks in the words
        { id: "kv-pitch-2", title: "Where your peaks land", learn: { headline: "Look at which words are bold.", body: "Your take shows your pitch in the words themselves, with each peak in bold. Range alone can mislead: a voice can move a lot and still peak in the wrong places. Check that your peaks sit on the words that matter, not on the first word of every line." }, practice: { mode: "lesson", promptId: "l013", goal: "Your peaks land on the bridges and the key words.", tries: 2, measure: "pace" } },
        // How phrases ended
        { id: "kv-pitch-3", title: "Count your endings", learn: { headline: "Count how your statements ended.", body: "Under your words, each phrase is marked as falling, holding or rising at the end. A rise isn’t a fault: it can invite a reply. But on a statement it can sound unsure, so the things you mean should mostly fall.", card: "voice-uptalk" }, practice: { mode: "read", promptId: "r019", goal: "Let each statement fall, then count the phrases that ended low.", tries: 2, measure: "pace" } },
      ],
    },
    // Lesson 4
    {
      id: "energy",
      title: "Your energy",
      blurb: "Louder, with variety, reads as sure.",
      parts: [
        // Volume with variety
        { id: "kv-energy-1", title: "Volume with variety", learn: { headline: "Louder, with variety, sounds sure.", body: "When people tried to persuade, they got louder and varied their volume, and listeners heard confidence. The key is variety, not shouting. If your take says your volume stayed very even, drop quieter for one line and lift for your main point.", card: "voice-project" }, practice: { mode: "read", promptId: "r013", goal: "Lift for the key lines and drop quieter for one, then read your volume lines.", tries: 1, measure: "pace" } },
        // Energy to the end
        { id: "kv-energy-2", title: "Keep it to the end", learn: { headline: "Keep your energy to the last line.", body: "Many takes get quieter in the last third, and phrases fade on their final word, just where the meaning lands. Your take says when your volume dropped in the last third, or how many phrases faded. Save a breath for the end.", card: "skills-land-ending" }, practice: { mode: "pause", promptId: "d005", goal: "Your last line as strong as your first.", tries: 1, measure: "pace" } },
      ],
    },
    // Lesson 5
    {
      id: "compare",
      title: "Then and now",
      blurb: "Change one thing, then check it.",
      parts: [
        // One change at a time
        { id: "kv-compare-1", title: "One thing at a time", learn: { headline: "Change one thing, then check that number.", body: "Pick one measure from your last take: pace, pauses mid-sentence, pitch range or volume. Read the same text again and change only that. Change three things at once and you won’t know which one worked.", instead: "“This time: slower, louder, more pauses, livelier.”", tryThis: "“This time: pause only at the full stops.”" }, practice: { mode: "read", promptId: "r003", goal: "Choose one thing to change, and change only that on your second try.", tries: 2, measure: "pace" } },
        // Noise
        { id: "kv-compare-2", title: "Small changes are noise", learn: { headline: "Small changes are noise.", body: "Any one take mixes skill with chance: your mood, the room, the text. That’s why the check-in calls a small move “About the same”, such as less than a tenth of your pace, or a step of pitch range. Trust a change when it’s bigger than that and holds over several takes.", card: "profile-trends", link: { href: "/profile", label: "See your trends" } }, practice: { mode: "pause", promptId: "d003", goal: "Read it twice the same way, and see how far the numbers move on their own.", tries: 2, measure: "pace" } },
        // Like with like, weeks apart
        { id: "kv-compare-3", title: "Same words, weeks apart", learn: { headline: "Compare like with like.", body: "The fairest comparison is the same words, in the same room, with the same phone. Never set a reading against a talk: they’re different kinds of speech. The weekly check-in reads the same passage each week, and this part’s reading comes back in three days, side by side.", card: "voice-phone-mic", link: { href: "/check-in", label: "Open the weekly check-in" } }, practice: { mode: "read", promptId: "r012", goal: "Read it as you normally would. In three days, hear then and now.", tries: 1, measure: "pace" } },
      ],
    },
  ],
};
