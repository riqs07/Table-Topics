// Saved recordings of the app's fixed lines (decisions 82 and 83): every small-talk line, shadowing phrase and conversation character's line, read once by an ElevenLabs voice and kept in public/clips, so playing one needs no request, no key and no connection after the first time

// One saved recording
export interface VoiceClip {
  // Its file in public/clips, without ".mp3" (lines with the same words share one)
  file: string;
  // Its length in seconds, to a tenth
  seconds: number;
  // The words it says, as they were when it was made (a check fails when the line changes, so the recording is made again)
  text: string;
}

// The saved recordings, by line id: small talk in Jessica's voice, shadowing in Graham's, and each conversation character in their own (how each was read is in the comment above it)
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
  // Conversations: Maya, a new coworker at a party
  // Brittney, [cheerfully]
  "maya-01": { file: "maya-01", seconds: 4.9, text: "Hi! I don't think we've properly met. I'm Maya, I just joined your team." },
  // Brittney, [cheerfully]
  "maya-02": { file: "maya-02", seconds: 5.4, text: "Oh, hey! You're on my team, right? I'm Maya. I'm still learning everyone's names." },
  // Brittney, read as written
  "maya-03": { file: "maya-03", seconds: 1.0, text: "Mm-hmm." },
  // Brittney, [curious]
  "maya-04": { file: "maya-04", seconds: 1.0, text: "Yeah?" },
  // Brittney, read as written
  "maya-05": { file: "maya-05", seconds: 0.9, text: "Right." },
  // Brittney, [curious]
  "maya-06": { file: "maya-06", seconds: 0.8, text: "Oh?" },
  // Brittney, [curious]
  "maya-07": { file: "maya-07", seconds: 2.1, text: "So how was your weekend?" },
  // Brittney, read as written
  "maya-08": { file: "maya-08", seconds: 1.9, text: "How long have you been on the team?" },
  // Brittney, read as written
  "maya-09": { file: "maya-09", seconds: 2.0, text: "What do you get up to outside work?" },
  // Brittney, read as written
  "maya-10": { file: "maya-10", seconds: 1.5, text: "Been anywhere good lately?" },
  // Brittney, [playfully]
  "maya-11": { file: "maya-11", seconds: 4.0, text: "Okay, honestly, what's the best thing about working here?" },
  // Brittney, read as written
  "maya-12": { file: "maya-12", seconds: 2.4, text: "So what's keeping you busy these days?" },
  // Brittney, [curious]
  "maya-13": { file: "maya-13", seconds: 2.7, text: "Ooh. And how was it?" },
  // Brittney, [laughs]
  "maya-14": { file: "maya-14", seconds: 5.0, text: "Come on, there must be one good bit. What was the best part?" },
  // Brittney, read as written
  "maya-15": { file: "maya-15", seconds: 2.4, text: "Wait, how did you get into that?" },
  // Brittney, [laughs]
  "maya-16": { file: "maya-16", seconds: 1.7, text: "No way!" },
  // Brittney, read as written
  "maya-17": { file: "maya-17", seconds: 2.2, text: "Oh, that sounds amazing." },
  // Brittney, [laughs]
  "maya-18": { file: "maya-18", seconds: 2.5, text: "Ha! I love that." },
  // Brittney, [sympathetic]
  "maya-19": { file: "maya-19", seconds: 2.8, text: "Oh no, that sounds rough." },
  // Brittney, [surprised]
  "maya-20": { file: "maya-20", seconds: 1.4, text: "Wait, really?" },
  // Brittney, read as written
  "maya-21": { file: "maya-21", seconds: 1.7, text: "That's so cool." },
  // Brittney, [laughs]
  "maya-22": { file: "maya-22", seconds: 2.5, text: "Okay, fair enough." },
  // Brittney, read as written
  "maya-23": { file: "maya-23", seconds: 3.1, text: "Oh nice, I've always wanted to try that." },
  // Brittney, read as written
  "maya-24": { file: "maya-24", seconds: 4.4, text: "I moved here from Denver about a month ago, so everything's still new." },
  // Brittney, read as written
  "maya-25": { file: "maya-25", seconds: 4.5, text: "Honestly, the hardest part has been finding good coffee near the office." },
  // Brittney, [laughs]
  "maya-26": { file: "maya-26", seconds: 6.3, text: "My weekend? I finally unpacked the last box. It only took me four weeks." },
  // Brittney, read as written
  "maya-27": { file: "maya-27", seconds: 5.5, text: "I joined a running club on Saturday mornings. Mostly so I'd meet people, if I'm honest." },
  // Brittney, [laughs]
  "maya-28": { file: "maya-28", seconds: 4.6, text: "I'm always the one at the back, chatting instead of running." },
  // Brittney, read as written
  "maya-29": { file: "maya-29", seconds: 4.4, text: "I have a cat called Biscuit who yells at me at five every morning." },
  // Brittney, [laughs]
  "maya-30": { file: "maya-30", seconds: 6.7, text: "Biscuit figured out how to open the cupboard last week. I came home to cereal everywhere." },
  // Brittney, read as written
  "maya-31": { file: "maya-31", seconds: 5.1, text: "I used to work at a tiny startup, so a big team is a bit of a change." },
  // Brittney, read as written
  "maya-32": { file: "maya-32", seconds: 4.6, text: "I'm trying every taco place within walking distance. I'm on number six." },
  // Brittney, read as written
  "maya-33": { file: "maya-33", seconds: 4.4, text: "My sister visits next weekend, so I need somewhere fun to take her." },
  // Brittney, read as written
  "maya-34": { file: "maya-34", seconds: 1.1, text: "What about you?" },
  // Brittney, [laughs]
  "maya-35": { file: "maya-35", seconds: 4.3, text: "Anyway, enough about me. How's your week been?" },
  // Brittney, read as written
  "maya-36": { file: "maya-36", seconds: 4.0, text: "Sorry, I didn't quite catch that. It's so loud in here!" },
  // Brittney, read as: Oh, I think they're starting the toast. [warmly] It was really nice to talk to you!
  "maya-37": { file: "maya-37", seconds: 4.9, text: "Oh, I think they're starting the toast. It was really nice to talk to you!" },
  // Brittney, read as: I'm going to grab another drink, but let's get lunch this week. [warmly] Great chatting!
  "maya-38": { file: "maya-38", seconds: 4.8, text: "I'm going to grab another drink, but let's get lunch this week. Great chatting!" },
  // Conversations: Theo, someone quiet at work
  // Eddy, [softly]
  "theo-01": { file: "theo-01", seconds: 3.3, text: "Oh, hi. Are you here for the ten o'clock too?" },
  // Eddy, [softly]
  "theo-02": { file: "theo-02", seconds: 2.2, text: "Hey. Looks like we're early." },
  // Eddy, [softly]
  "theo-03": { file: "theo-03", seconds: 0.9, text: "Mm." },
  // Eddy, [softly]
  "theo-04": { file: "theo-04", seconds: 0.9, text: "Yeah." },
  // Eddy, [softly]
  "theo-05": { file: "theo-05", seconds: 0.9, text: "Mm-hmm." },
  // Eddy, [softly]
  "theo-06": { file: "theo-06", seconds: 1.0, text: "Right." },
  // Eddy, read as written
  "theo-07": { file: "theo-07", seconds: 1.6, text: "Yeah, it was fine." },
  // Eddy, read as written
  "theo-08": { file: "theo-08", seconds: 1.6, text: "Not much, really." },
  // Eddy, read as written
  "theo-09": { file: "theo-09", seconds: 1.1, text: "Pretty quiet." },
  // Eddy, [quietly]
  "theo-10": { file: "theo-10", seconds: 0.8, text: "Yeah." },
  // Eddy, read as written
  "theo-11": { file: "theo-11", seconds: 1.7, text: "Mm, it's okay." },
  // Eddy, [hesitantly]
  "theo-12": { file: "theo-12", seconds: 2.0, text: "I guess." },
  // Eddy, read as written
  "theo-13": { file: "theo-13", seconds: 1.8, text: "No, not really." },
  // Eddy, read as: [hesitantly] Well… I fix up old radios. [laughs softly] It's a bit of a strange hobby.
  "theo-14": { file: "theo-14", seconds: 6.3, text: "Well… I fix up old radios. It's a bit of a strange hobby." },
  // Eddy, read as written
  "theo-15": { file: "theo-15", seconds: 5.1, text: "Mostly ones from the fifties. You find them broken at flea markets for almost nothing." },
  // Eddy, [warmly]
  "theo-16": { file: "theo-16", seconds: 6.2, text: "The best bit is when one crackles back to life for the first time. That sound gets me every time." },
  // Eddy, read as written
  "theo-17": { file: "theo-17", seconds: 4.0, text: "My grandad had one in his kitchen. I think that's where it started." },
  // Eddy, read as written
  "theo-18": { file: "theo-18", seconds: 5.3, text: "Last weekend I finished one that took me three months. It actually picks up stations now." },
  // Eddy, [laughs softly]
  "theo-19": { file: "theo-19", seconds: 4.9, text: "I've got eleven of them. My flatmate says that's ten too many." },
  // Eddy, read as written
  "theo-20": { file: "theo-20", seconds: 4.8, text: "Sometimes I just sit and listen to old jazz on them. It's really calming." },
  // Eddy, [a little excited]
  "theo-21": { file: "theo-21", seconds: 5.3, text: "There's a radio fair this weekend, two hours away. I've been looking forward to it for weeks." },
  // Eddy, read as written
  "theo-22": { file: "theo-22", seconds: 4.2, text: "I've been here about three years. I like our corner. It's quiet." },
  // Eddy, [nervous]
  "theo-23": { file: "theo-23", seconds: 5.3, text: "Honestly, I'm a bit nervous about this meeting. I have to present the numbers." },
  // Eddy, [laughs softly]
  "theo-24": { file: "theo-24", seconds: 2.6, text: "Yeah, exactly." },
  // Eddy, read as written
  "theo-25": { file: "theo-25", seconds: 1.2, text: "Oh, cool." },
  // Eddy, read as written
  "theo-26": { file: "theo-26", seconds: 1.9, text: "Huh. That's interesting." },
  // Eddy, [softly]
  "theo-27": { file: "theo-27", seconds: 1.4, text: "Oh no." },
  // Eddy, [softly]
  "theo-28": { file: "theo-28", seconds: 1.2, text: "That's nice." },
  // Eddy, [laughs softly]
  "theo-29": { file: "theo-29", seconds: 2.4, text: "Ha. Yeah." },
  // Eddy, read as written
  "theo-30": { file: "theo-30", seconds: 2.2, text: "What about you? Do you have a hobby?" },
  // Eddy, read as written
  "theo-31": { file: "theo-31", seconds: 1.6, text: "How long have you been here?" },
  // Eddy, [curious]
  "theo-32": { file: "theo-32", seconds: 2.1, text: "Are you presenting anything today?" },
  // Eddy, read as written
  "theo-33": { file: "theo-33", seconds: 1.5, text: "Sorry, what was that?" },
  // Eddy, [awkward]
  "theo-34": { file: "theo-34", seconds: 2.1, text: "Um… yeah." },
  // Eddy, read as: Oh, people are coming in. [softly] Thanks for chatting. That was nice.
  "theo-35": { file: "theo-35", seconds: 4.3, text: "Oh, people are coming in. Thanks for chatting. That was nice." },
  // Eddy, read as: I should set up my laptop. [softly] Talk later?
  "theo-36": { file: "theo-36", seconds: 2.9, text: "I should set up my laptop. Talk later?" },
  // Conversations: Chris, a friend having a rough week
  // Chris, [sighs]
  "chris-01": { file: "chris-01", seconds: 4.7, text: "Hey. Sorry I'm late. It's been… a week." },
  // Chris, [tired]
  "chris-02": { file: "chris-02", seconds: 3.9, text: "Hi. Thanks for meeting up. I really needed this." },
  // Chris, [tired]
  "chris-03": { file: "chris-03", seconds: 1.1, text: "Mm." },
  // Chris, [tired]
  "chris-04": { file: "chris-04", seconds: 1.1, text: "Yeah." },
  // Chris, [tired]
  "chris-05": { file: "chris-05", seconds: 1.3, text: "Mm-hmm." },
  // Chris, [tired]
  "chris-06": { file: "chris-06", seconds: 1.2, text: "Right." },
  // Chris, read as written
  "chris-07": { file: "chris-07", seconds: 5.5, text: "My landlord's selling the flat. I found out on Monday. I've got two months to move out." },
  // Chris, read as written
  "chris-08": { file: "chris-08", seconds: 3.6, text: "And I really love that place. I've been there six years." },
  // Chris, [sighs]
  "chris-09": { file: "chris-09", seconds: 3.6, text: "Everything I can afford is miles from work." },
  // Chris, [sighs]
  "chris-10": { file: "chris-10", seconds: 5.5, text: "Then on Wednesday, the project I've been on all year got cancelled." },
  // Chris, read as written
  "chris-11": { file: "chris-11", seconds: 4.1, text: "Nobody even told us why. Just… stop, it's done." },
  // Chris, read as written
  "chris-12": { file: "chris-12", seconds: 4.0, text: "The worst bit is I didn't get to say goodbye to the team properly." },
  // Chris, [tired]
  "chris-13": { file: "chris-13", seconds: 5.4, text: "I haven't been sleeping much. I keep doing sums in my head at three in the morning." },
  // Chris, [laughs softly]
  "chris-14": { file: "chris-14", seconds: 5.3, text: "My mum keeps sending me flat listings. Most of them are in her town." },
  // Chris, read as written
  "chris-15": { file: "chris-15", seconds: 4.0, text: "My boss says there might be another project. Might." },
  // Chris, [a little brighter]
  "chris-16": { file: "chris-16", seconds: 3.5, text: "There is one good thing, though. A friend might have a room going." },
  // Chris, [laughs softly]
  "chris-17": { file: "chris-17", seconds: 5.6, text: "It's near the river, with a tiny balcony. I've already planned the plants." },
  // Chris, read as written
  "chris-18": { file: "chris-18", seconds: 3.8, text: "I nearly cancelled today, honestly. I'm glad I didn't." },
  // Chris, [sighs]
  "chris-19": { file: "chris-19", seconds: 2.5, text: "Yeah. Exactly." },
  // Chris, read as written
  "chris-20": { file: "chris-20", seconds: 2.0, text: "Thanks. It really is." },
  // Chris, [warmly]
  "chris-21": { file: "chris-21", seconds: 3.0, text: "Yeah. That's exactly how it feels." },
  // Chris, [flatly]
  "chris-22": { file: "chris-22", seconds: 1.5, text: "Yeah, maybe." },
  // Chris, [laughs softly]
  "chris-23": { file: "chris-23", seconds: 3.2, text: "Thanks. I needed to hear that." },
  // Chris, read as written
  "chris-24": { file: "chris-24", seconds: 2.7, text: "It's just a lot at once, you know?" },
  // Chris, read as written
  "chris-25": { file: "chris-25", seconds: 2.8, text: "Honestly, it helps just saying it out loud." },
  // Chris, read as written
  "chris-26": { file: "chris-26", seconds: 3.1, text: "Anyway, how are you? I've been going on." },
  // Chris, read as written
  "chris-27": { file: "chris-27", seconds: 4.0, text: "Sorry, I've been talking about me this whole time. What's new with you?" },
  // Chris, read as written
  "chris-28": { file: "chris-28", seconds: 1.6, text: "Sorry, what did you say?" },
  // Chris, [softly]
  "chris-29": { file: "chris-29", seconds: 4.1, text: "I don't think I want advice right now. I just needed to say it." },
  // Chris, read as: I should head off. [warmly] Thanks for listening. Honestly, I feel a bit better.
  "chris-30": { file: "chris-30", seconds: 4.7, text: "I should head off. Thanks for listening. Honestly, I feel a bit better." },
  // Chris, read as: Thanks for this. [warmly] Let's do it again soon, okay?
  "chris-31": { file: "chris-31", seconds: 3.1, text: "Thanks for this. Let's do it again soon, okay?" },
  // Conversations: Priya, a friend with big news
  // Stacey, [excited]
  "priya-01": { file: "priya-01", seconds: 6.1, text: "Oh my gosh, hi! You won't believe this. I got into the design programme in Copenhagen!" },
  // Stacey, [excited]
  "priya-02": { file: "priya-02", seconds: 5.4, text: "Hey! Okay, I have to tell someone. I got in! The Copenhagen programme!" },
  // Stacey, [happy]
  "priya-03": { file: "priya-03", seconds: 0.9, text: "Mm-hmm!" },
  // Stacey, [excited]
  "priya-04": { file: "priya-04", seconds: 1.0, text: "Yeah?" },
  // Stacey, [laughs]
  "priya-05": { file: "priya-05", seconds: 1.7, text: "I know!" },
  // Stacey, [happy]
  "priya-06": { file: "priya-06", seconds: 1.0, text: "Right?" },
  // Stacey, read as: [excited] They emailed this morning while I was on the bus, and I actually screamed. [laughs] Everyone stared.
  "priya-07": { file: "priya-07", seconds: 6.5, text: "They emailed this morning while I was on the bus, and I actually screamed. Everyone stared." },
  // Stacey, read as written
  "priya-08": { file: "priya-08", seconds: 4.8, text: "I applied last year too and didn't get in, so this feels huge." },
  // Stacey, [warmly]
  "priya-09": { file: "priya-09", seconds: 5.4, text: "The first person I called was my mum. She cried. Then I cried." },
  // Stacey, read as written
  "priya-10": { file: "priya-10", seconds: 6.0, text: "It starts in January. Two years, working on real projects with real companies." },
  // Stacey, [laughs]
  "priya-11": { file: "priya-11", seconds: 4.7, text: "I've already looked at flats. Way too many flats." },
  // Stacey, read as written
  "priya-12": { file: "priya-12", seconds: 5.3, text: "I need to learn some Danish. So far I can say thank you, and that's it." },
  // Stacey, read as written
  "priya-13": { file: "priya-13", seconds: 4.6, text: "They said it was my portfolio that got me in. The project with the kids' library." },
  // Stacey, [laughs]
  "priya-14": { file: "priya-14", seconds: 3.7, text: "I keep rereading the email to check it's real." },
  // Stacey, [nervous]
  "priya-15": { file: "priya-15", seconds: 4.8, text: "Honestly, I'm also a bit scared. It's a whole new country." },
  // Stacey, [softly]
  "priya-16": { file: "priya-16", seconds: 3.3, text: "I'll miss everyone here. That part's hard." },
  // Stacey, [laughs]
  "priya-17": { file: "priya-17", seconds: 3.2, text: "I know! I still can't believe it." },
  // Stacey, read as written
  "priya-18": { file: "priya-18", seconds: 3.4, text: "Thank you! It means a lot that you're excited too." },
  // Stacey, [deflated]
  "priya-19": { file: "priya-19", seconds: 2.8, text: "Oh. Yeah, I guess." },
  // Stacey, read as written
  "priya-20": { file: "priya-20", seconds: 3.3, text: "Oh. Right. Yeah, that's nice." },
  // Stacey, [warmly]
  "priya-21": { file: "priya-21", seconds: 3.1, text: "Yeah. Exactly. Thank you." },
  // Stacey, [excited]
  "priya-22": { file: "priya-22", seconds: 1.0, text: "Right?!" },
  // Stacey, read as written
  "priya-23": { file: "priya-23", seconds: 2.1, text: "Anyway, what's new with you?" },
  // Stacey, read as written
  "priya-24": { file: "priya-24", seconds: 1.8, text: "Have you ever lived abroad?" },
  // Stacey, read as written
  "priya-25": { file: "priya-25", seconds: 3.6, text: "Sorry, it's so loud here. What did you say?" },
  // Stacey, [laughs]
  "priya-26": { file: "priya-26", seconds: 3.6, text: "Okay, I'm talking way too much about me." },
  // Stacey, read as: Oh, that's my train! [excited] Let's celebrate properly soon, okay?
  "priya-27": { file: "priya-27", seconds: 4.2, text: "Oh, that's my train! Let's celebrate properly soon, okay?" },
  // Stacey, read as: I have to run, but thank you. Seriously. [warmly] That made my day.
  "priya-28": { file: "priya-28", seconds: 5.1, text: "I have to run, but thank you. Seriously. That made my day." },
  // Scenes and Active listening (decisions 149 and 150): each line in its person's voice, one take each, the tag kept beside the words in scenes.ts and listening.ts
  // Stacey, [excited]
  "sn-lisbon-open": { file: "sn-lisbon-open", seconds: 5.5, text: "Okay, I have to tell someone. I got the offer. The Lisbon job! I start in March!" },
  // Stacey, [delighted, talking fast]
  "sn-lisbon-1a": { file: "sn-lisbon-1a", seconds: 7.0, text: "Like ten minutes ago! I was in the lift and I actually squeaked. A man in a suit looked at me like I was a kettle." },
  // Stacey, [deflating a little]
  "sn-lisbon-1b": { file: "sn-lisbon-1b", seconds: 5.5, text: "Oh. Right. Yeah, I guess it'll be hard at first." },
  // Stacey, [a bit flat]
  "sn-lisbon-1c": { file: "sn-lisbon-1c", seconds: 3.3, text: "Thanks. Yeah. It's a big deal for me." },
  // Stacey, [thoughtful, then excited]
  "sn-lisbon-bridge": { file: "sn-lisbon-bridge", seconds: 7.9, text: "The thing is, my mum doesn't know yet. I'm calling her tonight. She's going to cry. Good crying, I think. Mostly." },
  // Stacey, [smiling]
  "sn-lisbon-2a": { file: "sn-lisbon-2a", seconds: 3.2, text: "Yeah, she will. I hope so, anyway." },
  // Stacey, [softer, honest]
  "sn-lisbon-2b": { file: "sn-lisbon-2b", seconds: 8.1, text: "Honestly? She'll be proud, and then sad I'm going. We're really close. I think that's why I've been putting the call off." },
  // Stacey, [deflated]
  "sn-lisbon-2c": { file: "sn-lisbon-2c", seconds: 3.5, text: "Mm. Yeah. That's what everyone says." },
  // Stacey, [nervous laugh]
  "sn-lisbon-prompt": { file: "sn-lisbon-prompt", seconds: 7.3, text: "Sorry, I'm talking so much. It's just a lot. Big, scary, amazing a lot." },
  // Stacey, [warm, grateful]
  "sn-lisbon-warm": { file: "sn-lisbon-warm", seconds: 6.3, text: "Thank you. Honestly, saying it out loud to someone helped. I think I'm ready to call her." },
  // Stacey, [polite]
  "sn-lisbon-flat": { file: "sn-lisbon-flat", seconds: 4.1, text: "Anyway. Thanks. I should probably get back to my desk." },
  // Stacey, [excited]
  "sn-board-open": { file: "sn-board-open", seconds: 6.0, text: "Guess who's presenting the library project to the board next week? Me! They asked for me by name!" },
  // Stacey, [happy]
  "sn-board-1a": { file: "sn-board-1a", seconds: 2.9, text: "Thank you! I really didn't expect it." },
  // Stacey, [deflating]
  "sn-board-1b": { file: "sn-board-1b", seconds: 3.9, text: "Oh. Yeah. I hadn't really thought about that." },
  // Stacey, [beaming]
  "sn-board-1c": { file: "sn-board-1c", seconds: 7.1, text: "That the library was the best thing the studio's done this year. I had to go and stand in the stairwell for a minute." },
  // Stacey, [nervous laugh]
  "sn-board-bridge": { file: "sn-board-bridge", seconds: 8.1, text: "I've never presented to anyone more senior than my manager. I keep imagining my slides just not loading." },
  // Stacey, [honest]
  "sn-board-2a": { file: "sn-board-2a", seconds: 5.5, text: "The questions, I think. The slides I can practise. The questions could be anything." },
  // Stacey, [polite laugh]
  "sn-board-2b": { file: "sn-board-2b", seconds: 3.8, text: "Ha. Yeah. People keep telling me that." },
  // Stacey, [smiles]
  "sn-board-2c": { file: "sn-board-2c", seconds: 3.6, text: "That's true. I did draw every bookshelf." },
  // Stacey, [hopeful]
  "sn-board-prompt": { file: "sn-board-prompt", seconds: 5.6, text: "Okay. Big breath. I think I'm more excited than scared. Mostly." },
  // Stacey, [delighted]
  "sn-board-warm": { file: "sn-board-warm", seconds: 6.5, text: "Thank you. Seriously, I feel so much better. Merci, gracias, thank you!" },
  // Stacey, [polite]
  "sn-board-flat": { file: "sn-board-flat", seconds: 3.6, text: "Okay. Thanks. I'd better go and practise." },
  // Chris, [tired, dry]
  "sn-long-week-open": { file: "sn-long-week-open", seconds: 7.5, text: "Don't ask about my week. Actually, do. The deadline moved up again, and I'm the only one left on the project." },
  // Chris, [flat, shutting down]
  "sn-long-week-1a": { file: "sn-long-week-1a", seconds: 3.6, text: "Yeah. Maybe. I've tried that." },
  // Chris, [opening up]
  "sn-long-week-1b": { file: "sn-long-week-1b", seconds: 9.0, text: "Two people left in a month and nobody replaced them. I've been doing three jobs. I even missed football tonight. First time in two years." },
  // Chris, [shrugs]
  "sn-long-week-1c": { file: "sn-long-week-1c", seconds: 2.3, text: "Yeah. It is what it is." },
  // Chris, [quieter, wry]
  "sn-long-week-bridge": { file: "sn-long-week-bridge", seconds: 7.6, text: "And my mum keeps ringing to ask if I'm eating properly. Which, to be fair, I'm not. It's been cereal for dinner since Monday." },
  // Chris, [polite]
  "sn-long-week-2a": { file: "sn-long-week-2a", seconds: 2.5, text: "Ha. Yeah. Toast's good." },
  // Chris, [mild]
  "sn-long-week-2b": { file: "sn-long-week-2b", seconds: 2.9, text: "She is. She worries, that's all." },
  // Chris, [small laugh]
  "sn-long-week-2c": { file: "sn-long-week-2c", seconds: 6.1, text: "Ha. Honestly? I can't remember. The plants are the only ones getting looked after in my flat." },
  // Chris, [tired, honest]
  "sn-long-week-prompt": { file: "sn-long-week-prompt", seconds: 3.9, text: "I keep thinking it'll calm down next week. It never does." },
  // Chris, [grateful, lighter]
  "sn-long-week-warm": { file: "sn-long-week-warm", seconds: 4.3, text: "Thanks for listening. Really. I feel a bit less like I'm going mad." },
  // Chris, [tired]
  "sn-long-week-flat": { file: "sn-long-week-flat", seconds: 3.9, text: "Anyway. Enough about me. I'll survive." },
  // Chris, [quiet]
  "sn-the-flat-open": { file: "sn-the-flat-open", seconds: 6.0, text: "My landlord's selling the flat. I've got two months to find somewhere. Six years I've been there." },
  // Chris, [sighs]
  "sn-the-flat-1a": { file: "sn-the-flat-1a", seconds: 3.6, text: "Yeah. With work as well. Perfect." },
  // Chris, [opening up]
  "sn-the-flat-1b": { file: "sn-the-flat-1b", seconds: 8.3, text: "Gutted, honestly. It's not just a flat. Every windowsill's got my plants on it. I know the man at the corner shop by name." },
  // Chris, [short]
  "sn-the-flat-1c": { file: "sn-the-flat-1c", seconds: 2.6, text: "Yeah. I know. Everyone keeps saying." },
  // Chris, [wry]
  "sn-the-flat-bridge": { file: "sn-the-flat-bridge", seconds: 7.0, text: "The plants are the real problem. Do you know how hard it is to move forty plants? I'll need a van just for them." },
  // Chris, [flat]
  "sn-the-flat-2a": { file: "sn-the-flat-2a", seconds: 2.4, text: "Ha. No. Not happening." },
  // Chris, [laughs, warmer]
  "sn-the-flat-2b": { file: "sn-the-flat-2b", seconds: 6.8, text: "The fern. Definitely the fern. My mum gave it to me the day I moved in. It's huge now." },
  // Chris, [small smile]
  "sn-the-flat-2c": { file: "sn-the-flat-2c", seconds: 4.4, text: "Hopefully. Big windows. That's my one rule." },
  // Chris, [softer]
  "sn-the-flat-prompt": { file: "sn-the-flat-prompt", seconds: 4.1, text: "It's daft. It's only a flat. But it's been home." },
  // Chris, [touched]
  "sn-the-flat-warm": { file: "sn-the-flat-warm", seconds: 3.8, text: "Yeah. Thanks. It helps that someone gets it." },
  // Chris, [quiet]
  "sn-the-flat-flat": { file: "sn-the-flat-flat", seconds: 2.1, text: "Anyway. I'll figure it out." },
  // Brittney, [bright]
  "sn-first-question-open": { file: "sn-first-question-open", seconds: 4.6, text: "Hey! You're the one who knows everyone here. So what have you been up to lately?" },
  // Brittney, [trying]
  "sn-first-question-1a": { file: "sn-first-question-1a", seconds: 3.9, text: "Ha, fair. Work, work, work. Cool." },
  // Brittney, [curious]
  "sn-first-question-1b": { file: "sn-first-question-1b", seconds: 2.7, text: "Oh nice, the coast! Which bit?" },
  // Brittney, [laughs, excited]
  "sn-first-question-1c": { file: "sn-first-question-1c", seconds: 7.3, text: "No way, I walk past it every day! I keep saying I'll go. Were your arms dead the next day?" },
  // Brittney, [lively, self-mocking]
  "sn-first-question-bridge": { file: "sn-first-question-bridge", seconds: 7.6, text: "I just moved here from Denver, so I'm collecting things to do. Long story, but I joined a running club, and I don't run." },
  // Brittney, [cheerful]
  "sn-first-question-2a": { file: "sn-first-question-2a", seconds: 5.1, text: "Work! I'm in marketing now. Big move, but I'm loving it so far." },
  // Brittney, [laughing]
  "sn-first-question-2b": { file: "sn-first-question-2b", seconds: 8.9, text: "I chat at the back! It's a social club now, as far as I'm concerned. There's a pastry stop at the end. That's my real motivation." },
  // Brittney, [polite]
  "sn-first-question-2c": { file: "sn-first-question-2c", seconds: 3.1, text: "Ha. Yeah. It's not for everyone." },
  // Brittney, [curious]
  "sn-first-question-prompt": { file: "sn-first-question-prompt", seconds: 4.7, text: "Okay, your turn. What's something you're actually looking forward to this month?" },
  // Brittney, [delighted]
  "sn-first-question-warm": { file: "sn-first-question-warm", seconds: 4.4, text: "Oh, I love that. Okay, we're friends now. That's decided." },
  // Brittney, [polite]
  "sn-first-question-flat": { file: "sn-first-question-flat", seconds: 4.0, text: "Nice. Cool. Oh, I think my friend's waving at me." },
  // Brittney, [bright]
  "sn-what-do-you-do-open": { file: "sn-what-do-you-do-open", seconds: 7.0, text: "Hi! I'm Maya, I just started in marketing. I feel like I should know what everyone does by now. What do you do?" },
  // Brittney, [laughs]
  "sn-what-do-you-do-1a": { file: "sn-what-do-you-do-1a", seconds: 3.6, text: "Better than it sounds? Now I'm curious." },
  // Brittney, [delighted]
  "sn-what-do-you-do-1b": { file: "sn-what-do-you-do-1b", seconds: 11.2, text: "Okay, I need to hear the best complaint. But marketing! I used to be at a tiny startup where I did everything. Now I do one thing, which is weird." },
  // Brittney, [trying]
  "sn-what-do-you-do-1c": { file: "sn-what-do-you-do-1c", seconds: 4.6, text: "Oh, cool. Operations. So what does that involve?" },
  // Brittney, [wry]
  "sn-what-do-you-do-bridge": { file: "sn-what-do-you-do-bridge", seconds: 8.9, text: "Honestly, everyone here's so nice. The only one who's been rude to me since I moved is my cat. He yells at me at five every morning." },
  // Brittney, [cheerful]
  "sn-what-do-you-do-2a": { file: "sn-what-do-you-do-2a", seconds: 5.5, text: "I love it! Tacos everywhere. I'm trying every place I can walk to." },
  // Brittney, [polite laugh]
  "sn-what-do-you-do-2b": { file: "sn-what-do-you-do-2b", seconds: 3.6, text: "Ha. Fair enough. Dog people." },
  // Brittney, [laughing]
  "sn-what-do-you-do-2c": { file: "sn-what-do-you-do-2c", seconds: 7.8, text: "Breakfast! Always breakfast. His name's Biscuit, which is ironic, because he's a monster." },
  // Brittney, [curious]
  "sn-what-do-you-do-prompt": { file: "sn-what-do-you-do-prompt", seconds: 4.6, text: "Okay, quick. If I only have one free Saturday this month, where should I go?" },
  // Brittney, [delighted]
  "sn-what-do-you-do-warm": { file: "sn-what-do-you-do-warm", seconds: 4.2, text: "Oh, sold. I'm going. You're officially my tour guide." },
  // Brittney, [polite]
  "sn-what-do-you-do-flat": { file: "sn-what-do-you-do-flat", seconds: 2.5, text: "Cool, thanks. I'll look it up." },
  // Eddy, [quiet, polite]
  "sn-early-open": { file: "sn-early-open", seconds: 2.2, text: "Hi. Early too, then." },
  // Eddy, [brief]
  "sn-early-1a": { file: "sn-early-1a", seconds: 2.2, text: "Fine. Busy. Month end." },
  // Eddy, [quiet]
  "sn-early-1b": { file: "sn-early-1b", seconds: 0.8, text: "Mm." },
  // Eddy, [surprised, warming]
  "sn-early-1c": { file: "sn-early-1c", seconds: 7.7, text: "Oh. Yeah, it is. Old ones, from the fifties. I've got eleven now. My flatmate says that's ten too many." },
  // Eddy, [a little shy]
  "sn-early-bridge": { file: "sn-early-bridge", seconds: 7.1, text: "Sorry, I'm not great at chat. Mostly I just go home and fix radios. That's my exciting life." },
  // Eddy, [small smile]
  "sn-early-2a": { file: "sn-early-2a", seconds: 3.5, text: "Thanks. It's quite niche." },
  // Eddy, [warming up]
  "sn-early-2b": { file: "sn-early-2b", seconds: 8.3, text: "My grandad's kitchen radio. It broke when I was fourteen, and I took it apart to fix it. Took me a whole summer. It still works." },
  // Eddy, [brief]
  "sn-early-2c": { file: "sn-early-2c", seconds: 2.2, text: "No. I just keep them." },
  // Eddy, [quietly enthusiastic]
  "sn-early-prompt": { file: "sn-early-prompt", seconds: 7.0, text: "The best ones still have their original valves. When you switch them on, they glow orange for a minute before any sound comes out." },
  // Eddy, [warm, animated]
  "sn-early-warm": { file: "sn-early-warm", seconds: 5.9, text: "Honestly? Best feeling in the world. I'll bring a picture in. Thanks for asking. Really." },
  // Eddy, [polite]
  "sn-early-flat": { file: "sn-early-flat", seconds: 3.2, text: "Yeah. Anyway. Looks like the others are coming." },
  // Eddy, [nervous]
  "sn-before-two-open": { file: "sn-before-two-open", seconds: 4.7, text: "I'm presenting the budget at two. I'm fine. I'm mostly fine." },
  // Eddy, [quiet]
  "sn-before-two-1a": { file: "sn-before-two-1a", seconds: 2.7, text: "Thanks. Yeah. Confident." },
  // Eddy, [hesitant]
  "sn-before-two-1b": { file: "sn-before-two-1b", seconds: 4.2, text: "Maybe. I don't know. I've read it so many times." },
  // Eddy, [honest]
  "sn-before-two-1c": { file: "sn-before-two-1c", seconds: 6.7, text: "The questions. I know the numbers. But when someone asks me something on the spot, my mind goes white." },
  // Eddy, [dry]
  "sn-before-two-bridge": { file: "sn-before-two-bridge", seconds: 7.6, text: "Last time someone asked about travel costs, and I said “I'll get back to you” four times. Four. I counted." },
  // Eddy, [small laugh, thinking]
  "sn-before-two-2a": { file: "sn-before-two-2a", seconds: 7.8, text: "Something like, good question, here's what I know, and I'll check the rest. Which is fine, actually. That's allowed." },
  // Eddy, [polite]
  "sn-before-two-2b": { file: "sn-before-two-2b", seconds: 3.0, text: "Oh. Right. That sounds tough." },
  // Eddy, [mild]
  "sn-before-two-2c": { file: "sn-before-two-2c", seconds: 1.4, text: "Yeah. They are." },
  // Eddy, [steadier]
  "sn-before-two-prompt": { file: "sn-before-two-prompt", seconds: 4.7, text: "Actually, I think I've just answered my own question. Talking it through helps." },
  // Eddy, [warmer, steady]
  "sn-before-two-warm": { file: "sn-before-two-warm", seconds: 6.1, text: "Good question. That the budget's tight, but fair. Okay. I think I'm ready. Thanks." },
  // Eddy, [polite]
  "sn-before-two-flat": { file: "sn-before-two-flat", seconds: 2.9, text: "Okay. Thanks. I should go and set up." },
  // Brittney, [excited, proud]
  "ls-five-k": { file: "ls-five-k", seconds: 14.8, text: "So on Saturday the running club did a five K, and I actually ran the whole thing. All of it! I came last, by about ten minutes, but the whole group waited for me at the finish and clapped. I nearly cried. Then we had pastries." },
  // Brittney, [delighted]
  "ls-five-k-warm": { file: "ls-five-k-warm", seconds: 4.7, text: "It felt amazing. I've signed up for the next one. Don't tell anyone." },
  // Brittney, [cheerful]
  "ls-five-k-flat": { file: "ls-five-k-flat", seconds: 2.3, text: "Yeah, it was fun. Anyway!" },
  // Stacey, [excited, talking fast]
  "ls-first-sale": { file: "ls-first-sale", seconds: 14.2, text: "I was sketching in my café this morning, the one with the green door, and an old man asked if he could see. He said he used to be an architect, fifty years ago. Then he bought my drawing for five pounds. My first ever sale! I'm framing the five pound note." },
  // Stacey, [beaming]
  "ls-first-sale-warm": { file: "ls-first-sale-warm", seconds: 5.5, text: "He said I had a good eye for light. I'm going to be insufferable about it all week." },
  // Stacey, [happy]
  "ls-first-sale-flat": { file: "ls-first-sale-flat", seconds: 2.6, text: "Yeah! Fun, right? Anyway." },
  // Chris, [dry, deadpan]
  "ls-nine-one": { file: "ls-nine-one", seconds: 12.2, text: "Football last night was a disaster. We lost nine one. Nine one! And I scored the one goal, but it was in our own net. The team have given me a new nickname. I'm not telling you what it is." },
  // Chris, [sighs, amused]
  "ls-nine-one-warm": { file: "ls-nine-one-warm", seconds: 6.0, text: "Fine. It's “Backwards Chris”. On the team chat. Forever." },
  // Chris, [dry]
  "ls-nine-one-flat": { file: "ls-nine-one-flat", seconds: 2.4, text: "Yeah. Not my finest hour." },
  // Eddy, [quiet, building enthusiasm]
  "ls-radio": { file: "ls-radio", seconds: 28.1, text: "Last Sunday I went to the flea market by the canal, early, about seven. A man was selling a box of junk, and right at the bottom was a radio from 1956. The exact model my grandad had in his kitchen. It was cracked down one side, and the dial was missing. He wanted twenty pounds. I paid it without even haggling, which I never do. I've worked on it every evening since. Last night, for the first time, it hissed. Just a hiss. But that means it's alive." },
  // Eddy, [softly, warm]
  "ls-radio-warm": { file: "ls-radio-warm", seconds: 5.3, text: "Honestly, I just sat there grinning at a hiss. Grandad would've laughed at me." },
  // Eddy, [brief]
  "ls-radio-flat": { file: "ls-radio-flat", seconds: 1.5, text: "Yeah. It's a good one." },
  // Stacey, [warm, delighted]
  "ls-whale": { file: "ls-whale", seconds: 23.6, text: "The children's library opened on Saturday, the one I designed. There's a reading nook shaped like a whale, and I was so worried the kids would think it was silly. Within ten minutes there were six kids inside the whale, and one little girl refused to come out, even for cake. Her dad had to read her three books in there. Then the head librarian hugged me. I've been smiling for two days." },
  // Stacey, [delighted]
  "ls-whale-warm": { file: "ls-whale-warm", seconds: 6.3, text: "Mine! I drew it on a napkin. I nearly didn't show anyone. Thank you for asking." },
  // Stacey, [cheerful]
  "ls-whale-flat": { file: "ls-whale-flat", seconds: 2.3, text: "Yeah, it was a good day!" },
  // Chris, [warm, amused]
  "ls-seventy": { file: "ls-seventy", seconds: 25.2, text: "It was my mum's seventieth on Sunday. My brother organised a surprise party at her favourite Italian place, and my job was getting her there without her guessing. I told her we were going to look at a new flat for me. She was so excited about the flat she was almost disappointed when everyone jumped out. Almost. Then she saw her sister had flown in from Dublin, and she just stood there holding the menu, crying. I've never seen her lost for words." },
  // Chris, [softer]
  "ls-seventy-warm": { file: "ls-seventy-warm", seconds: 5.5, text: "Three years. They didn't let go of each other all night. Best birthday she's had." },
  // Chris, [easy]
  "ls-seventy-flat": { file: "ls-seventy-flat", seconds: 1.5, text: "Yeah. Good night, that." },
  // Brittney, [bright, then a little unsure]
  "ls-sister": { file: "ls-sister", seconds: 26.5, text: "My little sister's coming to visit next weekend, her first time seeing my new place. I've planned everything. Friday night, tacos at the place with the neon cactus. Saturday morning, the running club, which she'll mock me for. Saturday night, a comedy show. The thing is, we haven't spent a whole weekend together since I moved, and the last time we really talked, we kind of argued about me leaving Denver. So, you know. I've planned a lot." },
  // Brittney, [quieter, honest]
  "ls-sister-warm": { file: "ls-sister-warm", seconds: 7.0, text: "Nervous, honestly. I want her to see I'm happy here. Maybe I'll leave Sunday free. Just to talk." },
  // Brittney, [bright, brushing it off]
  "ls-sister-flat": { file: "ls-sister-flat", seconds: 3.1, text: "Yeah! It'll be fun. Busy, but fun." },
  // Stacey, [light, but a little flat]
  "ls-last-day": { file: "ls-last-day", seconds: 22.3, text: "So Friday was my last day at the old job. They did drinks, which was lovely, and my manager made a speech, and everyone signed a card with a little drawing of me. Very flattering. Huge hair. And then I went home and sat on the floor of my new flat with the card for, I don't know, an hour? It's fine. The new job's on Monday. It's all very exciting." },
  // Stacey, [relieved, honest]
  "ls-last-day-warm": { file: "ls-last-day-warm", seconds: 4.8, text: "So much. I think I needed someone to say that. Thank you." },
  // Stacey, [bright, a bit forced]
  "ls-last-day-flat": { file: "ls-last-day-flat", seconds: 3.1, text: "Yeah. Anyway, new chapter!" },
  // Eddy, [quiet, even, careful]
  "ls-new-team": { file: "ls-new-team", seconds: 18.5, text: "My manager asked if I'd like to lead the new forecasting team. It's more money, which is good, and the team's good. I'd be presenting to the directors every month. Every month. I said I'd think about it. My flatmate says it's obvious and I should say yes. He's probably right. He usually is." },
  // Eddy, [a small, surprised laugh]
  "ls-new-team-warm": { file: "ls-new-team-warm", seconds: 6.4, text: "Yeah. It is. Nobody else noticed that. Maybe I'll ask if I can build up to it." },
  // Eddy, [quiet]
  "ls-new-team-flat": { file: "ls-new-team-flat", seconds: 2.5, text: "Yeah. I'll probably say yes." },
};

// A line's saved recording: its address and length, or null when it has none
export function voiceClip(id: string): { url: string; seconds: number } | null {
  // Looked up by id (own entries only)
  const clip = Object.hasOwn(VOICE_CLIPS, id) ? VOICE_CLIPS[id] : undefined;
  // Its address and length, or none
  return clip ? { url: `/clips/${clip.file}.mp3`, seconds: clip.seconds } : null;
}
