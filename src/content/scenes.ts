// Scenes (decision 149): short conversations with the four people from Talk with someone, where each reply you choose changes how they answer, and the last reply is yours, out loud. The plan is in documents/plan-scenes-and-listening.md

// Load the reply tiers from the quick scenarios, whose first exchanges two scenes grew from
import type { Tier } from "@/content/scenarios";
// Load the small-talk unit type
import type { UnitId } from "@/content/smallTalkUnit";
// Load the spoken-reply check names
import type { ReplyCheckId } from "@/core/replyChecks";

// One line a person says, recorded in their voice
export interface SceneLine {
  // Stable id, also the id of its recording
  id: string;
  // The words, as shown and as recorded
  text: string;
  // How it was read (an ElevenLabs audio tag such as "[excited]"), kept out of the words
  tag: string;
}

// One reply you can choose, and how they answer it
export interface SceneOption {
  // What you would say
  text: string;
  // How good it is
  tier: Tier;
  // The named pattern behind it, such as "Shift to yourself"
  pattern: string;
  // Why it works, or why it is weaker, in a line or two
  why: string;
  // What they say back
  reply: SceneLine;
}

// One scene
export interface Scene {
  // Stable id
  id: string;
  // A short name
  title: string;
  // Who you are with (a persona id from conversations.ts)
  personaId: string;
  // The small-talk skill it practises
  unit: UnitId;
  // Where you are and what is going on, two lines
  setting: string;
  // Their first line
  opening: SceneLine;
  // The first choice: three replies
  first: ReadonlyArray<SceneOption>;
  // What they say next whatever you chose (the branches join again here)
  bridge: SceneLine;
  // The second choice: three replies
  second: ReadonlyArray<SceneOption>;
  // Their last line before your spoken turn
  prompt: SceneLine;
  // Your spoken turn: what to do, and what the phone checks
  final: { ask: string; checks: ReadonlyArray<ReplyCheckId> };
  // One way to answer the spoken turn
  example: string;
  // How they close: warm when most checks passed, flat otherwise
  closings: { warm: SceneLine; flat: SceneLine };
  // The move, in one line: a rule, never a line to memorise
  move: string;
}

// A scene as written, before its lines get their ids
interface WrittenScene extends Omit<Scene, "opening" | "first" | "bridge" | "second" | "prompt" | "closings"> {
  // Each line as [tag, words]
  opening: readonly [string, string];
  // Each reply with its answer as [tag, words]
  first: ReadonlyArray<Omit<SceneOption, "reply"> & { reply: readonly [string, string] }>;
  // (as above)
  bridge: readonly [string, string];
  // (as above)
  second: ReadonlyArray<Omit<SceneOption, "reply"> & { reply: readonly [string, string] }>;
  // (as above)
  prompt: readonly [string, string];
  // (as above)
  closings: { warm: readonly [string, string]; flat: readonly [string, string] };
}

