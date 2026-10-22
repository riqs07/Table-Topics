// Each Learn card without its text: id, set and title (decision 99). Written by `pnpm learn-index` from src/content/learn.ts; do not edit by hand

// Load the set type
import type { LearnSetId } from "@/content/learn";

// One card in the index
export interface LearnCardSummary {
  // Stable id
  id: string;
  // Its set
  set: LearnSetId;
  // Its title, as on the card
  title: string;
}

// Every card, in the same order as LEARN_CARDS
export const LEARN_INDEX: ReadonlyArray<LearnCardSummary> = [
  // nerves: nerves-show
  { id: "nerves-show", set: "nerves", title: "“Everyone can see how nervous I am.”" },
  // nerves: nerves-spotlight
  { id: "nerves-spotlight", set: "nerves", title: "Is everyone watching that closely?" },
  // nerves: nerves-excited
  { id: "nerves-excited", set: "nerves", title: "Saying “I'm excited” before a speech makes it better." },
  // nerves: nerves-um
  { id: "nerves-um", set: "nerves", title: "“Um” and “uh” are mistakes." },
  // nerves: nerves-silence
  { id: "nerves-silence", set: "nerves", title: "A pause feels much longer to you." },
  // nerves: nerves-power-pose
  { id: "nerves-power-pose", set: "nerves", title: "Standing like a superhero for two minutes boosts your confidence hormones." },
  // charisma: charisma-two-parts
  { id: "charisma-two-parts", set: "charisma", title: "What is charisma, really?" },
  // charisma: charisma-learnable
  { id: "charisma-learnable", set: "charisma", title: "Charisma can be learned." },
  // charisma: charisma-tactics
  { id: "charisma-tactics", set: "charisma", title: "Stories, contrasts and threes." },
  // charisma: charisma-voice
  { id: "charisma-voice", set: "charisma", title: "Your voice carries charisma." },
  // charisma: charisma-smile
  { id: "charisma-smile", set: "charisma", title: "Does a real smile matter?" },
  // charisma: charisma-stories
  { id: "charisma-stories", set: "charisma", title: "A story always beats facts." },
  // body: body-93
  { id: "body-93", set: "body", title: "93% of communication is non-verbal." },
  // body: body-faces
  { id: "body-faces", set: "body", title: "You can read someone's emotions from their face." },
  // body: body-lies
  { id: "body-lies", set: "body", title: "You can spot a liar from their body language." },
  // body: body-arms
  { id: "body-arms", set: "body", title: "Crossed arms mean someone is defensive." },
  // body: body-mirroring
  { id: "body-mirroring", set: "body", title: "Copying someone's body language makes them like you." },
  // body: body-eyes
  { id: "body-eyes", set: "body", title: "How much eye contact is right?" },
  // body: body-changes
  { id: "body-changes", set: "body", title: "Notice changes, not signals." },
  // body: body-first
  { id: "body-first", set: "body", title: "First impressions happen in seconds." },
  // conversation: talk-liking-gap
  { id: "talk-liking-gap", set: "conversation", title: "“I don't think they liked me.”" },
  // conversation: talk-follow-ups
  { id: "talk-follow-ups", set: "conversation", title: "What makes people like you in a conversation?" },
  // conversation: talk-free-info
  { id: "talk-free-info", set: "conversation", title: "People hand you things to ask about." },
  // conversation: talk-boomerask
  { id: "talk-boomerask", set: "conversation", title: "Asking “How was your weekend?” so you can share yours makes a good impression." },
  // conversation: talk-co-narrators
  { id: "talk-co-narrators", set: "conversation", title: "Listeners shape the story." },
  // conversation: talk-support
  { id: "talk-support", set: "conversation", title: "Support, don't shift." },
  // conversation: talk-paraphrase
  { id: "talk-paraphrase", set: "conversation", title: "Repeating back what people say makes them feel understood." },
  // conversation: talk-deeper
  { id: "talk-deeper", set: "conversation", title: "Deep talk with strangers is awkward." },
  // conversation: talk-endings
  { id: "talk-endings", set: "conversation", title: "Conversations rarely end when people want them to." },
  // conversation: talk-names
  { id: "talk-names", set: "conversation", title: "Remembering names." },
  // warmth: warm-good-news
  { id: "warm-good-news", set: "warmth", title: "What to say when someone shares good news." },
  // warmth: warm-responsive
  { id: "warm-responsive", set: "warmth", title: "What makes someone feel heard?" },
  // warmth: warm-share
  { id: "warm-share", set: "warmth", title: "To be liked, keep the focus on them and say little about yourself." },
  // warmth: warm-compliment
  { id: "warm-compliment", set: "warmth", title: "“Giving a compliment would be awkward.”" },
  // warmth: warm-thanks
  { id: "warm-thanks", set: "warmth", title: "Say thanks with a reason." },
  // warmth: warm-advice
  { id: "warm-advice", set: "warmth", title: "When a friend has a problem, the kind thing is to fix it." },
  // warmth: warm-small-talk
  { id: "warm-small-talk", set: "warmth", title: "Small talk makes you less happy." },
  // warmth: warm-fast-replies
  { id: "warm-fast-replies", set: "warmth", title: "Why some conversations click." },
  // humour: warm-funny
  { id: "warm-funny", set: "humour", title: "To be charismatic, be funny." },
  // stories: story-small-moments
  { id: "story-small-moments", set: "stories", title: "“Nothing interesting happens to me.”" },
  // stories: story-one-thing
  { id: "story-one-thing", set: "stories", title: "One thing, told well." },
  // stories: story-hook
  { id: "story-hook", set: "stories", title: "Give them a hook." },
  // practice: practise-listen-back
  { id: "practise-listen-back", set: "practice", title: "Why listen back?" },
  // practice: practise-mixing
  { id: "practise-mixing", set: "practice", title: "Why the daily practice is mixed." },
  // practice: practise-recall
  { id: "practise-recall", set: "practice", title: "Why these questions come back." },
  // practice: practise-steps
  { id: "practise-steps", set: "practice", title: "Why missions get harder slowly." },
  // practice: practise-doing
  { id: "practise-doing", set: "practice", title: "Reading about conversation skills makes you better at them." },
  // nerves: nerves-own-name
  { id: "nerves-own-name", set: "nerves", title: "Talk to yourself by name." },
  // warmth: warm-thanks-note
  { id: "warm-thanks-note", set: "warmth", title: "“A thank-you note would be awkward.”" },
  // body: body-look-away
  { id: "body-look-away", set: "body", title: "If someone looks away, they’re lying or bored." },
  // body: body-stillness
  { id: "body-stillness", set: "body", title: "A still audience is an engaged one." },
  // body: body-not-face
  { id: "body-not-face", set: "body", title: "At big moments, read the body, not the face." },
  // body: body-voice-feelings
  { id: "body-voice-feelings", set: "body", title: "You read feelings better by listening than by looking." },
  // body: body-read-room
  { id: "body-read-room", set: "body", title: "Reading the room while you speak." },
  // voice: voice-pace
  { id: "voice-pace", set: "voice", title: "Does speaking faster make you sound smarter?" },
  // voice: voice-pitch
  { id: "voice-pitch", set: "voice", title: "Lower voices are heard as leaders." },
  // voice: voice-fry-mixed
  { id: "voice-fry-mixed", set: "voice", title: "Vocal fry makes you sound less competent." },
  // voice: voice-silent-pause
  { id: "voice-silent-pause", set: "voice", title: "A silent pause helps listeners as much as “um”." },
  // voice: voice-variety
  { id: "voice-variety", set: "voice", title: "Let your voice follow the meaning." },
  // point: point-curse
  { id: "point-curse", set: "point", title: "“They’ll get what I mean.”" },
  // point: point-not-script
  { id: "point-not-script", set: "point", title: "Learn your points, not a script." },
  // point: point-prep
  { id: "point-prep", set: "point", title: "A shape for speaking on the spot." },
  // point: point-concrete
  { id: "point-concrete", set: "point", title: "One example beats a general claim." },
  // point: point-repeat-question
  { id: "point-repeat-question", set: "point", title: "In Q&A, say the question back first." },
  // minds: minds-two-sided
  { id: "minds-two-sided", set: "minds", title: "Raise the objection, then answer it." },
  // minds: minds-their-values
  { id: "minds-their-values", set: "minds", title: "Argue from their values, not yours." },
  // minds: minds-swap-stories
  { id: "minds-swap-stories", set: "minds", title: "Listen first, then swap stories." },
  // minds: minds-free-to-say-no
  { id: "minds-free-to-say-no", set: "minds", title: "“But you’re free to say no” gets more yeses." },
  // minds: minds-three-claims
  { id: "minds-three-claims", set: "minds", title: "Three reasons persuade; four make people doubt." },
  // hard: hard-disagree
  { id: "hard-disagree", set: "hard", title: "Disagree without a fight." },
  // hard: hard-apology
  { id: "hard-apology", set: "hard", title: "What makes an apology work?" },
  // hard: hard-ask-help
  { id: "hard-ask-help", set: "hard", title: "“They’ll probably say no.”" },
  // hard: hard-ask-advice
  { id: "hard-ask-advice", set: "hard", title: "Asking for advice makes you look more capable." },
  // hard: hard-humblebrag
  { id: "hard-humblebrag", set: "hard", title: "Don’t humblebrag. Just say it." },
  // stories: story-transport
  { id: "story-transport", set: "stories", title: "Why a good story pulls people along." },
  // stories: story-detail
  { id: "story-detail", set: "stories", title: "One small detail makes a story believable." },
  // stories: story-dialogue
  { id: "story-dialogue", set: "stories", title: "Say what they said." },
  // stories: story-stakes
  { id: "story-stakes", set: "stories", title: "Something has to go wrong." },
  // stories: story-but-therefore
  { id: "story-but-therefore", set: "stories", title: "“But” and “so”, not “and then”." },
  // stories: story-start-middle
  { id: "story-start-middle", set: "stories", title: "Start in the middle." },
  // stories: story-turn
  { id: "story-turn", set: "stories", title: "A story is about a change." },
  // stories: story-end-point
  { id: "story-end-point", set: "stories", title: "End on the point, then stop." },
  // stories: story-present-tense
  { id: "story-present-tense", set: "stories", title: "Telling a story in the present tense makes it more vivid." },
  // stories: story-vulnerable
  { id: "story-vulnerable", set: "stories", title: "Admitting a mistake in your story makes people like you more." },
  // stories: story-retell
  { id: "story-retell", set: "stories", title: "Tell the same story again." },
  // stories: story-bank
  { id: "story-bank", set: "stories", title: "Keep a few stories ready." },
  // stories: story-one-case
  { id: "story-one-case", set: "stories", title: "One person's story moves people more than any statistic." },
  // stories: story-length
  { id: "story-length", set: "stories", title: "How long should a story be?" },
  // voice: voice-uptalk
  { id: "voice-uptalk", set: "voice", title: "Rising at the end of a statement makes you sound unsure." },
  // voice: voice-project
  { id: "voice-project", set: "voice", title: "Louder, with variety, sounds confident." },
  // voice: voice-flat-situational
  { id: "voice-flat-situational", set: "voice", title: "Is a flat voice just how you talk?" },
  // voice: voice-phone-mic
  { id: "voice-phone-mic", set: "voice", title: "Why your phone says your voice wobbles." },
  // charisma: charisma-warmth-first
  { id: "charisma-warmth-first", set: "charisma", title: "People judge warmth before ability." },
  // charisma: charisma-gestures
  { id: "charisma-gestures", set: "charisma", title: "Let your hands help." },
  // charisma: charisma-status
  { id: "charisma-status", set: "charisma", title: "Two ways to be listened to." },
  // charisma: charisma-metaphor
  { id: "charisma-metaphor", set: "charisma", title: "Make it vivid with a comparison." },
  // words: words-plain
  { id: "words-plain", set: "words", title: "Big words make you sound smarter." },
  // words: words-concrete
  { id: "words-concrete", set: "words", title: "Words people can picture stick." },
  // words: words-name-it
  { id: "words-name-it", set: "words", title: "Name the thing, not “that”." },
  // words: words-hedges
  { id: "words-hedges", set: "words", title: "Hedges like “I think” and “probably” always make you sound weak." },
  // words: words-intensifiers
  { id: "words-intensifiers", set: "words", title: "“Really” and “very” make you sound weak." },
  // words: words-just
  { id: "words-just", set: "words", title: "Saying “just” makes women sound weak." },
  // words: words-variety
  { id: "words-variety", set: "words", title: "Varied words sound more capable." },
  // profile: profile-pause-place
  { id: "profile-pause-place", set: "profile", title: "Where you pause matters more than how often." },
  // profile: profile-fillers
  { id: "profile-fillers", set: "profile", title: "Pause words or pauses: which matters more?" },
  // profile: profile-variety
  { id: "profile-variety", set: "profile", title: "What “word variety” measures." },
  // profile: profile-clarity
  { id: "profile-clarity", set: "profile", title: "What “clarity” can and can't tell you." },
  // profile: profile-trends
  { id: "profile-trends", set: "profile", title: "Why one take tells you little." },
  // humour: humour-self
  { id: "humour-self", set: "humour", title: "Joking about yourself always makes you likeable." },
  // humour: humour-benign
  { id: "humour-benign", set: "humour", title: "What makes something funny?" },
  // humour: humour-observe
  { id: "humour-observe", set: "humour", title: "To get laughs, you need good jokes." },
  // humour: humour-callback
  { id: "humour-callback", set: "humour", title: "Bring it back later." },
  // humour: humour-backfire
  { id: "humour-backfire", set: "humour", title: "When humour backfires." },
  // work: work-speak-up
  { id: "work-speak-up", set: "work", title: "Speak up with ideas, not just problems." },
  // work: work-early
  { id: "work-early", set: "work", title: "Say something early." },
  // work: work-interrupt
  { id: "work-interrupt", set: "work", title: "Not every interruption is rude." },
  // work: work-update
  { id: "work-update", set: "work", title: "Bottom line first." },
  // work: work-video-lag
  { id: "work-video-lag", set: "work", title: "Why video calls feel awkward." },
  // work: work-camera
  { id: "work-camera", set: "work", title: "Eye contact on a video call." },
  // work: work-questions
  { id: "work-questions", set: "work", title: "Ask what only they know." },
  // skills: skills-pause-start
  { id: "skills-pause-start", set: "skills", title: "Pause before your first word." },
  // skills: skills-consonants
  { id: "skills-consonants", set: "skills", title: "Finish the ends of your words." },
  // skills: skills-numbers
  { id: "skills-numbers", set: "skills", title: "Slow down for numbers and names." },
  // skills: skills-land-ending
  { id: "skills-land-ending", set: "skills", title: "Keep your voice up to the full stop." },
  // skills: skills-stress
  { id: "skills-stress", set: "skills", title: "Lean on the word that matters." },
  // skills: skills-signpost
  { id: "skills-signpost", set: "skills", title: "Give listeners a map." },
  // skills: skills-twister
  { id: "skills-twister", set: "skills", title: "Warm up your mouth before you speak." },
  // skills: skills-close
  { id: "skills-close", set: "skills", title: "Finish without “so, yeah”." },
  // skills: skills-hook
  { id: "skills-hook", set: "skills", title: "Open with a hook, not your name." },
  // skills: skills-bridges
  { id: "skills-bridges", set: "skills", title: "Build a bridge between points." },
  // skills: skills-blank
  { id: "skills-blank", set: "skills", title: "When your mind goes blank." },
  // practice: practise-four-three-two
  { id: "practise-four-three-two", set: "practice", title: "Tell it three times, shorter each time." },
];
