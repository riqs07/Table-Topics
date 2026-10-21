// The prompt library: deeper prompts with angles for Record Response, light questions for Table Topic. DRAFT: approved at checkpoint C13 before shipping

// Load the calendar-day helpers
import { daysBetween } from "@/core/dates";
// Load the lessons, so their titles can be found like prompts
import { LESSONS } from "@/content/lessons";
// Load the small-talk questions, so they can be found like prompts
import { SMALL_TALK_PROMPTS } from "@/content/smallTalk";
// Load the weekly check-in's passage and surprise questions, so they can be found like any text and prompt (decision 100)
import { CHECK_IN_PASSAGE, CHECK_IN_QUESTIONS } from "@/content/checkIn";

// One daily prompt
export interface Prompt {
  // Stable id stored with each session
  id: string;
  // The prompt as shown to the user
  text: string;
  // For a Record Response: two or three angles to help shape an answer (none for other kinds)
  angles?: ReadonlyArray<string>;
  // The kind of talk a Record Response prompt asks for, so feedback can expect the right shape
  talkKind?: TalkKind;
}

// The kinds of talk a Record Response prompt can ask for
export type TalkKind = "explain" | "persuade" | "toast" | "update" | "story" | "opinion";

// One step of the structure hint shown while thinking about a Record Response
export interface StructureStep {
  // Short name of the step
  label: string;
  // What to say in this step
  detail: string;
}

// A simple structure that fits any Record Response. DRAFT: approved at checkpoint C13
export const STRUCTURE_HINT: ReadonlyArray<StructureStep> = [
  // Open with the answer
  { label: "Point", detail: "Say your answer in one sentence." },
  // Back it up
  { label: "Reason", detail: "Say why." },
  // Make it real
  { label: "Example", detail: "Tell one moment or detail that shows it." },
  // Close the loop
  { label: "Point again", detail: "Repeat your answer in new words, then stop." },
];

// Record Response prompts: speaking tasks for an audience (decision 22); ids never change once used, so old sessions keep their prompt
export const PROMPTS: ReadonlyArray<Prompt> = [
  // Prompt 3
  { id: "p003", text: "What is something you changed your mind about?", angles: ["What you used to think", "The moment or person that changed it", "What you think now, and what it cost to change"], talkKind: "opinion" },
  // Prompt 5
  { id: "p005", text: "What is a skill you would like to learn, and why?", angles: ["The skill and when you first wanted it", "What has stopped you so far", "The first small step you could take"], talkKind: "opinion" },
  // Prompt 8
  { id: "p008", text: "What is a piece of advice that stuck with you?", angles: ["Who said it and when", "What was happening in your life", "A time you actually used it"], talkKind: "story" },
  // Prompt 14
  { id: "p014", text: "What would you teach a class on?", angles: ["The subject", "What the first lesson would be", "Why you would be the right person to teach it"], talkKind: "explain" },
  // Prompt 15
  { id: "p015", text: "Tell me about a book, film or show you would recommend.", angles: ["What it is about, in one sentence", "The moment that won you over", "Who it is for"], talkKind: "persuade" },
  // Prompt 17
  { id: "p017", text: "Describe a problem you solved this month.", angles: ["What the problem was", "What you tried first", "What finally worked, and what you learned"], talkKind: "story" },
  // Prompt 19
  { id: "p019", text: "Tell me about your first job.", angles: ["What the job was and how you got it", "A day you remember from it", "What it taught you that you still use"], talkKind: "story" },
  // Prompt 21
  { id: "p021", text: "Explain how to make something you cook often.", angles: ["What you make and why you make it often", "The steps in order", "The one tip that makes it work"], talkKind: "explain" },
  // Prompt 22
  { id: "p022", text: "What is one thing you would change about your town?", angles: ["What you would change", "Why it bothers you", "What the town would be like after"], talkKind: "persuade" },
  // Prompt 23
  { id: "p023", text: "Describe a time you tried something new.", angles: ["What you tried and why", "The moment it went right or wrong", "What you would tell someone about to try it"], talkKind: "story" },
  // Prompt 24
  { id: "p024", text: "What makes a good friend, in your view?", angles: ["The one quality that matters most", "A friend who shows it", "How you try to be that kind of friend"], talkKind: "opinion" },
  // Prompt 32
  { id: "p032", text: "What is a rule you think should exist?", angles: ["The rule", "The problem it would fix", "How people would react to it"], talkKind: "persuade" },
  // Prompt 33
  { id: "p033", text: "Tell me about a person you admire and why.", angles: ["Who they are", "One thing they did that shows why", "What you have taken from them"], talkKind: "toast" },
  // Explain your work to an outsider
  { id: "p037", text: "Explain what you do at work to someone outside your field.", angles: ["The one-sentence version", "A task or day that shows it", "Why it matters to the people it serves"], talkKind: "explain" },
  // Teach a beginner
  { id: "p038", text: "Teach a newcomer one thing about a hobby you know well.", angles: ["The one thing worth knowing first", "The mistake most beginners make", "How they can try it this week"], talkKind: "explain" },
  // Explain a decision
  { id: "p039", text: "Explain a decision you made recently and how you made it.", angles: ["The decision, in one sentence", "The options you weighed", "What tipped it"], talkKind: "explain" },
  // Persuade a team
  { id: "p040", text: "Convince your team to try one new way of working.", angles: ["The change, in one sentence", "The problem it fixes", "A small first step to try"], talkKind: "persuade" },
  // Persuade a friend
  { id: "p041", text: "Persuade a friend to take up something you enjoy.", angles: ["What it is and what it gives you", "The worry they will have, and your answer", "How they could start"], talkKind: "persuade" },
  // Make the case for a cause
  { id: "p042", text: "Make the case for a cause or charity you care about.", angles: ["The problem it works on", "One person or story that shows the need", "What you are asking listeners to do"], talkKind: "persuade" },
  // Argue for a change
  { id: "p043", text: "Argue for one change at your workplace or school.", angles: ["The change", "Who it would help, and how", "Why now"], talkKind: "persuade" },
  // A birthday toast
  { id: "p044", text: "Give a short toast at a friend's birthday dinner.", angles: ["A quick story that shows who they are", "What they bring to the people around them", "The raise-your-glass line"], talkKind: "toast" },
  // Thank a team
  { id: "p045", text: "Thank a team after a project ends.", angles: ["What the project was and what it took", "One person or moment worth naming", "What you hope the team remembers"], talkKind: "toast" },
  // Welcome a newcomer
  { id: "p046", text: "Welcome a new colleague or member to your group.", angles: ["Who they are and where they come from", "What they bring", "How the group can help them settle in"], talkKind: "toast" },
  // Introduce a speaker
  { id: "p047", text: "Introduce a speaker you admire to an audience.", angles: ["Who they are, in one line", "Why this audience should listen", "Hand over with their name, said last"], talkKind: "toast" },
  // A work update
  { id: "p048", text: "Give a short update on something you are working on.", angles: ["Where it stands, in one sentence", "What went well and what is stuck", "What you need from your listeners"], talkKind: "update" },
  // Report back
  { id: "p049", text: "Report back on an event or trip to people who missed it.", angles: ["The headline", "One detail worth hearing", "What it means for them"], talkKind: "update" },
  // Share news that changes plans
  { id: "p050", text: "Share some news that changes plans for your group.", angles: ["The news, said first", "Why it happened", "What happens next"], talkKind: "update" },
  // A mistake that taught you
  { id: "p051", text: "Tell the story of a mistake that taught you something.", angles: ["What happened", "The moment you realised", "What you do differently now"], talkKind: "story" },
  // A time you spoke up
  { id: "p052", text: "Tell a story about a time you had to speak up.", angles: ["The situation", "What you said", "What happened next"], talkKind: "story" },
  // What makes a good talk
  { id: "p053", text: "What makes a talk worth listening to?", angles: ["The one quality that matters most", "A talk or speaker that had it", "How you could do the same"], talkKind: "opinion" },
  // Script or notes
  { id: "p054", text: "Should you write a talk out word for word, or speak from notes?", angles: ["Your answer, in one sentence", "When the other way works better", "What you will do next time"], talkKind: "opinion" },
];