// The scenes as written: two for each person, in a situation that fits their skill
const WRITTEN: ReadonlyArray<WrittenScene> = [
  // Priya, news: grown from the quick scenario "The job offer"
  {
    id: "sn-lisbon",
    title: "The Lisbon offer",
    personaId: "priya",
    unit: "news",
    setting: "Lunch at work. Priya puts her phone down, grinning, and can't sit still.",
    opening: ["[excited]", "Okay, I have to tell someone. I got the offer. The Lisbon job! I start in March!"],
    first: [
      { text: "“No way, Lisbon! When did you find out?”", tier: "best", pattern: "Real reaction, then about the moment", why: "Real enthusiasm, and it asks her to relive the moment. Meeting good news like this is linked to more trust and closeness.", reply: ["[delighted, talking fast]", "Like ten minutes ago! I was in the lift and I actually squeaked. A man in a suit looked at me like I was a kettle."] },
      { text: "“Congrats! I moved abroad once. Honestly, the first year was brutal.”", tier: "misstep", pattern: "Shift to yourself", why: "It takes the spotlight just as she steps into it, and hands her a worry she didn't ask for.", reply: ["[deflating a little]", "Oh. Right. Yeah, I guess it'll be hard at first."] },
      { text: "“Nice one, well done.”", tier: "flat", pattern: "Quiet acknowledgement", why: "Kind, but it ends the moment. She has nothing to say next.", reply: ["[a bit flat]", "Thanks. Yeah. It's a big deal for me."] },
    ],
    bridge: ["[thoughtful, then excited]", "The thing is, my mum doesn't know yet. I'm calling her tonight. She's going to cry. Good crying, I think. Mostly."],
    second: [
      { text: "“She'll be so proud of you.”", tier: "good", pattern: "Reassurance", why: "Warm, and probably true, but it answers the worry for her instead of letting her say it.", reply: ["[smiling]", "Yeah, she will. I hope so, anyway."] },
      { text: "“Good crying, mostly? How do you think she'll take it?”", tier: "best", pattern: "Their words, then their feeling", why: "It picks up her exact words and opens the mixed feeling she hinted at, without trying to fix it.", reply: ["[softer, honest]", "Honestly? She'll be proud, and then sad I'm going. We're really close. I think that's why I've been putting the call off."] },
      { text: "“At least Lisbon's only a short flight away.”", tier: "misstep", pattern: "At least", why: "“At least” rushes past what she's feeling. It's meant kindly, but it tells her the worry doesn't count.", reply: ["[deflated]", "Mm. Yeah. That's what everyone says."] },
    ],
    prompt: ["[nervous laugh]", "Sorry, I'm talking so much. It's just a lot. Big, scary, amazing a lot."],
    final: { ask: "Stay with her news and how she feels about it. No buts.", checks: ["their-feeling", "question", "stays", "no-advice"] },
    example: "Don't apologise, it is a lot! Big and scary and amazing all at once. What are you most looking forward to?",
    closings: { warm: ["[warm, grateful]", "Thank you. Honestly, saying it out loud to someone helped. I think I'm ready to call her."], flat: ["[polite]", "Anyway. Thanks. I should probably get back to my desk."] },
    move: "Celebrate the news first; let them tell you how they feel before you add anything.",
  },
  // Priya, news: the win and the nerves
  {
    id: "sn-board",
    title: "The board presentation",
    personaId: "priya",
    unit: "news",
    setting: "Priya catches you by the lifts, practically bouncing on her toes.",
    opening: ["[excited]", "Guess who's presenting the library project to the board next week? Me! They asked for me by name!"],
    first: [
      { text: "“Congratulations! You deserve it.”", tier: "good", pattern: "Praise", why: "Warm and true, but it closes the topic instead of opening it.", reply: ["[happy]", "Thank you! I really didn't expect it."] },
      { text: "“Wow. The board can be brutal, though.”", tier: "misstep", pattern: "The but", why: "A worry, just as she shares the win. She deflates, and the moment is gone.", reply: ["[deflating]", "Oh. Yeah. I hadn't really thought about that."] },
      { text: "“By name? That's huge. What did they say?”", tier: "best", pattern: "Their words, then the moment", why: "It picks up the part she's proudest of and lets her tell it.", reply: ["[beaming]", "That the library was the best thing the studio's done this year. I had to go and stand in the stairwell for a minute."] },
    ],
    bridge: ["[nervous laugh]", "I've never presented to anyone more senior than my manager. I keep imagining my slides just not loading."],
    second: [
      { text: "“That's a big step up. What part of it feels scariest?”", tier: "best", pattern: "Ask about the feeling", why: "It takes her worry seriously and lets her name it, before any reassurance.", reply: ["[honest]", "The questions, I think. The slides I can practise. The questions could be anything."] },
      { text: "“Just picture them in their underwear.”", tier: "misstep", pattern: "A quick fix", why: "A joke and a trick, when she was sharing a real nerve. It skips the listening.", reply: ["[polite laugh]", "Ha. Yeah. People keep telling me that."] },
      { text: "“You'll be great. You know the project better than anyone.”", tier: "good", pattern: "Reassurance", why: "Kind, and it may help, but it moves past her nerves rather than hearing them.", reply: ["[smiles]", "That's true. I did draw every bookshelf."] },
    ],
    prompt: ["[hopeful]", "Okay. Big breath. I think I'm more excited than scared. Mostly."],
    final: { ask: "Celebrate with her: no buts, and ask one thing about the good part.", checks: ["their-words", "question", "stays", "no-advice"] },
    example: "More excited than scared, I love that. Which part of the library are you most proud to show them?",
    closings: { warm: ["[delighted]", "Thank you. Seriously, I feel so much better. Merci, gracias, thank you!"], flat: ["[polite]", "Okay. Thanks. I'd better go and practise."] },
    move: "Share the joy of a win before anything else; a worry can wait until they bring it up.",
  },
  // Chris, listening: grown from the quick scenario "The brutal week"
  {
    id: "sn-long-week",
    title: "The long week",
    personaId: "chris",
    unit: "listening",
    setting: "Thursday evening at the café. Chris drops into the chair opposite you and lets out a long breath.",
    opening: ["[tired, dry]", "Don't ask about my week. Actually, do. The deadline moved up again, and I'm the only one left on the project."],
    first: [
      { text: "“You should talk to your manager about it.”", tier: "misstep", pattern: "Advice first", why: "Advice before he's asked for it. People feel more understood when they're listened to than when they're advised.", reply: ["[flat, shutting down]", "Yeah. Maybe. I've tried that."] },
      { text: "“The only one left? That sounds exhausting. What happened to the others?”", tier: "best", pattern: "Their words, their feeling, then a question", why: "It picks up his words, names how it must feel, and gives him room to say more.", reply: ["[opening up]", "Two people left in a month and nobody replaced them. I've been doing three jobs. I even missed football tonight. First time in two years."] },
      { text: "“Oh no. That's rough.”", tier: "good", pattern: "Sympathy", why: "Kind and quick, but it leaves him with nothing to pick up.", reply: ["[shrugs]", "Yeah. It is what it is."] },
    ],
    bridge: ["[quieter, wry]", "And my mum keeps ringing to ask if I'm eating properly. Which, to be fair, I'm not. It's been cereal for dinner since Monday."],
    second: [
      { text: "“Ha, same. I lived on toast for a month once.”", tier: "misstep", pattern: "Shift to yourself", why: "Meant to show you relate, but it moves the talk to you just as he opens up.", reply: ["[polite]", "Ha. Yeah. Toast's good."] },
      { text: "“Your mum sounds nice.”", tier: "flat", pattern: "Side detail", why: "It picks up the least important part, so the real thing, his week, slips away.", reply: ["[mild]", "She is. She worries, that's all."] },
      { text: "“Cereal since Monday? When did you last get a proper evening off?”", tier: "best", pattern: "Stay with him", why: "It keeps the spotlight on him, with a touch of humour that matches his.", reply: ["[small laugh]", "Ha. Honestly? I can't remember. The plants are the only ones getting looked after in my flat."] },
    ],
    prompt: ["[tired, honest]", "I keep thinking it'll calm down next week. It never does."],
    final: { ask: "No fixing. Show you heard it, then give him room.", checks: ["their-words", "their-feeling", "stays", "no-advice"] },
    example: "Every week you think it'll calm down, and it never does. That sounds really draining. How are you holding up?",
    closings: { warm: ["[grateful, lighter]", "Thanks for listening. Really. I feel a bit less like I'm going mad."], flat: ["[tired]", "Anyway. Enough about me. I'll survive."] },
    move: "Listen before you fix: their words, their feeling, then room to say more.",
  },
  // Chris, listening: losing a home
  {
    id: "sn-the-flat",
    title: "The flat",
    personaId: "chris",
    unit: "listening",
    setting: "A Saturday walk in the park. Chris seems far away and keeps checking his phone.",
    opening: ["[quiet]", "My landlord's selling the flat. I've got two months to find somewhere. Six years I've been there."],
    first: [
      { text: "“Oh no, that's horrible timing.”", tier: "good", pattern: "Sympathy", why: "Kind, but it stays on the surface. He has to choose whether to say more.", reply: ["[sighs]", "Yeah. With work as well. Perfect."] },
      { text: "“Six years? Oh, Chris. How are you feeling about it?”", tier: "best", pattern: "Their words, then their feeling", why: "It picks up the detail that matters, six years, and asks about him, not the logistics.", reply: ["[opening up]", "Gutted, honestly. It's not just a flat. Every windowsill's got my plants on it. I know the man at the corner shop by name."] },
      { text: "“The rental market's mad right now. Start looking today.”", tier: "misstep", pattern: "Advice and alarm", why: "Urgent advice and a fresh worry. He shuts down.", reply: ["[short]", "Yeah. I know. Everyone keeps saying."] },
    ],
    bridge: ["[wry]", "The plants are the real problem. Do you know how hard it is to move forty plants? I'll need a van just for them."],
    second: [
      { text: "“Maybe this is a sign to get rid of a few.”", tier: "misstep", pattern: "Fix the wrong thing", why: "It treats the plants as the problem, when they're the part of home he's sad to lose.", reply: ["[flat]", "Ha. No. Not happening."] },
      { text: "“Forty plants! Which one would you save first?”", tier: "best", pattern: "Follow their lead", why: "He made a joke to lighten it. Joining him, on his detail, keeps him talking about what he loves.", reply: ["[laughs, warmer]", "The fern. Definitely the fern. My mum gave it to me the day I moved in. It's huge now."] },
      { text: "“You'll find somewhere with good windows.”", tier: "good", pattern: "Reassurance", why: "Hopeful and kind, though it jumps ahead to the fix.", reply: ["[small smile]", "Hopefully. Big windows. That's my one rule."] },
    ],
    prompt: ["[softer]", "It's daft. It's only a flat. But it's been home."],
    final: { ask: "Tell him it's not daft, in your own words, and stay with what home means to him.", checks: ["their-words", "their-feeling", "stays", "no-advice"] },
    example: "It's not daft at all. Six years, the plants, the man at the corner shop. That's home. What will you miss most?",
    closings: { warm: ["[touched]", "Yeah. Thanks. It helps that someone gets it."], flat: ["[quiet]", "Anyway. I'll figure it out."] },
    move: "When someone is losing something, ask what it means to them before you talk about what to do.",
  },
  // Maya, answering: the first question
  {
    id: "sn-first-question",
    title: "Her first question",
    personaId: "maya",
    unit: "answering",
    setting: "Your friend's birthday drinks. Maya, who you've met once, waves you over.",
    opening: ["[bright]", "Hey! You're the one who knows everyone here. So what have you been up to lately?"],
    first: [
      { text: "“Not much, just work really.”", tier: "flat", pattern: "Dead-end opening", why: "Honest, but it gives her nothing to pick up. She has to start again.", reply: ["[trying]", "Ha, fair. Work, work, work. Cool."] },
      { text: "“Busy! Work's been mad, but I went to the coast at the weekend.”", tier: "good", pattern: "Facts without a moment", why: "Better: there's something to pick up. But no feeling and no question back, so she has to do the work.", reply: ["[curious]", "Oh nice, the coast! Which bit?"] },
      { text: "“I finally tried that climbing wall on King Street. I was terrible, and I loved it. Have you been?”", tier: "best", pattern: "A moment, a feeling, then hand it back", why: "A real moment, how it felt, and a question back. It gives her something to pick up and a turn.", reply: ["[laughs, excited]", "No way, I walk past it every day! I keep saying I'll go. Were your arms dead the next day?"] },
    ],
    bridge: ["[lively, self-mocking]", "I just moved here from Denver, so I'm collecting things to do. Long story, but I joined a running club, and I don't run."],
    second: [
      { text: "“Denver! What brought you here?”", tier: "good", pattern: "A question about them", why: "A good question, but it skips the joke she just set up.", reply: ["[cheerful]", "Work! I'm in marketing now. Big move, but I'm loving it so far."] },
      { text: "“Wait, you joined a running club and you don't run? What do you do there?”", tier: "best", pattern: "Pick up the hook", why: "She dropped a funny hook. Following it is the easiest way to get her talking, and it shows you listened.", reply: ["[laughing]", "I chat at the back! It's a social club now, as far as I'm concerned. There's a pastry stop at the end. That's my real motivation."] },
      { text: "“Oh, I hate running. I did a 5k once and nearly died.”", tier: "misstep", pattern: "Shift to yourself", why: "It takes her funny detail and turns it into your story.", reply: ["[polite]", "Ha. Yeah. It's not for everyone."] },
    ],
    prompt: ["[curious]", "Okay, your turn. What's something you're actually looking forward to this month?"],
    final: { ask: "One real thing, how you feel about it, then hand it back.", checks: ["no-dead-end", "own-feeling", "hand-back"] },
    example: "My sister's visiting next weekend and I've booked us a pottery class. I'm weirdly excited. What about you, anything good coming up?",
    closings: { warm: ["[delighted]", "Oh, I love that. Okay, we're friends now. That's decided."], flat: ["[polite]", "Nice. Cool. Oh, I think my friend's waving at me."] },
    move: "Answer with a moment and a feeling, then hand the turn back.",
  },
  // Maya, answering: "what do you do?"
  {
    id: "sn-what-do-you-do",
    title: "So what do you do?",
    personaId: "maya",
    unit: "answering",
    setting: "The office party. Maya, new in marketing, joins you by the snacks.",
    opening: ["[bright]", "Hi! I'm Maya, I just started in marketing. I feel like I should know what everyone does by now. What do you do?"],
    first: [
      { text: "“Operations. Mostly spreadsheets, but it's better than it sounds.”", tier: "good", pattern: "A hint, no hand-back", why: "A little self-mocking hook, which helps, but she has to carry the next turn.", reply: ["[laughs]", "Better than it sounds? Now I'm curious."] },
      { text: "“I look after customer support. I hear every complaint first, and some are amazing. What brought you to marketing?”", tier: "best", pattern: "The job, a hook, then hand it back", why: "One line of job, one interesting hook, and her turn. It invites a story either way.", reply: ["[delighted]", "Okay, I need to hear the best complaint. But marketing! I used to be at a tiny startup where I did everything. Now I do one thing, which is weird."] },
      { text: "“I'm in operations.”", tier: "flat", pattern: "The title only", why: "Correct, and a dead end. A job title gives nobody much to ask about.", reply: ["[trying]", "Oh, cool. Operations. So what does that involve?"] },
    ],
    bridge: ["[wry]", "Honestly, everyone here's so nice. The only one who's been rude to me since I moved is my cat. He yells at me at five every morning."],
    second: [
      { text: "“How are you finding the city?”", tier: "good", pattern: "A new topic", why: "A fine question, but it walks past the funny thing she just told you.", reply: ["[cheerful]", "I love it! Tacos everywhere. I'm trying every place I can walk to."] },
      { text: "“Cats are the worst. I'm a dog person.”", tier: "misstep", pattern: "Argue with the detail", why: "It turns her funny bit into a debate about you. She'll laugh, and the thread ends.", reply: ["[polite laugh]", "Ha. Fair enough. Dog people."] },
      { text: "“He yells at five? What does he want?”", tier: "best", pattern: "Pick up the hook", why: "Her detail, as a question. It shows you were listening and lets her be funny.", reply: ["[laughing]", "Breakfast! Always breakfast. His name's Biscuit, which is ironic, because he's a monster."] },
    ],
    prompt: ["[curious]", "Okay, quick. If I only have one free Saturday this month, where should I go?"],
    final: { ask: "One real place, why you like it, then hand it back.", checks: ["no-dead-end", "own-feeling", "hand-back"] },
    example: "The market by the river on a Saturday morning. I love it, the coffee stall alone is worth it. What do you usually do at weekends?",
    closings: { warm: ["[delighted]", "Oh, sold. I'm going. You're officially my tour guide."], flat: ["[polite]", "Cool, thanks. I'll look it up."] },
    move: "Give them something to pick up, a hook or a feeling, and hand the turn back.",
  },
  // Theo, asking: the quiet colleague
  {
    id: "sn-early",
    title: "Early for the meeting",
    personaId: "theo",
    unit: "asking",
    setting: "Five minutes before a meeting. Theo from finance is the only other person in the room.",
    opening: ["[quiet, polite]", "Hi. Early too, then."],
    first: [
      { text: "“Yeah. How's your week going?”", tier: "good", pattern: "Small-talk question", why: "Friendly, but Theo gives small talk a few words. It's a start, not a door.", reply: ["[brief]", "Fine. Busy. Month end."] },
      { text: "“Yep.”", tier: "flat", pattern: "Nothing to hold", why: "Fine, but there's nothing to hold on to. The silence just carries on.", reply: ["[quiet]", "Mm."] },
      { text: "“Yeah. Someone told me you fix up old radios. Is that true?”", tier: "best", pattern: "Ask about what they care about", why: "It goes straight to something he loves. Quiet people often open up to a real question about their thing.", reply: ["[surprised, warming]", "Oh. Yeah, it is. Old ones, from the fifties. I've got eleven now. My flatmate says that's ten too many."] },
    ],
    bridge: ["[a little shy]", "Sorry, I'm not great at chat. Mostly I just go home and fix radios. That's my exciting life."],
    second: [
      { text: "“That's not boring at all! It sounds cool.”", tier: "good", pattern: "Reassurance", why: "Kind, and it helps him feel less awkward, but it doesn't ask him anything.", reply: ["[small smile]", "Thanks. It's quite niche."] },
      { text: "“Old radios? How did that start?”", tier: "best", pattern: "Open question on their detail", why: "An open question about the thing he just offered. “How” and “what” questions give quiet people room.", reply: ["[warming up]", "My grandad's kitchen radio. It broke when I was fourteen, and I took it apart to fix it. Took me a whole summer. It still works."] },
      { text: "“Do you sell them?”", tier: "misstep", pattern: "Closed question", why: "A yes-or-no question gets a yes or no. With a quiet person, the talk stops there.", reply: ["[brief]", "No. I just keep them."] },
    ],
    prompt: ["[quietly enthusiastic]", "The best ones still have their original valves. When you switch them on, they glow orange for a minute before any sound comes out."],
    final: { ask: "Ask him one open question about what he just said.", checks: ["open-question", "their-words", "stays"] },
    example: "They glow before the sound comes? What's that moment like, when one you've fixed finally plays?",
    closings: { warm: ["[warm, animated]", "Honestly? Best feeling in the world. I'll bring a picture in. Thanks for asking. Really."], flat: ["[polite]", "Yeah. Anyway. Looks like the others are coming."] },
    move: "With quiet people, ask open questions about the thing they care about, then let them talk.",
  },
  // Theo, asking: the nerves before a talk
  {
    id: "sn-before-two",
    title: "Before two o'clock",
    personaId: "theo",
    unit: "asking",
    setting: "The office kitchen. Theo is staring at his notes. He's presenting the budget at two.",
    opening: ["[nervous]", "I'm presenting the budget at two. I'm fine. I'm mostly fine."],
    first: [
      { text: "“You'll be fine! Just be confident.”", tier: "misstep", pattern: "Quick reassurance", why: "It brushes his nerves aside and tells him what to feel. He'll just say thanks.", reply: ["[quiet]", "Thanks. Yeah. Confident."] },
      { text: "“Want to run it past me?”", tier: "good", pattern: "An offer", why: "Kind and useful, but it skips asking how he feels about it.", reply: ["[hesitant]", "Maybe. I don't know. I've read it so many times."] },
      { text: "“Mostly fine? What's the part that isn't?”", tier: "best", pattern: "Their words, as a question", why: "It picks up his exact words and gives him a gentle way in.", reply: ["[honest]", "The questions. I know the numbers. But when someone asks me something on the spot, my mind goes white."] },
    ],
    bridge: ["[dry]", "Last time someone asked about travel costs, and I said “I'll get back to you” four times. Four. I counted."],
    second: [
      { text: "“Four times! What do you wish you'd said?”", tier: "best", pattern: "Stay with their story", why: "It meets his dry humour and lets him think it through himself.", reply: ["[small laugh, thinking]", "Something like, good question, here's what I know, and I'll check the rest. Which is fine, actually. That's allowed."] },
      { text: "“Ha, I once froze completely in a pitch.”", tier: "misstep", pattern: "Shift to yourself", why: "It might make him feel less alone, but now he's listening to your story instead of getting ready.", reply: ["[polite]", "Oh. Right. That sounds tough."] },
      { text: "“Travel costs are always a nightmare.”", tier: "flat", pattern: "Side detail", why: "It follows the least important detail and leaves his worry behind.", reply: ["[mild]", "Yeah. They are."] },
    ],
    prompt: ["[steadier]", "Actually, I think I've just answered my own question. Talking it through helps."],
    final: { ask: "Ask him one open question that helps him keep thinking it through.", checks: ["open-question", "their-words", "stays", "no-advice"] },
    example: "Talking it through really helps, and you've clearly got it. What's the one thing you want them to remember at the end?",
    closings: { warm: ["[warmer, steady]", "Good question. That the budget's tight, but fair. Okay. I think I'm ready. Thanks."], flat: ["[polite]", "Okay. Thanks. I should go and set up."] },
    move: "Before reassuring, ask about the worry, in their words, and let them work it out.",
  },
];

