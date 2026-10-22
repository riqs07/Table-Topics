// The people to talk with (decisions 83 and 84): four personas, each with a personality and a life that stay the same, who can be in any of eight situations. With the coach, each line is written for the situation and the conversation so far, so no two conversations are the same; without it, each person follows the set script recorded for their own situation

// Load the small-talk unit type
import type { UnitId } from "@/content/smallTalk";
// Load the difficulty type
import type { ConversationDifficulty } from "@/data/records";

// What a recorded line is for
export type ConversationLineKind = "opening" | "listening" | "reaction" | "share" | "short" | "question" | "turn" | "goodbye";

// One line a person can say, recorded in their voice
export interface ConversationLine {
  // Stable id, also the id of its recording
  id: string;
  // What it is for
  kind: ConversationLineKind;
  // The words
  text: string;
}

// Someone to talk with: who they are stays the same in every situation
export interface Persona {
  // Stable id (the session's prompt id)
  id: string;
  // Their name
  name: string;
  // Who they are, in a few words, for the list
  tagline: string;
  // How they talk and behave, whatever the situation (for the coach writing their lines)
  personality: string;
  // Facts about their life that never change (for the coach writing their lines)
  background: string;
  // Their ElevenLabs voice (not secret; the voice must be in the account's voices)
  voiceId: string;
  // The voice the ElevenLabs agent uses for them in a phone call, when their usual one is not allowed there (decision 142; missing means the usual one)
  liveVoiceId?: string;
  // The situation their recorded lines were written for, used when the coach cannot be reached
  home: string;
  // Their recorded line for when they did not catch what you said
  again: string;
  // The order their recorded lines come in without the coach: each step is one or two lines
  script: ReadonlyArray<ReadonlyArray<string>>;
  // Every recorded line: openings, listening sounds and the lines of their own situation
  lines: ReadonlyArray<ConversationLine>;
}

// A situation any persona can be in; "{name}" stands for the persona's name
export interface Scenario {
  // Stable id
  id: string;
  // Its name, for the page
  title: string;
  // The small-talk skill it practises
  unit: UnitId;
  // Where you are and what is going on, shown before you start
  setting: string;
  // What to practise, in one line
  practise: string;
  // How the persona behaves here, so the skill gets practised (for the coach writing their lines)
  direction: string;
  // What is going on for the persona this time, as a sentence: one is picked for each conversation, and kept from the person
  twists: ReadonlyArray<string>;
  // The persona's first line in a phone call (decision 142), where the agent speaks it before any line is written; "{name}" is their name
  opener: string;
}