// Prompts retired on 2026-10-15 for being small talk rather than speaking tasks; old sessions still show their text
const RETIRED_PROMPTS: ReadonlyArray<Prompt> = [
  // Prompt 1
  { id: "p001", text: "Describe a small thing that made your week better.", angles: ["What the small thing was, exactly", "Why it landed that week", "Whether you could make it happen again"] },
  // Prompt 2
  { id: "p002", text: "Tell me about a place you love going to.", angles: ["What it looks and sounds like when you arrive", "What you usually do there", "Why it matters to you more than other places"] },
  // Prompt 4
  { id: "p004", text: "Describe your last really good meal.", angles: ["Where you were and who you were with", "The one dish you still remember", "What made it more than just food"] },
  // Prompt 6
  { id: "p006", text: "Walk me through your ideal morning.", angles: ["The first thing you do after waking", "What you would cut from a normal morning", "How the rest of the day feels after it"] },
  // Prompt 7
  { id: "p007", text: "Tell me about a song you never skip.", angles: ["Where you first heard it", "The part you wait for every time", "What it brings back or makes you feel"] },
  // Prompt 9
  { id: "p009", text: "Describe someone who made you laugh recently.", angles: ["Who they are to you", "What they said or did", "Why it was so funny in the moment"] },
  // Prompt 10
  { id: "p010", text: "What is a small habit that helps you?", angles: ["What the habit is", "How you started it", "What changes on days you skip it"] },
  // Prompt 11
  { id: "p011", text: "Tell me about a trip you would take tomorrow if you could.", angles: ["Where you would go", "What you would do on the first day", "Who you would bring, or why you would go alone"] },
  // Prompt 12
  { id: "p012", text: "What is something you are quietly proud of?", angles: ["What it is", "Why you have kept it quiet", "What it says about you"] },
  // Prompt 13
  { id: "p013", text: "Describe your favorite room and what is in it.", angles: ["Where the room is and what it is for", "Two or three things in it that matter", "How you feel when you are in it"] },
  // Prompt 16
  { id: "p016", text: "What does a good weekend look like for you?", angles: ["How it starts on Saturday morning", "The one thing that has to happen", "How you want to feel by Sunday night"] },
  // Prompt 18
  { id: "p018", text: "What is something you are looking forward to?", angles: ["What it is and when it happens", "Why you are looking forward to it", "How you will make the most of it"] },
  // Prompt 20
  { id: "p020", text: "What is a smell or sound that brings back a memory?", angles: ["The smell or sound", "The memory it brings back", "Why that memory stayed with you"] },
  // Prompt 25
  { id: "p025", text: "Tell me about an object you have kept for years.", angles: ["What the object is", "How you came to have it", "Why you have never let it go"] },
  // Prompt 26
  { id: "p026", text: "What is a question you wish people asked you more?", angles: ["The question", "Why people do not ask it", "How you would answer it right now"] },
  // Prompt 27
  { id: "p027", text: "Describe the view from a window you know well.", angles: ["Where the window is", "What you see in the morning, then at night", "What the view means to you"] },
  // Prompt 28
  { id: "p028", text: "What is the best gift you have given?", angles: ["What the gift was and who it was for", "How you chose it", "How they reacted"] },
  // Prompt 29
  { id: "p029", text: "Tell me about a time you got lost.", angles: ["Where you were going", "The moment you realised you were lost", "How you found your way, and what you learned"] },
  // Prompt 30
  { id: "p030", text: "What is something you do differently from most people?", angles: ["What you do differently", "Where the habit came from", "Whether you would recommend it"] },
  // Prompt 31
  { id: "p031", text: "Describe a perfect rainy day.", angles: ["Where you would be", "What you would do, hour by hour", "Why rain makes it better"] },
  // Prompt 34
  { id: "p034", text: "What did you want to be when you were ten?", angles: ["What you wanted to be", "Why it appealed to you then", "What is left of that wish today"] },
  // Prompt 35
  { id: "p035", text: "Describe something you made with your hands.", angles: ["What you made", "How you went about it", "What you would do differently next time"] },
  // Prompt 36
  { id: "p036", text: "What would you do with a free afternoon today?", angles: ["What you would do first", "Who you would spend it with", "Why you do not do it more often"] },
];

