// Active listening (decision 150): one of the four people tells a story once; you answer out loud, and the phone shows which details you caught and whether you heard what mattered. The plan is in documents/plan-scenes-and-listening.md

// How hard a story is: 1 short with a replay, 2 longer and heard once, 3 what matters is not said outright
export type ListenLevel = 1 | 2 | 3;

// The levels' names and what each asks, as shown
export const LEVELS: Readonly<Record<ListenLevel, { name: string; about: string }>> = {
  // Short and clear
  1: { name: "Level 1", about: "Short stories with clear details. You can hear each one twice." },
  // Longer
  2: { name: "Level 2", about: "Longer stories with more details, heard once." },
  // Between the lines
  3: { name: "Level 3", about: "What matters isn't said outright. Listen for how they say it." },
};

// A detail in the story: where it is (for marking it in the words) and the words in a reply that count as picking it up
export interface ListenDetail {
  // The words in the story to mark, exactly as written there
  phrase: string;
  // Words or phrases in a reply that show it was heard (a single word matches by its first five letters; numbers come as digits and words)
  match: ReadonlyArray<string>;
}

// One line said in reply to your answer, recorded in their voice
export interface ListenLine {
  // Stable id, also the id of its recording
  id: string;
  // The words
  text: string;
  // How it was read (an ElevenLabs audio tag), kept out of the words
  tag: string;
}

// One story
export interface ListenStory {
  // Stable id, also the id of the story's recording
  id: string;
  // A short name, shown only after the story
  title: string;
  // Who tells it (a persona id from conversations.ts)
  personaId: string;
  // How hard it is
  level: ListenLevel;
  // Where you are, one line, shown before
  setting: string;
  // The story, as recorded
  text: string;
  // How it was read (an ElevenLabs audio tag)
  tag: string;
  // The details worth picking up
  details: ReadonlyArray<ListenDetail>;
  // What matters most to them: the part a good question goes to
  core: ListenDetail & { why: string };
  // Words that name how it felt for them, beyond the general feeling words the phone knows
  feelings: ReadonlyArray<string>;
  // One way to answer
  example: string;
  // What they say back: warm when you heard what mattered, polite otherwise
  closings: { warm: ListenLine; flat: ListenLine };
}

// A story as written, before its closings get their ids
interface WrittenStory extends Omit<ListenStory, "closings"> {
  // Each closing as [tag, words]
  closings: { warm: readonly [string, string]; flat: readonly [string, string] };
}

