// The people to talk with (decision 83): four characters for short spoken conversations, each with a bank of lines recorded once in their own voice. During a conversation the coach picks which line comes next from what you said; without the coach, each follows a set script

// Load the small-talk unit type
import type { UnitId } from "@/content/smallTalk";

// What a line is for
export type ConversationLineKind = "opening" | "listening" | "reaction" | "share" | "short" | "question" | "turn" | "goodbye";

// One line a character can say, recorded in their voice
export interface ConversationLine {
  // Stable id, also the id of its recording
  id: string;
  // What it is for
  kind: ConversationLineKind;
  // The words
  text: string;
}

// Someone to talk with
export interface ConversationCharacter {
  // Stable id (the session's prompt id)
  id: string;
  // Their name
  name: string;
  // Who they are to you, in a few words
  role: string;
  // Where you are and what is going on, shown before you start
  scene: string;
  // The small-talk unit the conversation practises
  unit: UnitId;
  // What to practise, in one line
  practise: string;
  // How they behave, for the coach choosing their lines
  direction: string;
  // Their line for when they did not catch what you said
  again: string;
  // The order their lines come in when the coach cannot choose: each step is one or two lines
  script: ReadonlyArray<ReadonlyArray<string>>;
  // Every line they can say
  lines: ReadonlyArray<ConversationLine>;
}