// Easier prompts for 30-second warm-ups. DRAFT: approved at checkpoint C13 with the main prompts
export const WARMUP_PROMPTS: ReadonlyArray<Prompt> = [
  // Warm-up 1
  { id: "w001", text: "Describe what you can see right now." },
  // Warm-up 2
  { id: "w002", text: "What did you have for breakfast?" },
  // Warm-up 3
  { id: "w003", text: "Name three things you did yesterday." },
  // Warm-up 4
  { id: "w004", text: "What is the weather like where you are?" },
  // Warm-up 5
  { id: "w005", text: "Describe the last thing that made you smile." },
  // Warm-up 6
  { id: "w006", text: "What is your favorite snack, and why?" },
  // Warm-up 7
  { id: "w007", text: "Describe the shoes you are wearing." },
  // Warm-up 8
  { id: "w008", text: "What is one thing on your to-do list today?" },
  // Warm-up 9
  { id: "w009", text: "Tell me about the last place you walked to." },
  // Warm-up 10
  { id: "w010", text: "What sound can you hear right now?" },
  // Warm-up 11
  { id: "w011", text: "Describe your favorite mug or cup." },
  // Warm-up 12
  { id: "w012", text: "What is the last song you listened to?" },
  // Warm-up 13
  { id: "w013", text: "Name a color you like and where you see it." },
  // Warm-up 14
  { id: "w014", text: "What would you cook tonight if you could?" },
  // Warm-up 15
  { id: "w015", text: "Describe the room you are in." },
  // Warm-up 16
  { id: "w016", text: "What is one small thing you are looking forward to?" },
  // Warm-up 17
  { id: "w017", text: "Tell me about a plant, pet, or tree you know." },
  // Warm-up 18
  { id: "w018", text: "What did you do last Saturday?" },
  // Warm-up 19
  { id: "w019", text: "Describe your route to work or school." },
  // Warm-up 20
  { id: "w020", text: "What is your favorite time of day?" },
  // Warm-up 21
  { id: "w021", text: "What is something you bought recently?" },
  // Warm-up 22
  { id: "w022", text: "Describe a smell you like." },
  // Warm-up 23
  { id: "w023", text: "What app do you open first each morning?" },
  // Warm-up 24
  { id: "w024", text: "Tell me about the last film or show you watched." },
];

// Which end of a talk an openings and closings drill practises
export type BookendPart = "opening" | "close";

// An openings and closings drill prompt
export interface Bookend extends Prompt {
  // The opening or the close
  part: BookendPart;
}