// A line from its tag and words, with its id
function line(id: string, [tag, text]: readonly [string, string]): SceneLine {
  // Kept together
  return { id, tag, text };
}

// The three choices' letters, for the ids of their answers
const LETTERS = ["a", "b", "c"];

// The scenes, with every line given its stable id ("sn-lisbon-open", "sn-lisbon-1a", "sn-lisbon-bridge", …)
export const SCENES: ReadonlyArray<Scene> = WRITTEN.map((scene) => ({
  // Everything else as written
  ...scene,
  // Their first line
  opening: line(`${scene.id}-open`, scene.opening),
  // The first choice's answers
  first: scene.first.map((option, index) => ({ ...option, reply: line(`${scene.id}-1${LETTERS[index]}`, option.reply) })),
  // The line that joins the branches
  bridge: line(`${scene.id}-bridge`, scene.bridge),
  // The second choice's answers
  second: scene.second.map((option, index) => ({ ...option, reply: line(`${scene.id}-2${LETTERS[index]}`, option.reply) })),
  // Their last line before your turn
  prompt: line(`${scene.id}-prompt`, scene.prompt),
  // The two closings
  closings: { warm: line(`${scene.id}-warm`, scene.closings.warm), flat: line(`${scene.id}-flat`, scene.closings.flat) },
}));

// A scene by id
export function findScene(id: string): Scene | undefined {
  // The first with that id
  return SCENES.find((scene) => scene.id === id);
}

// Every line in a scene, in the order a play could reach them
export function sceneLines(scene: Scene): SceneLine[] {
  // Opening, the first answers, the bridge, the second answers, the prompt, the closings
  return [scene.opening, ...scene.first.map((option) => option.reply), scene.bridge, ...scene.second.map((option) => option.reply), scene.prompt, scene.closings.warm, scene.closings.flat];
}