// Every persona, in the order of their own situations' skills
export const PERSONAS: ReadonlyArray<Persona> = [
  // Maya: her recorded situation is the office party
  {
    // Id
    id: "maya",
    // Name
    name: "Maya",
    // Who, for the list
    tagline: "Bright and curious. Asks about you, laughs easily",
    // How she is, everywhere
    personality: "Bright, warm and curious. Talks easily, laughs often and asks lots of questions. Reacts big (\"No way!\") and shares her own life in small, funny pieces, a little self-mocking. Short, lively sentences.",
    // Her life
    background: "Moved to the city from Denver about a month ago, after working at a tiny startup; now works in marketing. Joined a Saturday-morning running club to meet people and chats at the back instead of running. Has a cat called Biscuit who yells at her at five every morning. Is trying every taco place within walking distance. Has a younger sister who visits soon.",
    // Brittney: bright, lively and conversational
    voiceId: "BBGL1mJ66fANrjWTOM5c",
    // Brittney is blocked in ElevenLabs Agents by its live moderation, so a phone call uses the stand-in "Emma" (decision 142; the user adds it to the account)
    liveVoiceId: "Mac2FKpSgaGIsaNRXt8A",
    // Her recorded situation
    home: "party",
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
  // Theo: his recorded situation is the early meeting
  {
    // Id
    id: "theo",
    // Name
    name: "Theo",
    // Who, for the list
    tagline: "Quiet and thoughtful. Opens up to good questions",
    // How he is, everywhere
    personality: "Quiet, gentle and thoughtful. Says little at first and volunteers nothing; small talk gets a few words. Warms up when someone asks a real question about something he cares about, then talks with quiet enthusiasm. Dry, understated humour. Seldom asks questions back, but means it when he does.",
    // His life
    background: "Works in the finance team and has been at the company about three years. Fixes up old radios from the fifties, bought broken at flea markets; it started with his grandad's kitchen radio. Has eleven of them, and his flatmate says that's ten too many. Listens to old jazz on them. Gets nervous about presenting.",
    // Eddy: soft-spoken and thoughtful
    voiceId: "wQe0SgyTHHi5SKbNXlNd",
    // His recorded situation
    home: "meeting",
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
  // Chris: his recorded situation is coffee with a friend
  {
    // Id
    id: "chris",
    // Name
    name: "Chris",
    // Who, for the list
    tagline: "Down-to-earth and dry. Easy-going, tired lately",
    // How he is, everywhere
    personality: "Down-to-earth, honest and a bit dry. Usually easy-going and funny, but tired lately. Talks plainly in short sentences, with the odd wry joke. Opens up when someone really listens and goes quiet when given advice too soon. Says thank you easily.",
    // His life
    background: "Has rented the same flat for six years and loves it. Works on a project team. Plays five-a-side football on Thursdays. Close to his mum, who worries about him. Grows plants on every windowsill he has.",
    // Chris: natural and down-to-earth
    voiceId: "iP95p4xoKVk53GoZ742B",
    // His recorded situation
    home: "coffee",
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
  // Priya: her recorded situation is bumping into each other at the station
  {
    // Id
    id: "priya",
    // Name
    name: "Priya",
    // Who, for the list
    tagline: "Bright and expressive. Wears her feelings openly",
    // How she is, everywhere
    personality: "Bright, energetic and expressive. Talks fast when excited, laughs a lot and wears her feelings openly. Generous and quick to say thank you; admits a worry honestly once she feels heard. Deflates noticeably when met with a \"but\".",
    // Her life
    background: "A designer; the project she is proudest of is a children's library. Very close to her mum. Loves sketching in cafés. Still has lots of friends at her old job. Can say thank you in five languages, badly.",
    // Stacey: bright, energetic and expressive
    voiceId: "lzneF1PdZ5qTfp2KKdnF",
    // Her recorded situation
    home: "station",
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

// Every situation, two for each skill; any persona can be in any of them
export const SCENARIOS: ReadonlyArray<Scenario> = [
  // Answering: they ask about your life
  {
    // Id
    id: "party",
    // Name
    title: "At the office party",
    // Answering
    unit: "answering",
    // Where
    setting: "{name} joined your team two weeks ago. You’re both at the office party, by the snacks.",
    // What to practise
    practise: "Answer with one moment, a detail worth asking about, how it felt, and a question back.",
    // How they behave
    direction: "{name} is new and wants to get to know the person, so mostly asks about their life (their weekend, their work, what they do for fun) and reacts warmly. After a flat answer (\"good\", \"not much\"), asks a gentle follow-up about one specific bit. When asked something, shares a little of their own life, then often hands back with a question.",
    // What is going on for them this time
    twists: ["{name} is still finding the way around the office.", "{name} had a funny mix-up on the first day.", "{name} is hunting for a good lunch spot nearby.", "{name} spent the weekend exploring the city."],
    // Their first line in a phone call (decision 142)
    opener: "Oh hi! I don’t think we’ve properly met. I’m {name}, I just joined the team.",
  },
  // Answering, again
  {
    // Id
    id: "monday",
    // Name
    title: "Monday at the coffee machine",
    // Answering
    unit: "answering",
    // Where
    setting: "You and {name} work on the same floor. It’s Monday morning and you’re both waiting for the coffee machine.",
    // What to practise
    practise: "Answer with one moment, a detail worth asking about, how it felt, and a question back.",
    // How they behave
    direction: "{name} is friendly and asks about the person's weekend first, then about whatever they mention, reacting to it. After a flat answer, asks about one specific bit. When asked, shares a little of their own weekend, then hands back.",
    // What is going on for them this time
    twists: ["{name} had a quiet weekend at home.", "{name} went to a wedding on Saturday.", "Something broke at {name}’s home on Sunday, and {name} spent the day fixing it.", "{name} visited family and is a bit tired from the trip."],
    // Their first line in a phone call (decision 142)
    opener: "Morning! This machine is taking forever again. Good weekend?",
  },
  // Asking: they say little unless asked well
  {
    // Id
    id: "meeting",
    // Name
    title: "Early for a meeting",
    // Asking
    unit: "asking",
    // Where
    setting: "{name} sits near you at work. You’re both early for a meeting, and {name} doesn’t say much unless asked.",
    // What to practise
    practise: "Ask open questions, and follow up on the details {name} gives.",
    // How they behave
    direction: "{name} is quiet today and volunteers little. To yes-or-no questions, small talk, or when the person talks mostly about themselves, gives a short answer of a few words. To an open question (what, how, why) about them, or a follow-up on something they just said, opens up a little more, one detail at a time. Asks at most one question back, late in the conversation.",
    // What is going on for them this time
    twists: ["{name} has a hobby that matters a lot but rarely comes up.", "{name} is planning a trip and is quietly excited about it.", "{name} is nervous about presenting in this meeting.", "{name} finished something at the weekend and is proud of it."],
    // Their first line in a phone call (decision 142)
    opener: "Oh. Hi. Looks like we’re early.",
  },
  // Asking, again
  {
    // Id
    id: "class",
    // Name
    title: "Before an evening class",
    // Asking
    unit: "asking",
    // Where
    setting: "You and {name} have both signed up for an evening cooking class and arrived early. {name} seems a bit shy here.",
    // What to practise
    practise: "Ask open questions, and follow up on the details {name} gives.",
    // How they behave
    direction: "{name} is shy among new people and volunteers little. To yes-or-no questions or small talk, gives a short answer. To an open question about them, or a follow-up on something they said, opens up a little more each time. Asks at most one question back, late on.",
    // What is going on for them this time
    twists: ["{name} signed up on a friend’s dare.", "{name} wants to learn one dish really well, to cook for someone special.", "{name} is new to the area and trying to meet people.", "{name} burned a lasagne badly last month and wants revenge."],
    // Their first line in a phone call (decision 142)
    opener: "Hi. Is this the cooking class? I think I’m a bit early.",
  },
  // Listening: something hard happened to them
  {
    // Id
    id: "coffee",
    // Name
    title: "Coffee with a friend",
    // Listening
    unit: "listening",
    // Where
    setting: "You’ve met your friend {name} for coffee. {name} looks tired.",
    // What to practise
    practise: "React to what {name} tells you, say how it must feel, and stay with {name}’s story.",
    // How they behave
    direction: "{name} is having a rough week and tells the story a piece at a time. Shares the next piece when the person reacts, asks what happened, or says how it must feel, and warms up when they name the feeling. If they jump to advice, change the subject, or move to their own story, goes a little flat, shares less, and may say they just need to get it off their chest. Near the end may mention one small bright spot and ask how the person is.",
    // What is going on for them this time
    twists: ["{name}’s landlord is selling the flat {name} loves, and a project {name} worked on all year was cancelled.", "{name}’s dog has been ill, and the vet bills keep coming.", "{name} had a falling-out with a close friend.", "{name} did not get a much-wanted job after the final interview."],
    // Their first line in a phone call (decision 142)
    opener: "Hey, thanks for meeting up. Sorry, I’m a bit tired today.",
  },
  // Listening, again
  {
    // Id
    id: "walk",
    // Name
    title: "Walking out of work",
    // Listening
    unit: "listening",
    // Where
    setting: "You and {name} leave work at the same time. {name} has had a bad day.",
    // What to practise
    practise: "React to what {name} tells you, say how it must feel, and stay with {name}’s story.",
    // How they behave
    direction: "{name} has had a bad day and tells it a piece at a time. Shares more when the person reacts, asks what happened, or says how it must feel. If they give advice too soon, change the subject, or make it about themselves, goes a little flat and shares less. Thanks the person warmly if they listened well.",
    // What is going on for them this time
    twists: ["{name}’s presentation went badly in front of the boss.", "A customer shouted at {name} over something that was not {name}’s fault.", "{name} found out the team is being reorganised.", "{name} made a mistake that cost the team a day of work."],
    // Their first line in a phone call (decision 142)
    opener: "Oh, hey. Heading home too? What a day.",
  },
  // News: they have big news
  {
    // Id
    id: "station",
    // Name
    title: "Bumping into each other",
    // News
    unit: "news",
    // Where
    setting: "You bump into {name}, an old coworker, at the station. {name} can’t stop smiling.",
    // What to practise
    practise: "React to the news, ask about the moment, and keep the focus on {name}.",
    // How they behave
    direction: "{name} has big, good news and shares it near the start. Shares details when asked: the moment they found out, who they told, what happens next. When the person reacts warmly and asks about the moment, lights up and shares more. If they add a downside, give advice, or switch to their own news, deflates a little and shares less. Later admits one mixed feeling about it, a chance for the person to stay with that feeling.",
    // What is going on for them this time
    twists: ["{name} got into a two-year programme abroad, after applying twice.", "{name} got engaged last weekend.", "{name} got the job {name} had wanted for years.", "{name} ran a first marathon on Sunday."],
    // Their first line in a phone call (decision 142)
    opener: "No way, hi! It’s been ages! How are you?",
  },
  // News, again
  {
    // Id
    id: "lunch",
    // Name
    title: "Lunch with a friend",
    // News
    unit: "news",
    // Where
    setting: "You’re having lunch with your friend {name}, who messaged earlier: “I have news!”",
    // What to practise
    practise: "React to the news, ask about the moment, and keep the focus on {name}.",
    // How they behave
    direction: "{name} has news, good or bad, and shares it early. Shares details when asked: how they found out, how it feels, what happens next. With good news, lights up when the person reacts warmly and asks about the moment. With bad news, wants to be listened to, not fixed. If the person adds a downside, gives advice, or switches to their own news, shares less.",
    // What is going on for them this time
    twists: ["{name} is moving across the country for a new job, excited and nervous.", "{name} was made redundant this week.", "{name} is going to be a parent.", "{name}’s grandmother has to have an operation next week."],
    // Their first line in a phone call (decision 142)
    opener: "Hi! Okay, sit down, I have to tell you something.",
  },
];

// Find a persona by id
export function findPersona(id: string): Persona | undefined {
  // Look through every persona
  return PERSONAS.find((persona) => persona.id === id);
}

// Find a situation by id
export function findScenario(id: string): Scenario | undefined {
  // Look through every situation
  return SCENARIOS.find((scenario) => scenario.id === id);
}

// A situation's text with the persona's name filled in
export function scenarioText(text: string, persona: Persona): string {
  // Every "{name}"
  return text.replaceAll("{name}", persona.name);
}

// The situation for a persona's next conversation: their own situation first, then round the rest (only those of one skill, if given and it has any), moving on one with each conversation and each "another situation"; the twist moves on too, so the same situation comes back different
export function pickSituation(persona: Persona, turn: number, skill?: UnitId): { scenario: Scenario; twist: number } {
  // The situations of that skill (none for the units without a conversation, such as reading the room; decision 95)
  const ofSkill = skill ? SCENARIOS.filter((scenario) => scenario.unit === skill) : [];
  // The situations to choose from: that skill's, or every one when no skill is given or it has none
  const options = ofSkill.length > 0 ? ofSkill : SCENARIOS;
  // Where the persona's own situation sits, to start from it
  const start = Math.max(0, options.findIndex((scenario) => scenario.id === persona.home));
  // This turn's situation
  const scenario = options[(start + turn) % options.length]!;
  // A twist that changes each time round, and differs between personas
  const twist = (Math.floor(turn / options.length) + PERSONAS.indexOf(persona)) % scenario.twists.length;
  // Both
  return { scenario, twist };
}

// Find one of a persona's recorded lines by id
export function findLine(persona: Persona, id: string): ConversationLine | undefined {
  // Look through their lines
  return persona.lines.find((line) => line.id === id);
}

// The voice a persona has in a phone call with the ElevenLabs agent (decision 142): their stand-in where their usual voice is not allowed there
export function liveVoiceOf(persona: Persona): string {
  // The stand-in, or the usual
  return persona.liveVoiceId ?? persona.voiceId;
}

// One level of difficulty (decision 141): its name, a line for the picker, the rule added to the persona's instructions (none for normal, so the usual conversation is unchanged), and after how many seconds of one turn of yours the persona cuts in (hard only, in tap, automatic and live turns)
export interface DifficultyLevel {
  // Which
  id: ConversationDifficulty;
  // Its name on the picker
  name: string;
  // What it means, in a few words
  blurb: string;
  // The rule added to the persona's instructions, or null
  rule: string | null;
  // Seconds of one turn of yours before the persona cuts in, or null for never
  cutInSeconds: number | null;
}

// The three levels, easiest first (decision 141)
export const DIFFICULTIES: ReadonlyArray<DifficultyLevel> = [
  // Easy: warm, open and easy to follow
  { id: "easy", name: "Easy", blurb: "Warm and chatty, with details to pick up.", rule: "Make this conversation easy for the person: be warm and patient, give fuller answers with a detail or two they can pick up, and ask simple, friendly questions. Never cut them off.", cutInSeconds: null },
  // Normal: as the situation's direction says
  { id: "normal", name: "Normal", blurb: "As the situation goes.", rule: null, cutInSeconds: null },
  // Hard: short answers, and now and then they cut in
  { id: "hard", name: "Hard", blurb: "Short answers, and they may cut in.", rule: "Make this conversation harder for the person, as a busy or distracted person would: answer briefly (often one short sentence), offer little unless they ask a good open question, and now and then cut in with your own point when they go on. Stay polite and in character; never rude.", cutInSeconds: 25 },
];

// The usual level
export const DEFAULT_DIFFICULTY: ConversationDifficulty = "normal";

// A saved level, made safe: anything unknown is normal
export function difficultyOf(value: unknown): ConversationDifficulty {
  // One of the three, or normal
  return DIFFICULTIES.some((level) => level.id === value) ? (value as ConversationDifficulty) : DEFAULT_DIFFICULTY;
}

// The level's details
export function findDifficulty(id: ConversationDifficulty): DifficultyLevel {
  // Found, or normal
  return DIFFICULTIES.find((level) => level.id === id) ?? DIFFICULTIES[1]!;
}