// Openings and closings drill prompts: the first or last 30 to 45 seconds of a talk (plan step B2). The drill was retired in decision 106; the prompts stay so older drills still show their task in History and on their page
export const BOOKENDS: ReadonlyArray<Bookend> = [
  // Opening 1
  { id: "b001", part: "opening", text: "Open a talk on why your team needs a new tool." },
  // Opening 2
  { id: "b002", part: "opening", text: "Open a wedding toast for an old friend." },
  // Opening 3
  { id: "b003", part: "opening", text: "Open a welcome talk for new starters on their first day." },
  // Opening 4
  { id: "b004", part: "opening", text: "Open a pitch for a small business idea." },
  // Opening 5
  { id: "b005", part: "opening", text: "Open a talk about a book that changed your mind." },
  // Opening 6
  { id: "b006", part: "opening", text: "Open a team update after a hard month." },
  // Opening 7
  { id: "b007", part: "opening", text: "Open a talk at a school career day." },
  // Opening 8
  { id: "b008", part: "opening", text: "Open a talk on your hobby to a room of beginners." },
  // Opening 9
  { id: "b009", part: "opening", text: "Open a fundraising appeal for a local cause." },
  // Opening 10
  { id: "b010", part: "opening", text: "Open a talk on a lesson you learned the hard way." },
  // Close 1
  { id: "b011", part: "close", text: "Close a talk asking your team to try a new tool." },
  // Close 2
  { id: "b012", part: "close", text: "Close a wedding toast and raise a glass." },
  // Close 3
  { id: "b013", part: "close", text: "Close a welcome talk for new starters." },
  // Close 4
  { id: "b014", part: "close", text: "Close a pitch with a clear ask." },
  // Close 5
  { id: "b015", part: "close", text: "Close a talk about a book with one line to remember." },
  // Close 6
  { id: "b016", part: "close", text: "Close a team update with what happens next." },
  // Close 7
  { id: "b017", part: "close", text: "Close a career-day talk with advice for students." },
  // Close 8
  { id: "b018", part: "close", text: "Close a talk on your hobby with a way to get started." },
  // Close 9
  { id: "b019", part: "close", text: "Close a fundraising appeal with what to give." },
  // Close 10
  { id: "b020", part: "close", text: "Close a talk on a lesson with the lesson itself." },
];

// Light questions for Table Topic: quick to grasp and easy to answer on the spot. DRAFT: approved at checkpoint C13
export const TABLE_TOPICS: ReadonlyArray<Prompt> = [
  // Table Topic 1
  { id: "t001", text: "Morning person or night person, and why?" },
  // Table Topic 2
  { id: "t002", text: "What food would you defend to anyone?" },
  // Table Topic 3
  { id: "t003", text: "Cats or dogs?" },
  // Table Topic 4
  { id: "t004", text: "What is the best season of the year?" },
  // Table Topic 5
  { id: "t005", text: "Which app could you not live without?" },
  // Table Topic 6
  { id: "t006", text: "What is your favourite way to spend a Sunday?" },
  // Table Topic 7
  { id: "t007", text: "Tea or coffee, and how do you take it?" },
  // Table Topic 8
  { id: "t008", text: "What would you name a boat?" },
  // Table Topic 9
  { id: "t009", text: "Which superpower would you choose?" },
  // Table Topic 10
  { id: "t010", text: "What is the best snack?" },
  // Table Topic 11
  { id: "t011", text: "Beach holiday or city break?" },
  // Table Topic 12
  { id: "t012", text: "What is a song you would sing at karaoke?" },
  // Table Topic 13
  { id: "t013", text: "Which era would you visit for one day?" },
  // Table Topic 14
  { id: "t014", text: "What is your go-to comfort film?" },
  // Table Topic 15
  { id: "t015", text: "Would you rather be early or exactly on time?" },
  // Table Topic 16
  { id: "t016", text: "What makes a perfect sandwich?" },
  // Table Topic 17
  { id: "t017", text: "What is the most overrated food?" },
  // Table Topic 18
  { id: "t018", text: "Books or audiobooks?" },
  // Table Topic 19
  { id: "t019", text: "What would your dream job be for one week?" },
  // Table Topic 20
  { id: "t020", text: "What is a hobby you would like to try?" },
  // Table Topic 21
  { id: "t021", text: "Which animal would make the best roommate?" },
  // Table Topic 22
  { id: "t022", text: "What is your favourite word?" },
  // Table Topic 23
  { id: "t023", text: "Sunrise or sunset?" },
  // Table Topic 24
  { id: "t024", text: "What is the best thing about rainy days?" },
  // Table Topic 25
  { id: "t025", text: "What would you do with an extra hour each day?" },
  // Table Topic 26
  { id: "t026", text: "What is a small luxury you love?" },
  // Table Topic 27
  { id: "t027", text: "Which fictional place would you visit?" },
  // Table Topic 28
  { id: "t028", text: "What is the best board game?" },
  // Table Topic 29
  { id: "t029", text: "Mountains or the sea?" },
  // Table Topic 30
  { id: "t030", text: "What is your favourite smell?" },
  // Table Topic 31
  { id: "t031", text: "Which household chore do you secretly enjoy?" },
  // Table Topic 32
  { id: "t032", text: "What is the best piece of clothing you own?" },
  // Table Topic 33
  { id: "t033", text: "What would your theme song be?" },
  // Table Topic 34
  { id: "t034", text: "Pizza toppings: what belongs and what does not?" },
  // Table Topic 35
  { id: "t035", text: "What is a skill everyone should have?" },
  // Table Topic 36
  { id: "t036", text: "What is the best way to spend a long train ride?" },
];