// The stories as written: three per level, from all four people
const WRITTEN: ReadonlyArray<WrittenStory> = [
  // Level 1, Maya: the first whole run
  {
    id: "ls-five-k",
    title: "The whole five K",
    personaId: "maya",
    level: 1,
    setting: "Monday morning. Maya leans over your desk, still glowing about Saturday.",
    tag: "[excited, proud]",
    text: "So on Saturday the running club did a five K, and I actually ran the whole thing. All of it! I came last, by about ten minutes, but the whole group waited for me at the finish and clapped. I nearly cried. Then we had pastries.",
    details: [
      { phrase: "five K", match: ["five", "5k", "5"] },
      { phrase: "came last", match: ["last"] },
      { phrase: "ten minutes", match: ["ten", "10"] },
      { phrase: "waited for me at the finish and clapped", match: ["waited", "clapped", "clap", "cheer"] },
      { phrase: "pastries", match: ["pastr"] },
    ],
    core: { phrase: "I actually ran the whole thing", match: ["whole", "all of it", "the entire", "first time", "every step", "didn't stop", "without stopping"], why: "She's the one who chats at the back. Running all of it, for the first time, is the news." },
    feelings: ["proud", "touched", "emotional", "moving", "cry", "cried", "crying"],
    example: "No way, you ran the whole thing? You came last and they all waited and clapped for you? That's amazing. How did it feel crossing the line?",
    closings: { warm: ["[delighted]", "It felt amazing. I've signed up for the next one. Don't tell anyone."], flat: ["[cheerful]", "Yeah, it was fun. Anyway!"] },
  },
  // Level 1, Priya: the first sale
  {
    id: "ls-first-sale",
    title: "The five-pound note",
    personaId: "priya",
    level: 1,
    setting: "Priya sits down next to you at lunch, waving a five-pound note.",
    tag: "[excited, talking fast]",
    text: "I was sketching in my café this morning, the one with the green door, and an old man asked if he could see. He said he used to be an architect, fifty years ago. Then he bought my drawing for five pounds. My first ever sale! I'm framing the five pound note.",
    details: [
      { phrase: "the green door", match: ["green"] },
      { phrase: "an architect", match: ["architect"] },
      { phrase: "fifty years ago", match: ["fifty", "50"] },
      { phrase: "five pounds", match: ["five", "5", "pound", "fiver"] },
      { phrase: "framing the five pound note", match: ["frame", "framing", "framed"] },
    ],
    core: { phrase: "My first ever sale!", match: ["first", "sale", "sold", "bought", "paid"], why: "A stranger, and an architect, paid for her drawing. That's what she's glowing about." },
    feelings: ["proud", "thrilled", "excited", "lovely", "chuffed", "special"],
    example: "Wow, your first ever sale, to an old architect, for five pounds! You must be so proud. What did he say about the drawing?",
    closings: { warm: ["[beaming]", "He said I had a good eye for light. I'm going to be insufferable about it all week."], flat: ["[happy]", "Yeah! Fun, right? Anyway."] },
  },
  // Level 1, Chris: the own goal
  {
    id: "ls-nine-one",
    title: "Nine one",
    personaId: "chris",
    level: 1,
    setting: "Friday. Chris walks in with a coffee and a very straight face.",
    tag: "[dry, deadpan]",
    text: "Football last night was a disaster. We lost nine one. Nine one! And I scored the one goal, but it was in our own net. The team have given me a new nickname. I'm not telling you what it is.",
    details: [
      { phrase: "nine one", match: ["nine", "9"] },
      { phrase: "in our own net", match: ["own goal", "own net", "wrong net", "wrong goal"] },
      { phrase: "Football last night", match: ["football", "match", "game"] },
    ],
    core: { phrase: "a new nickname", match: ["nickname", "name", "call you"], why: "He's dying to be asked. “I'm not telling you” is an invitation." },
    feelings: ["embarrass", "mortif", "awful", "gutted", "brutal"],
    example: "Oh no, nine one, and your only goal was in your own net? That must have been mortifying. Okay, what's the nickname?",
    closings: { warm: ["[sighs, amused]", "Fine. It's “Backwards Chris”. On the team chat. Forever."], flat: ["[dry]", "Yeah. Not my finest hour."] },
  },
  // Level 2, Theo: the radio at the flea market
  {
    id: "ls-radio",
    title: "The radio at the bottom of the box",
    personaId: "theo",
    level: 2,
    setting: "A coffee break. Theo, unusually, starts talking first.",
    tag: "[quiet, building enthusiasm]",
    text: "Last Sunday I went to the flea market by the canal, early, about seven. A man was selling a box of junk, and right at the bottom was a radio from 1956. The exact model my grandad had in his kitchen. It was cracked down one side, and the dial was missing. He wanted twenty pounds. I paid it without even haggling, which I never do. I've worked on it every evening since. Last night, for the first time, it hissed. Just a hiss. But that means it's alive.",
    details: [
      { phrase: "by the canal", match: ["canal"] },
      { phrase: "about seven", match: ["seven", "7"] },
      { phrase: "a radio from 1956", match: ["1956", "fifty six", "fifty-six", "56"] },
      { phrase: "cracked down one side, and the dial was missing", match: ["crack", "dial"] },
      { phrase: "twenty pounds", match: ["twenty", "20"] },
      { phrase: "without even haggling", match: ["haggl"] },
      { phrase: "it hissed", match: ["hiss", "hissed", "hissing"] },
    ],
    core: { phrase: "The exact model my grandad had in his kitchen.", match: ["grandad", "granddad", "grandfather", "grandpa"], why: "It's his grandad's radio, or as close as he'll get. That's why he didn't haggle." },
    feelings: ["excit", "special", "meaningful", "emotional", "nostalg", "amazing", "alive", "thrill"],
    example: "Wow, the same model your grandad had, from 1956? No wonder you didn't haggle. That must be so special. What was it like when it finally hissed?",
    closings: { warm: ["[softly, warm]", "Honestly, I just sat there grinning at a hiss. Grandad would've laughed at me."], flat: ["[brief]", "Yeah. It's a good one."] },
  },
  // Level 2, Priya: the whale
  {
    id: "ls-whale",
    title: "The whale",
    personaId: "priya",
    level: 2,
    setting: "Monday at the coffee machine. Priya has been smiling since she walked in.",
    tag: "[warm, delighted]",
    text: "The children's library opened on Saturday, the one I designed. There's a reading nook shaped like a whale, and I was so worried the kids would think it was silly. Within ten minutes there were six kids inside the whale, and one little girl refused to come out, even for cake. Her dad had to read her three books in there. Then the head librarian hugged me. I've been smiling for two days.",
    details: [
      { phrase: "the one I designed", match: ["design"] },
      { phrase: "Within ten minutes", match: ["ten", "10"] },
      { phrase: "six kids", match: ["six", "6"] },
      { phrase: "refused to come out, even for cake", match: ["cake", "refus", "come out"] },
      { phrase: "three books", match: ["three", "3"] },
      { phrase: "the head librarian hugged me", match: ["librarian", "hug", "hugged"] },
    ],
    core: { phrase: "I was so worried the kids would think it was silly.", match: ["whale", "silly", "worried", "worry"], why: "The whale was her risk. The kids loving it is what she's really telling you." },
    feelings: ["proud", "relie", "thrilled", "happy", "amazing", "wonderful"],
    example: "Oh, and you were worried they'd think the whale was silly! Six kids inside in ten minutes. You must be so proud. Whose idea was the whale?",
    closings: { warm: ["[delighted]", "Mine! I drew it on a napkin. I nearly didn't show anyone. Thank you for asking."], flat: ["[cheerful]", "Yeah, it was a good day!"] },
  },
  // Level 2, Chris: the surprise party
  {
    id: "ls-seventy",
    title: "Lost for words",
    personaId: "chris",
    level: 2,
    setting: "Chris is showing you something on his phone, then puts it away to tell you properly.",
    tag: "[warm, amused]",
    text: "It was my mum's seventieth on Sunday. My brother organised a surprise party at her favourite Italian place, and my job was getting her there without her guessing. I told her we were going to look at a new flat for me. She was so excited about the flat she was almost disappointed when everyone jumped out. Almost. Then she saw her sister had flown in from Dublin, and she just stood there holding the menu, crying. I've never seen her lost for words.",
    details: [
      { phrase: "my mum's seventieth", match: ["seventy", "70", "birthday"] },
      { phrase: "her favourite Italian place", match: ["italian"] },
      { phrase: "a new flat for me", match: ["flat"] },
      { phrase: "almost disappointed", match: ["disappoint"] },
      { phrase: "holding the menu", match: ["menu"] },
    ],
    core: { phrase: "her sister had flown in from Dublin", match: ["sister", "dublin", "aunt", "flown", "flew"], why: "The sister from Dublin is the moment. It's what made his mum cry, and what he wants you to picture." },
    feelings: ["touch", "moving", "emotional", "lovely", "sweet", "special", "cry", "cried", "crying"],
    example: "Oh wow, the flat story worked, and then her sister flew in from Dublin for her seventieth? That must have been so moving. How long since they'd seen each other?",
    closings: { warm: ["[softer]", "Three years. They didn't let go of each other all night. Best birthday she's had."], flat: ["[easy]", "Yeah. Good night, that."] },
  },
  // Level 3, Maya: the sister's visit
  {
    id: "ls-sister",
    title: "A lot planned",
    personaId: "maya",
    level: 3,
    setting: "Friday afternoon. Maya is talking quickly, as she does, but keeps fiddling with her pen.",
    tag: "[bright, then a little unsure]",
    text: "My little sister's coming to visit next weekend, her first time seeing my new place. I've planned everything. Friday night, tacos at the place with the neon cactus. Saturday morning, the running club, which she'll mock me for. Saturday night, a comedy show. The thing is, we haven't spent a whole weekend together since I moved, and the last time we really talked, we kind of argued about me leaving Denver. So, you know. I've planned a lot.",
    details: [
      { phrase: "her first time seeing my new place", match: ["first time", "new place", "flat", "apartment"] },
      { phrase: "the neon cactus", match: ["cactus", "neon", "taco", "tacos"] },
      { phrase: "the running club", match: ["running", "run"] },
      { phrase: "a comedy show", match: ["comedy"] },
    ],
    core: { phrase: "we kind of argued about me leaving Denver", match: ["argue", "argued", "argument", "arguing", "fell out", "falling out", "leaving", "denver", "properly", "the two of you", "between you"], why: "All the plans fill the time so they don't have to talk. The argument is what's on her mind." },
    feelings: ["nervous", "anxious", "worried", "pressure", "hope", "hoping", "mixed", "awkward", "tense"],
    example: "Tacos and a comedy show, that's a full weekend. It sounds like it matters a lot, after the argument about Denver. Are you nervous about seeing her?",
    closings: { warm: ["[quieter, honest]", "Nervous, honestly. I want her to see I'm happy here. Maybe I'll leave Sunday free. Just to talk."], flat: ["[bright, brushing it off]", "Yeah! It'll be fun. Busy, but fun."] },
  },
  // Level 3, Priya: the last day
  {
    id: "ls-last-day",
    title: "The card",
    personaId: "priya",
    level: 3,
    setting: "Saturday, a café. Priya is telling you about her last day at the old job, a little less brightly than usual.",
    tag: "[light, but a little flat]",
    text: "So Friday was my last day at the old job. They did drinks, which was lovely, and my manager made a speech, and everyone signed a card with a little drawing of me. Very flattering. Huge hair. And then I went home and sat on the floor of my new flat with the card for, I don't know, an hour? It's fine. The new job's on Monday. It's all very exciting.",
    details: [
      { phrase: "my manager made a speech", match: ["speech"] },
      { phrase: "a little drawing of me", match: ["drawing", "hair"] },
      { phrase: "everyone signed a card", match: ["card"] },
      { phrase: "The new job's on Monday", match: ["monday", "new job"] },
    ],
    core: { phrase: "sat on the floor of my new flat with the card for, I don't know, an hour?", match: ["floor", "hour", "miss", "missed", "missing", "sad", "hard", "leaving them", "goodbye"], why: "An hour on the floor with the card says she's sadder than “it's fine”. That's what to gently ask about." },
    feelings: ["sad", "miss", "missing", "bittersweet", "emotional", "hard", "strange", "weird", "mixed"],
    example: "An hour on the floor with the card, after the speech and everything? That sounds like a lot of feelings. It's okay if it's not all exciting. Are you going to miss them?",
    closings: { warm: ["[relieved, honest]", "So much. I think I needed someone to say that. Thank you."], flat: ["[bright, a bit forced]", "Yeah. Anyway, new chapter!"] },
  },
  // Level 3, Theo: the offer
  {
    id: "ls-new-team",
    title: "The offer",
    personaId: "theo",
    level: 3,
    setting: "Theo stops by your desk on his way back from his manager's office.",
    tag: "[quiet, even, careful]",
    text: "My manager asked if I'd like to lead the new forecasting team. It's more money, which is good, and the team's good. I'd be presenting to the directors every month. Every month. I said I'd think about it. My flatmate says it's obvious and I should say yes. He's probably right. He usually is.",
    details: [
      { phrase: "lead the new forecasting team", match: ["lead", "forecast", "team"] },
      { phrase: "more money", match: ["money", "pay", "raise"] },
      { phrase: "I said I'd think about it", match: ["think about", "thinking"] },
      { phrase: "My flatmate says it's obvious", match: ["flatmate", "roommate", "obvious"] },
    ],
    core: { phrase: "I'd be presenting to the directors every month. Every month.", match: ["present", "directors", "every month", "monthly", "speaking", "in front of"], why: "He says “every month” twice. Presenting is what's holding him back, and the flatmate's advice skips it." },
    feelings: ["nervous", "worried", "anxious", "scary", "daunting", "unsure", "mixed", "torn", "dread"],
    example: "A team to lead and more money sounds good. You said every month twice, though. It sounds daunting. How do you feel about presenting that often?",
    closings: { warm: ["[a small, surprised laugh]", "Yeah. It is. Nobody else noticed that. Maybe I'll ask if I can build up to it."], flat: ["[quiet]", "Yeah. I'll probably say yes."] },
  },
];

// The stories, each closing given its id ("ls-five-k-warm", "ls-five-k-flat"); the story's own recording has the story's id
export const LISTEN_STORIES: ReadonlyArray<ListenStory> = WRITTEN.map((story) => ({
  // Everything else as written
  ...story,
  // The two closings
  closings: { warm: { id: `${story.id}-warm`, tag: story.closings.warm[0], text: story.closings.warm[1] }, flat: { id: `${story.id}-flat`, tag: story.closings.flat[0], text: story.closings.flat[1] } },
}));

// A story by id
export function findListenStory(id: string): ListenStory | undefined {
  // The first with that id
  return LISTEN_STORIES.find((story) => story.id === id);
}

// Every recorded line of a story: the story, then its closings
export function listenLines(story: ListenStory): ListenLine[] {
  // In that order
  return [{ id: story.id, tag: story.tag, text: story.text }, story.closings.warm, story.closings.flat];
}