// Every character, in the order the units come
export const CHARACTERS: ReadonlyArray<ConversationCharacter> = [
  // A new coworker at a party: answering
  {
    // Id
    id: "maya",
    // Name
    name: "Maya",
    // Who
    role: "A new coworker at a party",
    // The scene
    scene: "Maya joined your team two weeks ago. You’re both at the office party, by the snacks.",
    // Answering
    unit: "answering",
    // What to practise
    practise: "Answer with one moment, a detail worth asking about, how it felt, and a question back.",
    // How Maya behaves
    direction: "Maya is friendly and curious. She mostly asks the person about their life and reacts warmly, so they practise answering: one moment, a detail someone could ask about (a hook), how it felt, and a question back. After a flat answer (\"good\", \"not much\"), she asks a gentle follow-up (maya-13 or maya-14). When they ask her something, she answers with a share line that fits, then often hands back with a question. She shares about her move, her running club, her cat Biscuit and her taco hunt, a piece at a time.",
    // When they did not catch what you said
    again: "maya-36",
    // Without the coach: about her, then a question, in turn
    script: [["maya-24", "maya-07"], ["maya-13"], ["maya-26", "maya-34"], ["maya-27", "maya-09"], ["maya-29", "maya-12"], ["maya-32", "maya-35"]],
    // Her lines
    lines: [
    // How it starts
    { id: "maya-01", kind: "opening", text: "Hi! I don't think we've properly met. I'm Maya, I just joined your team." },
    // How it starts
    { id: "maya-02", kind: "opening", text: "Oh, hey! You're on my team, right? I'm Maya. I'm still learning everyone's names." },
    // A listening sound, played straight away while the reply is chosen
    { id: "maya-03", kind: "listening", text: "Mm-hmm." },
    // A listening sound, played straight away while the reply is chosen
    { id: "maya-04", kind: "listening", text: "Yeah?" },
    // A listening sound, played straight away while the reply is chosen
    { id: "maya-05", kind: "listening", text: "Right." },
    // A listening sound, played straight away while the reply is chosen
    { id: "maya-06", kind: "listening", text: "Oh?" },
    // A question for you
    { id: "maya-07", kind: "question", text: "So how was your weekend?" },
    // A question for you
    { id: "maya-08", kind: "question", text: "How long have you been on the team?" },
    // A question for you
    { id: "maya-09", kind: "question", text: "What do you get up to outside work?" },
    // A question for you
    { id: "maya-10", kind: "question", text: "Been anywhere good lately?" },
    // A question for you
    { id: "maya-11", kind: "question", text: "Okay, honestly, what's the best thing about working here?" },
    // A question for you
    { id: "maya-12", kind: "question", text: "So what's keeping you busy these days?" },
    // A question for you
    { id: "maya-13", kind: "question", text: "Ooh. And how was it?" },
    // A question for you
    { id: "maya-14", kind: "question", text: "Come on, there must be one good bit. What was the best part?" },
    // A question for you
    { id: "maya-15", kind: "question", text: "Wait, how did you get into that?" },
    // A reaction
    { id: "maya-16", kind: "reaction", text: "No way!" },
    // A reaction
    { id: "maya-17", kind: "reaction", text: "Oh, that sounds amazing." },
    // A reaction
    { id: "maya-18", kind: "reaction", text: "Ha! I love that." },
    // A reaction
    { id: "maya-19", kind: "reaction", text: "Oh no, that sounds rough." },
    // A reaction
    { id: "maya-20", kind: "reaction", text: "Wait, really?" },
    // A reaction
    { id: "maya-21", kind: "reaction", text: "That's so cool." },
    // A reaction
    { id: "maya-22", kind: "reaction", text: "Okay, fair enough." },
    // A reaction
    { id: "maya-23", kind: "reaction", text: "Oh nice, I've always wanted to try that." },
    // Something about themselves
    { id: "maya-24", kind: "share", text: "I moved here from Denver about a month ago, so everything's still new." },
    // Something about themselves
    { id: "maya-25", kind: "share", text: "Honestly, the hardest part has been finding good coffee near the office." },
    // Something about themselves
    { id: "maya-26", kind: "share", text: "My weekend? I finally unpacked the last box. It only took me four weeks." },
    // Something about themselves
    { id: "maya-27", kind: "share", text: "I joined a running club on Saturday mornings. Mostly so I'd meet people, if I'm honest." },
    // Something about themselves
    { id: "maya-28", kind: "share", text: "I'm always the one at the back, chatting instead of running." },
    // Something about themselves
    { id: "maya-29", kind: "share", text: "I have a cat called Biscuit who yells at me at five every morning." },
    // Something about themselves
    { id: "maya-30", kind: "share", text: "Biscuit figured out how to open the cupboard last week. I came home to cereal everywhere." },
    // Something about themselves
    { id: "maya-31", kind: "share", text: "I used to work at a tiny startup, so a big team is a bit of a change." },
    // Something about themselves
    { id: "maya-32", kind: "share", text: "I'm trying every taco place within walking distance. I'm on number six." },
    // Something about themselves
    { id: "maya-33", kind: "share", text: "My sister visits next weekend, so I need somewhere fun to take her." },
    // Handing back, moving on, or asking again
    { id: "maya-34", kind: "turn", text: "What about you?" },
    // Handing back, moving on, or asking again
    { id: "maya-35", kind: "turn", text: "Anyway, enough about me. How's your week been?" },
    // Handing back, moving on, or asking again
    { id: "maya-36", kind: "turn", text: "Sorry, I didn't quite catch that. It's so loud in here!" },
    // A goodbye
    { id: "maya-37", kind: "goodbye", text: "Oh, I think they're starting the toast. It was really nice to talk to you!" },
    // A goodbye
    { id: "maya-38", kind: "goodbye", text: "I'm going to grab another drink, but let's get lunch this week. Great chatting!" },
    ],
  },
  // Someone quiet at work: asking
  {
    // Id
    id: "theo",
    // Name
    name: "Theo",
    // Who
    role: "Someone quiet at work",
    // The scene
    scene: "Theo sits near you at work. You’re both early for a meeting, and Theo doesn’t say much unless asked.",
    // Asking
    unit: "asking",
    // What to practise
    practise: "Ask open questions, and follow up on the details Theo gives.",
    // How Theo behaves
    direction: "Theo is quiet and a little shy. To yes-or-no questions, small talk, or when the person talks mostly about themselves, he gives a short line (kind short). To an open question (what, how, why) about him, or a follow-up on something he said, he opens up with a share line: the radios first (theo-14), then the details in order. He seldom asks questions back: at most one or two, late in the conversation. The person is practising asking open questions and following up on his details.",
    // When they did not catch what you said
    again: "theo-33",
    // Without the coach: a short answer, then the radios piece by piece
    script: [["theo-09"], ["theo-14"], ["theo-15"], ["theo-16"], ["theo-17"], ["theo-21"], ["theo-30"]],
    // His lines
    lines: [
    // How it starts
    { id: "theo-01", kind: "opening", text: "Oh, hi. Are you here for the ten o'clock too?" },
    // How it starts
    { id: "theo-02", kind: "opening", text: "Hey. Looks like we're early." },
    // A listening sound, played straight away while the reply is chosen
    { id: "theo-03", kind: "listening", text: "Mm." },
    // A listening sound, played straight away while the reply is chosen
    { id: "theo-04", kind: "listening", text: "Yeah." },
    // A listening sound, played straight away while the reply is chosen
    { id: "theo-05", kind: "listening", text: "Mm-hmm." },
    // A listening sound, played straight away while the reply is chosen
    { id: "theo-06", kind: "listening", text: "Right." },
    // A short answer
    { id: "theo-07", kind: "short", text: "Yeah, it was fine." },
    // A short answer
    { id: "theo-08", kind: "short", text: "Not much, really." },
    // A short answer
    { id: "theo-09", kind: "short", text: "Pretty quiet." },
    // A short answer
    { id: "theo-10", kind: "short", text: "Yeah." },
    // A short answer
    { id: "theo-11", kind: "short", text: "Mm, it's okay." },
    // A short answer
    { id: "theo-12", kind: "short", text: "I guess." },
    // A short answer
    { id: "theo-13", kind: "short", text: "No, not really." },
    // Something about themselves
    { id: "theo-14", kind: "share", text: "Well… I fix up old radios. It's a bit of a strange hobby." },
    // Something about themselves
    { id: "theo-15", kind: "share", text: "Mostly ones from the fifties. You find them broken at flea markets for almost nothing." },
    // Something about themselves
    { id: "theo-16", kind: "share", text: "The best bit is when one crackles back to life for the first time. That sound gets me every time." },
    // Something about themselves
    { id: "theo-17", kind: "share", text: "My grandad had one in his kitchen. I think that's where it started." },
    // Something about themselves
    { id: "theo-18", kind: "share", text: "Last weekend I finished one that took me three months. It actually picks up stations now." },
    // Something about themselves
    { id: "theo-19", kind: "share", text: "I've got eleven of them. My flatmate says that's ten too many." },
    // Something about themselves
    { id: "theo-20", kind: "share", text: "Sometimes I just sit and listen to old jazz on them. It's really calming." },
    // Something about themselves
    { id: "theo-21", kind: "share", text: "There's a radio fair this weekend, two hours away. I've been looking forward to it for weeks." },
    // Something about themselves
    { id: "theo-22", kind: "share", text: "I've been here about three years. I like our corner. It's quiet." },
    // Something about themselves
    { id: "theo-23", kind: "share", text: "Honestly, I'm a bit nervous about this meeting. I have to present the numbers." },
    // A reaction
    { id: "theo-24", kind: "reaction", text: "Yeah, exactly." },
    // A reaction
    { id: "theo-25", kind: "reaction", text: "Oh, cool." },
    // A reaction
    { id: "theo-26", kind: "reaction", text: "Huh. That's interesting." },
    // A reaction
    { id: "theo-27", kind: "reaction", text: "Oh no." },
    // A reaction
    { id: "theo-28", kind: "reaction", text: "That's nice." },
    // A reaction
    { id: "theo-29", kind: "reaction", text: "Ha. Yeah." },
    // A question for you
    { id: "theo-30", kind: "question", text: "What about you? Do you have a hobby?" },
    // A question for you
    { id: "theo-31", kind: "question", text: "How long have you been here?" },
    // A question for you
    { id: "theo-32", kind: "question", text: "Are you presenting anything today?" },
    // Handing back, moving on, or asking again
    { id: "theo-33", kind: "turn", text: "Sorry, what was that?" },
    // Handing back, moving on, or asking again
    { id: "theo-34", kind: "turn", text: "Um… yeah." },
    // A goodbye
    { id: "theo-35", kind: "goodbye", text: "Oh, people are coming in. Thanks for chatting. That was nice." },
    // A goodbye
    { id: "theo-36", kind: "goodbye", text: "I should set up my laptop. Talk later?" },
    ],
  },
  // A friend having a rough week: listening
  {
    // Id
    id: "chris",
    // Name
    name: "Chris",
    // Who
    role: "A friend having a rough week",
    // The scene
    scene: "You’ve met your friend Chris for coffee. Chris looks tired.",
    // Listening
    unit: "listening",
    // What to practise
    practise: "React to what Chris tells you, say how it must feel, and stay with Chris’s story.",
    // How Chris behaves
    direction: "Chris is having a rough week and tells the story a piece at a time, in the order of the share lines: the flat, then work, then the small bright spot. Chris shares the next piece when the person reacts, asks what happened, or says how it must feel. If they name the feeling, Chris warms up (chris-21 or chris-23). If they jump to advice or move to their own story, Chris goes flat (chris-22, or chris-29 once) and shares less. Near the end Chris may ask about them (chris-26 or chris-27). The person is practising listening: react, say back the feeling, stay with Chris’s story.",
    // When they did not catch what you said
    again: "chris-28",
    // Without the coach: the story in order, then a question back
    script: [["chris-07"], ["chris-08"], ["chris-10"], ["chris-11"], ["chris-13"], ["chris-16"], ["chris-17"], ["chris-27"]],
    // Chris’s lines
    lines: [
    // How it starts
    { id: "chris-01", kind: "opening", text: "Hey. Sorry I'm late. It's been… a week." },
    // How it starts
    { id: "chris-02", kind: "opening", text: "Hi. Thanks for meeting up. I really needed this." },
    // A listening sound, played straight away while the reply is chosen
    { id: "chris-03", kind: "listening", text: "Mm." },
    // A listening sound, played straight away while the reply is chosen
    { id: "chris-04", kind: "listening", text: "Yeah." },
    // A listening sound, played straight away while the reply is chosen
    { id: "chris-05", kind: "listening", text: "Mm-hmm." },
    // A listening sound, played straight away while the reply is chosen
    { id: "chris-06", kind: "listening", text: "Right." },
    // Something about themselves
    { id: "chris-07", kind: "share", text: "My landlord's selling the flat. I found out on Monday. I've got two months to move out." },
    // Something about themselves
    { id: "chris-08", kind: "share", text: "And I really love that place. I've been there six years." },
    // Something about themselves
    { id: "chris-09", kind: "share", text: "Everything I can afford is miles from work." },
    // Something about themselves
    { id: "chris-10", kind: "share", text: "Then on Wednesday, the project I've been on all year got cancelled." },
    // Something about themselves
    { id: "chris-11", kind: "share", text: "Nobody even told us why. Just… stop, it's done." },
    // Something about themselves
    { id: "chris-12", kind: "share", text: "The worst bit is I didn't get to say goodbye to the team properly." },
    // Something about themselves
    { id: "chris-13", kind: "share", text: "I haven't been sleeping much. I keep doing sums in my head at three in the morning." },
    // Something about themselves
    { id: "chris-14", kind: "share", text: "My mum keeps sending me flat listings. Most of them are in her town." },
    // Something about themselves
    { id: "chris-15", kind: "share", text: "My boss says there might be another project. Might." },
    // Something about themselves
    { id: "chris-16", kind: "share", text: "There is one good thing, though. A friend might have a room going." },
    // Something about themselves
    { id: "chris-17", kind: "share", text: "It's near the river, with a tiny balcony. I've already planned the plants." },
    // Something about themselves
    { id: "chris-18", kind: "share", text: "I nearly cancelled today, honestly. I'm glad I didn't." },
    // A reaction
    { id: "chris-19", kind: "reaction", text: "Yeah. Exactly." },
    // A reaction
    { id: "chris-20", kind: "reaction", text: "Thanks. It really is." },
    // A reaction
    { id: "chris-21", kind: "reaction", text: "Yeah. That's exactly how it feels." },
    // A reaction
    { id: "chris-22", kind: "reaction", text: "Yeah, maybe." },
    // A reaction
    { id: "chris-23", kind: "reaction", text: "Thanks. I needed to hear that." },
    // A reaction
    { id: "chris-24", kind: "reaction", text: "It's just a lot at once, you know?" },
    // A reaction
    { id: "chris-25", kind: "reaction", text: "Honestly, it helps just saying it out loud." },
    // A question for you
    { id: "chris-26", kind: "question", text: "Anyway, how are you? I've been going on." },
    // A question for you
    { id: "chris-27", kind: "question", text: "Sorry, I've been talking about me this whole time. What's new with you?" },
    // Handing back, moving on, or asking again
    { id: "chris-28", kind: "turn", text: "Sorry, what did you say?" },
    // Handing back, moving on, or asking again
    { id: "chris-29", kind: "turn", text: "I don't think I want advice right now. I just needed to say it." },
    // A goodbye
    { id: "chris-30", kind: "goodbye", text: "I should head off. Thanks for listening. Honestly, I feel a bit better." },
    // A goodbye
    { id: "chris-31", kind: "goodbye", text: "Thanks for this. Let's do it again soon, okay?" },
    ],
  },
  // A friend with big news: news
  {
    // Id
    id: "priya",
    // Name
    name: "Priya",
    // Who
    role: "A friend with big news",
    // The scene
    scene: "You bump into Priya, an old coworker, at the station. Priya can’t stop smiling.",
    // Responding to news
    unit: "news",
    // What to practise
    practise: "React to the news, ask about the moment, and keep the focus on Priya.",
    // How Priya behaves
    direction: "Priya has big news: she got into a design programme in Copenhagen. She shares details when asked: the moment she found out, who she told, what happens next. When the person reacts warmly and asks about the moment, she lights up and shares more. If they add a downside (\"isn't it expensive?\"), give advice, or switch to their own news, she deflates (priya-19 or priya-20) and shares less. Later she admits she is a bit scared (priya-15), a chance for them to stay with her feeling. The person is practising responding to good news: a real reaction, a question about the moment, staying on her news, no buts.",
    // When they did not catch what you said
    again: "priya-25",
    // Without the coach: the moment, then what it means, then a question back
    script: [["priya-07"], ["priya-08"], ["priya-09"], ["priya-10"], ["priya-15"], ["priya-16"], ["priya-23"]],
    // Her lines
    lines: [
    // How it starts
    { id: "priya-01", kind: "opening", text: "Oh my gosh, hi! You won't believe this. I got into the design programme in Copenhagen!" },
    // How it starts
    { id: "priya-02", kind: "opening", text: "Hey! Okay, I have to tell someone. I got in! The Copenhagen programme!" },
    // A listening sound, played straight away while the reply is chosen
    { id: "priya-03", kind: "listening", text: "Mm-hmm!" },
    // A listening sound, played straight away while the reply is chosen
    { id: "priya-04", kind: "listening", text: "Yeah?" },
    // A listening sound, played straight away while the reply is chosen
    { id: "priya-05", kind: "listening", text: "I know!" },
    // A listening sound, played straight away while the reply is chosen
    { id: "priya-06", kind: "listening", text: "Right?" },
    // Something about themselves
    { id: "priya-07", kind: "share", text: "They emailed this morning while I was on the bus, and I actually screamed. Everyone stared." },
    // Something about themselves
    { id: "priya-08", kind: "share", text: "I applied last year too and didn't get in, so this feels huge." },
    // Something about themselves
    { id: "priya-09", kind: "share", text: "The first person I called was my mum. She cried. Then I cried." },
    // Something about themselves
    { id: "priya-10", kind: "share", text: "It starts in January. Two years, working on real projects with real companies." },
    // Something about themselves
    { id: "priya-11", kind: "share", text: "I've already looked at flats. Way too many flats." },
    // Something about themselves
    { id: "priya-12", kind: "share", text: "I need to learn some Danish. So far I can say thank you, and that's it." },
    // Something about themselves
    { id: "priya-13", kind: "share", text: "They said it was my portfolio that got me in. The project with the kids' library." },
    // Something about themselves
    { id: "priya-14", kind: "share", text: "I keep rereading the email to check it's real." },
    // Something about themselves
    { id: "priya-15", kind: "share", text: "Honestly, I'm also a bit scared. It's a whole new country." },
    // Something about themselves
    { id: "priya-16", kind: "share", text: "I'll miss everyone here. That part's hard." },
    // A reaction
    { id: "priya-17", kind: "reaction", text: "I know! I still can't believe it." },
    // A reaction
    { id: "priya-18", kind: "reaction", text: "Thank you! It means a lot that you're excited too." },
    // A reaction
    { id: "priya-19", kind: "reaction", text: "Oh. Yeah, I guess." },
    // A reaction
    { id: "priya-20", kind: "reaction", text: "Oh. Right. Yeah, that's nice." },
    // A reaction
    { id: "priya-21", kind: "reaction", text: "Yeah. Exactly. Thank you." },
    // A reaction
    { id: "priya-22", kind: "reaction", text: "Right?!" },
    // A question for you
    { id: "priya-23", kind: "question", text: "Anyway, what's new with you?" },
    // A question for you
    { id: "priya-24", kind: "question", text: "Have you ever lived abroad?" },
    // Handing back, moving on, or asking again
    { id: "priya-25", kind: "turn", text: "Sorry, it's so loud here. What did you say?" },
    // Handing back, moving on, or asking again
    { id: "priya-26", kind: "turn", text: "Okay, I'm talking way too much about me." },
    // A goodbye
    { id: "priya-27", kind: "goodbye", text: "Oh, that's my train! Let's celebrate properly soon, okay?" },
    // A goodbye
    { id: "priya-28", kind: "goodbye", text: "I have to run, but thank you. Seriously. That made my day." },
    ],
  },
];

// Find a character by id
export function findCharacter(id: string): ConversationCharacter | undefined {
  // Look through every character
  return CHARACTERS.find((character) => character.id === id);
}

// Find one of a character's lines by id
export function findLine(character: ConversationCharacter, id: string): ConversationLine | undefined {
  // Look through their lines
  return character.lines.find((line) => line.id === id);
}