// One text to read aloud: a public-domain speech or a passage written for practice
export interface Passage extends Prompt {
  // A famous speech, a passage written for the app, a pause drill (a passage with " / " where to pause), or a list of tricky words
  kind: "speech" | "practice" | "pause" | "words";
  // Short title shown above the text (also used as the prompt text in history)
  title: string;
  // Who gave the speech and when, or "Practice passage"
  source: string;
  // The words to read
  body: string;
}

// Texts to read aloud: public-domain speeches (all U.S. works from before 1962 or official addresses by U.S. presidents) and passages written for practice. DRAFT: approved at checkpoint C13; speech texts to be checked against a published source
export const PASSAGES: ReadonlyArray<Passage> = [
  // Passage 1
  { id: "r001", kind: "speech", title: "The Gettysburg Address", source: "Abraham Lincoln, 1863", text: "The Gettysburg Address", body: "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this. But, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth." },
  // Passage 2
  { id: "r002", kind: "speech", title: "With malice toward none", source: "Abraham Lincoln, 1865", text: "With malice toward none", body: "With malice toward none, with charity for all, with firmness in the right as God gives us to see the right, let us strive on to finish the work we are in, to bind up the nation's wounds, to care for him who shall have borne the battle and for his widow and his orphan, to do all which may achieve and cherish a just and lasting peace among ourselves and with all nations." },
  // Passage 3
  { id: "r003", kind: "speech", title: "The only thing we have to fear", source: "Franklin D. Roosevelt, 1933", text: "The only thing we have to fear", body: "This is preeminently the time to speak the truth, the whole truth, frankly and boldly. Nor need we shrink from honestly facing conditions in our country today. This great Nation will endure as it has endured, will revive and will prosper. So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself—nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance." },
  // Passage 4
  { id: "r004", kind: "speech", title: "Ask not", source: "John F. Kennedy, 1961", text: "Ask not", body: "In the long history of the world, only a few generations have been granted the role of defending freedom in its hour of maximum danger. I do not shrink from this responsibility—I welcome it. I do not believe that any of us would exchange places with any other people or any other generation. The energy, the faith, the devotion which we bring to this endeavor will light our country and all who serve it—and the glow from that fire can truly light the world. And so, my fellow Americans: ask not what your country can do for you—ask what you can do for your country." },
  // Passage 5
  { id: "r005", kind: "speech", title: "The man in the arena", source: "Theodore Roosevelt, 1910", text: "The man in the arena", body: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly; who errs, and comes short again and again, because there is no effort without error and shortcoming; but who does actually strive to do the deeds; who knows the great enthusiasms, the great devotions; who spends himself in a worthy cause; who at the best knows in the end the triumph of high achievement, and who at the worst, if he fails, at least fails while daring greatly, so that his place shall never be with those cold and timid souls who neither know victory nor defeat." },
  // Passage 6
  { id: "r006", kind: "speech", title: "On women's right to vote", source: "Susan B. Anthony, 1873", text: "On women's right to vote", body: "Friends and fellow citizens: I stand before you tonight under indictment for the alleged crime of having voted at the last presidential election, without having a lawful right to vote. It shall be my work this evening to prove to you that in thus voting, I not only committed no crime, but, instead, simply exercised my citizen's rights, guaranteed to me and all United States citizens by the National Constitution, beyond the power of any state to deny." },
  // Passage 7
  { id: "r007", kind: "practice", title: "Short and steady", source: "Practice passage", text: "Short and steady", body: "The morning was cold. The bus was late. I stood at the corner with my hands in my pockets and watched the street wake up. A baker carried trays into a shop. A dog pulled its owner toward the park. Somewhere a radio played an old song. When the bus finally came, I was almost sorry to leave. Some mornings ask you to wait. This one gave me something to watch while I did." },
  // Passage 8
  { id: "r008", kind: "practice", title: "Pause at the commas", source: "Practice passage", text: "Pause at the commas", body: "When you speak to a room, the pauses matter as much as the words. A pause before a key point tells the audience to listen. A pause after it, short and deliberate, lets the point land. Most nervous speakers rush, because silence feels long from the inside. From the outside, it feels like confidence. So slow down, breathe at the commas, and let each sentence finish before you begin the next one." },
  // Passage 9
  { id: "r009", kind: "practice", title: "Names and numbers", source: "Practice passage", text: "Names and numbers", body: "Our team grew from four people in 2019 to forty-two people today. We opened offices in Denver, Toronto, and Lisbon, and we now serve customers in eleven countries. Last year, revenue rose by thirty-eight percent, and customer complaints fell by half. Maria Gonzalez leads operations, David Okafor leads engineering, and Priya Raman leads design. Next quarter, we plan to hire fifteen more people and open a fourth office in Melbourne." },
  // Passage 10
  { id: "r010", kind: "practice", title: "One long sentence", source: "Practice passage", text: "One long sentence", body: "If you have ever stood up to speak and felt your heart pounding, your hands shaking, and your mind racing ahead to everything that could go wrong, then you already know that the hardest part of any talk is not the middle or the end, but the first few seconds, when every eye in the room turns toward you and waits, and the only thing that carries you through is a first sentence you have practised so often that it comes out on its own." },
  // Passage 11
  { id: "r011", kind: "practice", title: "Crisp consonants", source: "Practice passage", text: "Crisp consonants", body: "Clear speech starts with the ends of words. Practise saying the last letter of each word: the t in fact, the d in planned, the k in task. Try it with this line: the project's budget, timeline and key results were checked twice, signed off, and sent back by Tuesday. Then try it faster without losing a single sound. Precise speech sounds prepared, and prepared speech sounds trustworthy." },
  // Passage 12
  { id: "r012", kind: "practice", title: "A small story", source: "Practice passage", text: "A small story", body: "My grandmother kept a jar of buttons on the kitchen windowsill. When I was small, she would pour them onto the table and tell me where each one came from. This one, she said, was from the coat she wore to her first job. That one came from my grandfather's wedding shirt. I thought they were just buttons. Years later, when the jar came to me, I understood. She had not been keeping buttons. She had been keeping the stories that went with them." },
  // Speech: Give me liberty (added 2026-10-16)
  { id: "r013", kind: "speech", title: "Give me liberty", source: "Patrick Henry, 1775", text: "Give me liberty", body: "It is in vain, sir, to extenuate the matter. Gentlemen may cry, Peace, Peace—but there is no peace. The war is actually begun! The next gale that sweeps from the north will bring to our ears the clash of resounding arms! Our brethren are already in the field! Why stand we here idle? What is it that gentlemen wish? What would they have? Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery? Forbid it, Almighty God! I know not what course others may take; but as for me, give me liberty or give me death!" },
  // Speech: What to the slave is the Fourth of July? (added 2026-10-16)
  { id: "r014", kind: "speech", title: "What to the slave is the Fourth of July?", source: "Frederick Douglass, 1852", text: "What to the slave is the Fourth of July?", body: "What, to the American slave, is your Fourth of July? I answer: a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a sham; your boasted liberty, an unholy license; your national greatness, swelling vanity; your sounds of rejoicing are empty and heartless; your denunciations of tyrants, brass fronted impudence; your shouts of liberty and equality, hollow mockery; your prayers and hymns, your sermons and thanksgivings, with all your religious parade, and solemnity, are, to him, mere bombast, fraud, deception, impiety, and hypocrisy." },
  // Speech: A house divided (added 2026-10-16)
  { id: "r015", kind: "speech", title: "A house divided", source: "Abraham Lincoln, 1858", text: "A house divided", body: "We are now far into the fifth year, since a policy was initiated, with the avowed object, and confident promise, of putting an end to slavery agitation. Under the operation of that policy, that agitation has not only, not ceased, but has constantly augmented. In my opinion, it will not cease, until a crisis shall have been reached, and passed. “A house divided against itself cannot stand.” I believe this government cannot endure, permanently half slave and half free. I do not expect the Union to be dissolved—I do not expect the house to fall—but I do expect it will cease to be divided. It will become all one thing or all the other." },
  // Speech: I will fight no more forever (added 2026-10-16)
  { id: "r016", kind: "speech", title: "I will fight no more forever", source: "Chief Joseph, 1877", text: "I will fight no more forever", body: "Tell General Howard I know his heart. What he told me before, I have it in my heart. I am tired of fighting. Our chiefs are killed. Looking Glass is dead. The old men are all dead. It is the young men who say yes or no. He who led on the young men is dead. It is cold, and we have no blankets. The little children are freezing to death. My people, some of them, have run away to the hills, and have no blankets, no food. No one knows where they are—perhaps freezing to death. I want to have time to look for my children, and see how many of them I can find. Maybe I shall find them among the dead. Hear me, my chiefs! I am tired. My heart is sick and sad. From where the sun now stands I will fight no more forever." },
  // Speech: Cast down your bucket (added 2026-10-16)
  { id: "r017", kind: "speech", title: "Cast down your bucket", source: "Booker T. Washington, 1895", text: "Cast down your bucket", body: "A ship lost at sea for many days suddenly sighted a friendly vessel. From the mast of the unfortunate vessel was seen a signal, “Water, water; we die of thirst!” The answer from the friendly vessel at once came back, “Cast down your bucket where you are.” A second time the signal, “Water, water; send us water!” ran up from the distressed vessel, and was answered, “Cast down your bucket where you are.” And a third and fourth signal for water was answered, “Cast down your bucket where you are.” The captain of the distressed vessel, at last heeding the injunction, cast down his bucket, and it came up full of fresh, sparkling water from the mouth of the Amazon River." },
  // Speech: The strenuous life (added 2026-10-16)
  { id: "r018", kind: "speech", title: "The strenuous life", source: "Theodore Roosevelt, 1899", text: "The strenuous life", body: "I wish to preach, not the doctrine of ignoble ease, but the doctrine of the strenuous life, the life of toil and effort, of labor and strife; to preach that highest form of success which comes, not to the man who desires mere easy peace, but to the man who does not shrink from danger, from hardship, or from bitter toil, and who out of these wins the splendid ultimate triumph." },
  // Speech: Safe for democracy (added 2026-10-16)
  { id: "r019", kind: "speech", title: "Safe for democracy", source: "Woodrow Wilson, 1917", text: "Safe for democracy", body: "The world must be made safe for democracy. Its peace must be planted upon the tested foundations of political liberty. We have no selfish ends to serve. We desire no conquest, no dominion. We seek no indemnities for ourselves, no material compensation for the sacrifices we shall freely make. We are but one of the champions of the rights of mankind." },
  // Speech: The four freedoms (added 2026-10-16)
  { id: "r020", kind: "speech", title: "The four freedoms", source: "Franklin D. Roosevelt, 1941", text: "The four freedoms", body: "In the future days, which we seek to make secure, we look forward to a world founded upon four essential human freedoms. The first is freedom of speech and expression—everywhere in the world. The second is freedom of every person to worship God in his own way—everywhere in the world. The third is freedom from want—which, translated into world terms, means economic understandings which will secure to every nation a healthy peacetime life for its inhabitants—everywhere in the world. The fourth is freedom from fear—which, translated into world terms, means a world-wide reduction of armaments to such a point and in such a thorough fashion that no nation will be in a position to commit an act of physical aggression against any neighbor—anywhere in the world." },
  // Speech: A date which will live in infamy (added 2026-10-16)
  { id: "r021", kind: "speech", title: "A date which will live in infamy", source: "Franklin D. Roosevelt, 1941", text: "A date which will live in infamy", body: "Yesterday, December 7th, 1941—a date which will live in infamy—the United States of America was suddenly and deliberately attacked by naval and air forces of the Empire of Japan. The United States was at peace with that Nation and, at the solicitation of Japan, was still in conversation with its Government and its Emperor looking toward the maintenance of peace in the Pacific." },
  // Speech: The military-industrial complex (added 2026-10-16)
  { id: "r022", kind: "speech", title: "The military-industrial complex", source: "Dwight D. Eisenhower, 1961", text: "The military-industrial complex", body: "In the councils of government, we must guard against the acquisition of unwarranted influence, whether sought or unsought, by the military-industrial complex. The potential for the disastrous rise of misplaced power exists and will persist. We must never let the weight of this combination endanger our liberties or democratic processes. We should take nothing for granted. Only an alert and knowledgeable citizenry can compel the proper meshing of the huge industrial and military machinery of defense with our peaceful methods and goals, so that security and liberty may prosper together." },
  // Speech: We choose to go to the moon (added 2026-10-16)
  { id: "r023", kind: "speech", title: "We choose to go to the moon", source: "John F. Kennedy, 1962", text: "We choose to go to the moon", body: "We choose to go to the moon. We choose to go to the moon in this decade and do the other things, not because they are easy, but because they are hard, because that goal will serve to organize and measure the best of our energies and skills, because that challenge is one that we are willing to accept, one we are unwilling to postpone, and one which we intend to win, and the others, too." },
  // Speech: Safe for diversity (added 2026-10-16)
  { id: "r024", kind: "speech", title: "Safe for diversity", source: "John F. Kennedy, 1963", text: "Safe for diversity", body: "So, let us not be blind to our differences—but let us also direct attention to our common interests and to the means by which those differences can be resolved. And if we cannot end now our differences, at least we can help make the world safe for diversity. For, in the final analysis, our most basic common link is that we all inhabit this small planet. We all breathe the same air. We all cherish our children's future. And we are all mortal." },
];

// Pause drills: passages with " / " where a deliberate pause belongs. DRAFT: approved at checkpoint C13
export const PAUSE_DRILLS: ReadonlyArray<Passage> = [
  // Drill 1
  { id: "d001", kind: "pause", title: "Before the point", source: "Pause drill", text: "Before the point", body: "Good evening, everyone. / Tonight I want to talk about one simple idea. / Most of us speak too fast when we are nervous. / The cure is not to slow every word. / It is to stop, / just for a moment, / before the words that matter most. / Try it now. / Pause, / and then say the thing you came to say." },
  // Drill 2
  { id: "d002", kind: "pause", title: "Three steps", source: "Pause drill", text: "Three steps", body: "There are three steps to a strong opening. / First, stand still and look at the room. / Second, breathe in, slowly. / Third, say your first sentence to one person, not to everyone. / That is all. / Three steps, / and the hardest part of the talk is behind you." },
  // Drill 3
  { id: "d003", kind: "pause", title: "The numbers", source: "Pause drill", text: "The numbers", body: "Last year we answered twelve thousand calls. / This year, / we answered twenty thousand. / That is not a small change. / It means more people trusted us, / and more people needed us. / So the question for next year is simple. / Can we keep that trust / while we grow?" },
  // Drill 4
  { id: "d004", kind: "pause", title: "A short story", source: "Pause drill", text: "A short story", body: "When I was nine, / I forgot every word of my school speech. / I stood there, / silent, / for what felt like an hour. / Then a teacher at the back nodded at me. / Just a nod. / I found my first line, / and the rest came with it. / I still look for that nod in every room." },
  // Drill 5
  { id: "d005", kind: "pause", title: "The closing line", source: "Pause drill", text: "The closing line", body: "Thank you all for being here. / We have covered a lot today, / but if you remember one thing, / let it be this. / You do not need to be fearless to speak well. / You only need to keep going / while the fear is still there. / Thank you." },
  // Drill 6: a pause for effect, one to two seconds before the key word (decision 80)
  { id: "d006", kind: "pause", title: "Pause for effect", source: "Pause drill", text: "Pause for effect", body: "And the award goes to / you. / There was one thing / that changed everything. / The answer, / it turns out, / was right in front of us / all along." },
  // Drill 7: a pause after a question, so it lands
  { id: "d007", kind: "pause", title: "Question pause", source: "Pause drill", text: "Question pause", body: "What would you do with one extra hour a day? / Most of us would say: rest. / So why do we fill every hour we already have? / Think about it. / What would you stop doing? /" },
  // Drill 8: a pause between points
  { id: "d008", kind: "pause", title: "Between points", source: "Pause drill", text: "Between points", body: "Three things matter this year. / First, our customers. / Second, our people. / And third, / the way we work together. / Customers, / people, / and how we work." },
];

// Lists of words that are easy to stumble on, for the practice library. DRAFT: approved at checkpoint C13
export const TRICKY_WORDS: ReadonlyArray<Passage> = [
  // List 1
  { id: "k001", kind: "words", title: "Everyday tricky words", source: "Tricky words", text: "Everyday tricky words", body: "specific, statistics, particularly, February, library, probably, recognize, comfortable, temperature, vegetable, sixth, clothes" },
  // List 2
  { id: "k002", kind: "words", title: "Business words", source: "Tricky words", text: "Business words", body: "entrepreneur, quarterly, deliverables, prioritize, accessibility, infrastructure, regulatory, anonymity, preliminary, simultaneously, thoroughly, hierarchy" },
  // List 3
  { id: "k003", kind: "words", title: "Sound-alike pairs", source: "Tricky words", text: "Sound-alike pairs", body: "accept, except, affect, effect, then, than, quite, quiet, desert, dessert, specific, Pacific, conscience, conscious" },
  // List 4
  { id: "k004", kind: "words", title: "Long words, steady pace", source: "Tricky words", text: "Long words, steady pace", body: "responsibility, opportunity, organization, communication, collaboration, determination, characteristic, representative, unfortunately, approximately, environmental, extraordinary" },
];

// Day the rotation counts from
const START = new Date(2026, 0, 1);

// Greatest common divisor, used to pick a step that visits every prompt
function gcd(a: number, b: number): number {
  // Euclid's method
  return b === 0 ? a : gcd(b, a % b);
}

// A step through the list that shares no factor with its length, so every prompt comes up before any repeats
function stride(count: number): number {
  // Start at 7 so neighboring days get unrelated prompts
  let step = 7;
  // Move up until the step shares no factor with the count
  while (gcd(step, count) !== 1) step += 1;
  // Hand back the step
  return step;
}

// Pick from a list for a given day, stepping so neighboring days get unrelated items; offset moves along the list
function pickForDay(list: ReadonlyArray<Prompt>, day: Date, offset: number): Prompt {
  // Count calendar days since the start of the rotation
  const dayNumber = daysBetween(START, day);
  // Number of items
  const count = list.length;
  // Step through the list, wrapping around, and keep the result positive
  const index = (((dayNumber * stride(count) + offset) % count) + count) % count;
  // Look up the item (always present because the index is in range)
  return list[index] as Prompt;
}

// The prompt for a given day; "choose another" asks for the next one along with offset 1, 2, ...
export function promptForDay(day: Date, offset = 0): Prompt {
  // Pick from the full prompts
  return pickForDay(PROMPTS, day, offset);
}

// The warm-up prompt for a given day
export function warmupPromptForDay(day: Date, offset = 0): Prompt {
  // Pick from the warm-up prompts
  return pickForDay(WARMUP_PROMPTS, day, offset);
}

// The Table Topic for a given day; "choose another" moves it along with the main prompt
export function tableTopicForDay(day: Date, offset = 0): Prompt {
  // Pick from the Table Topics
  return pickForDay(TABLE_TOPICS, day, offset);
}

// The passage to read aloud for a given day; "choose another" moves it along with the main prompt
export function passageForDay(day: Date, offset = 0): Passage {
  // Pick from the passages
  return pickForDay(PASSAGES, day, offset) as Passage;
}

// The pause drill for a given day
export function drillForDay(day: Date, offset = 0): Passage {
  // Pick from the pause drills
  return pickForDay(PAUSE_DRILLS, day, offset) as Passage;
}

// Find a passage, pause drill, or word list by its saved id
export function findPassage(id: string): Passage | undefined {
  // Look in every list of texts, and the check-in's passage (decision 100)
  return [...PASSAGES, ...PAUSE_DRILLS, ...TRICKY_WORDS, CHECK_IN_PASSAGE].find((passage) => passage.id === id);
}

// Find any prompt (Record Response, Table Topic, opening or close, warm-up, or the title of a passage, drill, word list, or lesson) by its saved id
export function findPrompt(id: string): Prompt | undefined {
  // Look in every list
  return [...PROMPTS, ...RETIRED_PROMPTS, ...TABLE_TOPICS, ...BOOKENDS, ...WARMUP_PROMPTS, ...PASSAGES, ...PAUSE_DRILLS, ...TRICKY_WORDS, ...LESSONS, ...SMALL_TALK_PROMPTS, CHECK_IN_PASSAGE, ...CHECK_IN_QUESTIONS].find((prompt) => prompt.id === id);
}
