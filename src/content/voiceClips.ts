// Saved recordings of the app's fixed lines (decision 82): every small-talk line and shadowing phrase, read once by an ElevenLabs voice and kept in public/clips, so playing one needs no request, no key and no connection after the first time

// One saved recording
export interface VoiceClip {
  // Its file in public/clips, without ".mp3" (lines with the same words share one)
  file: string;
  // Its length in seconds, to a tenth
  seconds: number;
  // The words it says, as they were when it was made (a check fails when the line changes, so the recording is made again)
  text: string;
}

// The saved recordings, by line id: small talk in Jessica's voice, shadowing in Graham's (how each was read is in documents/content-sources.md)
export const VOICE_CLIPS: Readonly<Record<string, VoiceClip>> = {
  // Everyday questions
  // Jessica, read as written
  st01: { file: "st01", seconds: 1.5, text: "How was your weekend?" },
  // Jessica, read as written
  st02: { file: "st02", seconds: 1.9, text: "What did you get up to this weekend?" },
  // Jessica, read as written
  st03: { file: "st03", seconds: 1.2, text: "How was your trip?" },
  // Jessica, read as written
  st04: { file: "st04", seconds: 1.5, text: "Anything fun lately?" },
  // Jessica, read as written
  st05: { file: "st05", seconds: 1.2, text: "How have you been?" },
  // Jessica, read as written
  st06: { file: "st06", seconds: 1.7, text: "What did you do yesterday?" },
  // Jessica, read as written
  st07: { file: "st07", seconds: 1.3, text: "How was your holiday?" },
  // Jessica, read as written
  st08: { file: "st08", seconds: 1.7, text: "So what's new with you?" },
  // Jessica, read as written
  st09: { file: "st09", seconds: 1.2, text: "How was your week?" },
  // Jessica, read as written
  st10: { file: "st10", seconds: 1.4, text: "How's work going?" },
  // Jessica, read as written
  st11: { file: "st11", seconds: 1.8, text: "What are you working on these days?" },
  // Jessica, read as written
  st12: { file: "st12", seconds: 1.7, text: "So what do you do?" },
  // Jessica, read as written
  st13: { file: "st13", seconds: 1.5, text: "Busy week at work?" },
  // Jessica, read as written
  st14: { file: "st14", seconds: 2.0, text: "How did you get into what you do?" },
  // Jessica, read as written
  st15: { file: "st15", seconds: 2.0, text: "What's keeping you busy these days?" },
  // Jessica, read as written
  st16: { file: "st16", seconds: 1.5, text: "Seen anything good lately?" },
  // Jessica, read as written
  st17: { file: "st17", seconds: 1.6, text: "Read anything good recently?" },
  // Jessica, read as written
  st18: { file: "st18", seconds: 1.4, text: "What do you do for fun?" },
  // Jessica, read as written
  st19: { file: "st19", seconds: 1.8, text: "Been anywhere good to eat lately?" },
  // Jessica, read as written
  st20: { file: "st20", seconds: 1.5, text: "Listening to anything good?" },
  // Jessica, read as written
  st21: { file: "st21", seconds: 2.0, text: "Got any hobbies at the moment?" },
  // Jessica, read as written
  st22: { file: "st22", seconds: 1.6, text: "Anything fun coming up?" },
  // Jessica, read as written
  st23: { file: "st23", seconds: 1.6, text: "Doing anything this weekend?" },
  // Jessica, read as written
  st24: { file: "st24", seconds: 1.7, text: "Any plans for the holidays?" },
  // Jessica, read as written
  st25: { file: "st25", seconds: 1.5, text: "Got any trips planned?" },
  // Jessica, read as written
  st26: { file: "st26", seconds: 2.1, text: "What are you looking forward to this month?" },
  // Jessica, read as written
  st27: { file: "st27", seconds: 1.4, text: "What's next for you?" },
  // Answering lessons
  // Same words as st01, so the same recording
  stl1: { file: "st01", seconds: 1.5, text: "How was your weekend?" },
  // Jessica, read as written
  stl2: { file: "stl2", seconds: 1.8, text: "What did you get up to yesterday?" },
  // Same words as st16, so the same recording
  stl3: { file: "st16", seconds: 1.5, text: "Seen anything good lately?" },
  // Same words as st10, so the same recording
  stl4: { file: "st10", seconds: 1.4, text: "How's work going?" },
  // Same words as st03, so the same recording
  stl5: { file: "st03", seconds: 1.2, text: "How was your trip?" },
  // Same words as st08, so the same recording
  stl6: { file: "st08", seconds: 1.7, text: "So what's new with you?" },
  // Asking lessons
  // Jessica, read as written
  sal1: { file: "sal1", seconds: 2.0, text: "I've been learning to make bread." },
  // Jessica, read as written
  sal2: { file: "sal2", seconds: 2.8, text: "I went to my first climbing class on Saturday." },
  // Jessica, read as written
  sal3: { file: "sal3", seconds: 2.0, text: "We adopted a dog last week." },
  // News lessons
  // Jessica, [excited]
  snl1: { file: "snl1", seconds: 2.6, text: "We just found out we're having a baby." },
  // Jessica, [disappointed]
  snl2: { file: "snl2", seconds: 2.9, text: "I didn't get into the course I applied for." },
  // Jessica, [happy]
  snl3: { file: "snl3", seconds: 3.0, text: "I finally finished my first marathon." },
  // Listening lessons
  // Jessica, [warmly]
  sll1: { file: "sll1", seconds: 8.0, text: "I lost my phone at a concert on Saturday. Two days later a woman emailed me. She'd found it in the grass and posted it back with a little note." },
  // Jessica, [sad]
  sll2: { file: "sll2", seconds: 10.2, text: "My best friend moved across the country last month. We used to get coffee every Sunday. Yesterday was the first Sunday I didn't know what to do with myself." },
  // Jessica, [warmly]
  sll3: { file: "sll3", seconds: 7.5, text: "My little brother called me out of nowhere to ask for advice about a girl. He has never asked me for advice about anything." },
  // Remarks to follow up on
  // Jessica, read as written
  sa01: { file: "sa01", seconds: 2.4, text: "I just got back from a week in Lisbon." },
  // Jessica, read as written
  sa02: { file: "sa02", seconds: 2.7, text: "We finally finished painting the house." },
  // Jessica, read as written
  sa03: { file: "sa03", seconds: 2.0, text: "I started running in the mornings." },
  // Jessica, read as written
  sa04: { file: "sa04", seconds: 2.1, text: "My sister's getting married next month." },
  // Jessica, read as written
  sa05: { file: "sa05", seconds: 2.4, text: "I've been teaching myself to play the piano." },
  // Jessica, read as written
  sa06: { file: "sa06", seconds: 3.1, text: "Work's been a lot. We're moving offices." },
  // Jessica, read as written
  sa07: { file: "sa07", seconds: 3.0, text: "I went to my first pottery class on Saturday." },
  // Jessica, read as written
  sa08: { file: "sa08", seconds: 1.8, text: "We got a kitten last week." },
  // Jessica, read as written
  sa09: { file: "sa09", seconds: 2.6, text: "I'm reading this book about octopuses." },
  // Jessica, read as written
  sa10: { file: "sa10", seconds: 2.0, text: "I just switched teams at work." },
  // Jessica, read as written
  sa11: { file: "sa11", seconds: 2.0, text: "We drove up the coast for the weekend." },
  // Jessica, read as written
  sa12: { file: "sa12", seconds: 2.9, text: "I've been trying to cook something new every week." },
  // Stories to respond to
  // Jessica, [laughs softly]
  sls01: { file: "sls01", seconds: 13.6, text: "So I was on the train this morning, and the man next to me fell asleep on my shoulder. I didn't want to wake him, so I missed my stop. I got to work twenty minutes late, and my boss was the one waiting in the lobby." },
  // Jessica, [warmly]
  sls02: { file: "sls02", seconds: 12.8, text: "I finally called my grandmother last night. I'd been putting it off for weeks. She talked for an hour about her garden, and at the end she said it was the best part of her week. I felt terrible for waiting so long." },
  // Jessica, [warmly]
  sls03: { file: "sls03", seconds: 11.6, text: "My car broke down on the highway on Friday. I was stuck on the shoulder for two hours in the rain. A stranger pulled over and waited with me until the tow truck came. He wouldn't even tell me his name." },
  // Jessica, [excited]
  sls04: { file: "sls04", seconds: 14.5, text: "I gave my first presentation to the whole company on Tuesday. I was so nervous I barely slept. Halfway through, the slides froze. I just kept talking, and afterwards three people came up to say it was the best talk of the day." },
  // Jessica, [laughs softly]
  sls05: { file: "sls05", seconds: 11.8, text: "We tried to take the kids camping. It rained the entire time, the tent leaked, and we ended up sleeping in the car. But the kids keep saying it was the best trip we've ever done." },
  // Jessica, [warmly]
  sls06: { file: "sls06", seconds: 12.4, text: "I ran into my old teacher at the grocery store. She remembered my name, and the essay I wrote in her class twenty years ago. I didn't know what to say. I just stood there holding a bag of onions." },
  // Jessica, [excited]
  sls07: { file: "sls07", seconds: 10.5, text: "I finally got the job. Six interviews, a take-home project, and two months of waiting. They called while I was in the dentist's chair, so I had to accept with a numb mouth." },
  // Jessica, [laughs softly]
  sls08: { file: "sls08", seconds: 13.6, text: "My neighbour knocked on my door at midnight because her cat was stuck on my roof. We spent an hour out there with a ladder and a flashlight. In the end the cat jumped down by itself and walked straight past us." },
  // News to respond to
  // Jessica, [excited]
  sn01: { file: "sn01", seconds: 3.4, text: "I got the job! The one I interviewed for last month." },
  // Jessica, [worried]
  sn02: { file: "sn02", seconds: 4.5, text: "My dog's been really sick this week. We're at the vet again tomorrow." },
  // Jessica, [happy]
  sn03: { file: "sn03", seconds: 2.2, text: "We just bought our first house." },
  // Jessica, [frustrated]
  sn04: { file: "sn04", seconds: 4.2, text: "My project got cancelled. Six months of work, gone." },
  // Jessica, [excited]
  sn05: { file: "sn05", seconds: 3.5, text: "My sister had her baby last night. I'm an aunt!" },
  // Jessica, [disappointed]
  sn06: { file: "sn06", seconds: 2.6, text: "I failed my driving test again." },
  // Jessica, [excited]
  sn07: { file: "sn07", seconds: 2.9, text: "I got into the masters programme I applied for." },
  // Jessica, [sad]
  sn08: { file: "sn08", seconds: 3.3, text: "We broke up last week. It's been a lot." },
  // Jessica, [happy]
  sn09: { file: "sn09", seconds: 4.0, text: "My book club picked the novel I wrote. They actually liked it." },
  // Jessica, [disappointed]
  sn10: { file: "sn10", seconds: 4.3, text: "I hurt my knee, so I have to pull out of the race I trained for." },
  // Shadowing phrases, then each whole passage
  // Graham, [slowly]
  "s01-1": { file: "s01-1", seconds: 3.0, text: "And so, my fellow Americans:" },
  // Graham, read as written
  "s01-2": { file: "s01-2", seconds: 2.8, text: "ask not what your country can do for you," },
  // Graham, read as: ask what YOU can do for your country.
  "s01-3": { file: "s01-3", seconds: 2.3, text: "ask what you can do for your country." },
  // Graham, read as: [slowly] And so, my fellow Americans… ask not what your country can do for you… ask what YOU can do for your country.
  "s01-all": { file: "s01-all", seconds: 9.1, text: "And so, my fellow Americans: ask not what your country can do for you, ask what you can do for your country." },
  // Graham, read as: With malice toward none… with charity for all,
  "s02-1": { file: "s02-1", seconds: 3.8, text: "With malice toward none, with charity for all," },
  // Graham, read as written
  "s02-2": { file: "s02-2", seconds: 3.8, text: "with firmness in the right as God gives us to see the right," },
  // Graham, read as: let us strive on to finish [slowly] the work we are in.
  "s02-3": { file: "s02-3", seconds: 4.7, text: "let us strive on to finish the work we are in." },
  // Graham, read as: With malice toward none… with charity for all, with firmness in the right as God gives us to see the right, let us strive on to finish [slowly] the work we are in.
  "s02-all": { file: "s02-all", seconds: 12.2, text: "With malice toward none, with charity for all, with firmness in the right as God gives us to see the right, let us strive on to finish the work we are in." },
  // Graham, [calm and deliberate]
  "s03-1": { file: "s03-1", seconds: 4.0, text: "So, first of all, let me assert my firm belief" },
  // Graham, [slowly]
  "s03-2": { file: "s03-2", seconds: 3.3, text: "that the only thing we have to fear" },
  // Graham, [softly]
  "s03-3": { file: "s03-3", seconds: 1.6, text: "is fear itself." },
  // Graham, read as: [calm and deliberate] So, first of all, let me assert my firm belief [slowly] that the only thing we have to fear… [softly] is fear itself.
  "s03-all": { file: "s03-all", seconds: 8.7, text: "So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself." },
  // Graham, read as: [excited] Here's the good news.
  "s04-1": { file: "s04-1", seconds: 1.6, text: "Here’s the good news." },
  // Graham, read as: [excited] We shipped ALL THREE features ON TIME.
  "s04-2": { file: "s04-2", seconds: 2.8, text: "We shipped all three features on time." },
  // Graham, [curious]
  "s04-3": { file: "s04-3", seconds: 1.4, text: "And the best part?" },
  // Graham, read as written
  "s04-4": { file: "s04-4", seconds: 1.4, text: "Customers noticed." },
  // Graham, read as: [excited] Here's the good news. We shipped ALL THREE features ON TIME. [curious] And the best part? [pause] Customers noticed.
  "s04-all": { file: "s04-all", seconds: 7.2, text: "Here’s the good news. We shipped all three features on time. And the best part? Customers noticed." },
  // Graham, read as: [warmly] I've known Sam since our first week at work.
  "s05-1": { file: "s05-1", seconds: 2.8, text: "I’ve known Sam since our first week at work." },
  // Graham, read as: [warmly] In that time, I've seen one thing… again and again.
  "s05-2": { file: "s05-2", seconds: 4.2, text: "In that time, I’ve seen one thing again and again." },
  // Graham, read as: [warmly] When it matters… Sam shows up.
  "s05-3": { file: "s05-3", seconds: 2.7, text: "When it matters, Sam shows up." },
  // Graham, [happy]
  "s05-4": { file: "s05-4", seconds: 2.4, text: "So please, raise your glasses." },
  // Graham, read as: [warmly] I've known Sam since our first week at work. In that time, I've seen one thing… again and again. When it matters… Sam shows up. [happy] So please, raise your glasses.
  "s05-all": { file: "s05-all", seconds: 11.7, text: "I’ve known Sam since our first week at work. In that time, I’ve seen one thing again and again. When it matters, Sam shows up. So please, raise your glasses." },
  // Graham, [calm and firm]
  "s06-1": { file: "s06-1", seconds: 2.2, text: "Let me be clear about one thing." },
  // Graham, [calm and firm]
  "s06-2": { file: "s06-2", seconds: 2.3, text: "We will not rush this decision." },
  // Graham, read as: [calm and firm] We will get it RIGHT.
  "s06-3": { file: "s06-3", seconds: 1.8, text: "We will get it right." },
  // Graham, read as: [calm and firm] And we will get it right… together.
  "s06-4": { file: "s06-4", seconds: 2.7, text: "And we will get it right together." },
  // Graham, read as: [calm and firm] Let me be clear about one thing. We will not rush this decision. We will get it RIGHT. And we will get it right… together.
  "s06-all": { file: "s06-all", seconds: 8.5, text: "Let me be clear about one thing. We will not rush this decision. We will get it right. And we will get it right together." },
};

// A line's saved recording: its address and length, or null when it has none
export function voiceClip(id: string): { url: string; seconds: number } | null {
  // Looked up by id (own entries only)
  const clip = Object.hasOwn(VOICE_CLIPS, id) ? VOICE_CLIPS[id] : undefined;
  // Its address and length, or none
  return clip ? { url: `/clips/${clip.file}.mp3`, seconds: clip.seconds } : null;
}
