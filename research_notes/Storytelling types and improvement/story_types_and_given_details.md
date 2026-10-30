# Story types worth practising, and a "given details" story mode (for VoiceLab)

Scope: short spoken stories (30 s to 5 min) by ordinary adults. Grades: **strong** = peer-reviewed or validated instrument; **moderate** = established practitioner framework from a primary or well-known author, or small studies; **practical** = practitioner advice, secondary summaries, career and wedding sites. Most sources were seen via search results and summaries, not full texts. themoth.org and yourstory.com could not be fetched from this session (blocked by the session's network settings), so Moth and Simmons details come from secondary sources.

What VoiceLab already has (checked in the repo): templates Lesson learned and Client win (in `src/content/stories.ts`, plus Turning point and Funny moment per the brief); 24 guided stories in `src/content/guidedStories.ts` (12 "Just the facts", 12 "With a twist"; each 3 to 5 flat facts, 3 nudges, one focus of dialogue / middle / detail / point; all light, everyday, second person "You..."); 40 open prompts in 8 groups (something went wrong, a small win, a first time, someone who changed your mind, a place, a surprise, something learned, something funny).

---

## 1. Which story types do people need in real life, and which taxonomies exist?

### Takeaway
Four practitioner taxonomies cover most needs: Simmons's six (identity, motive, teaching, vision, values, objection-handling), Hall's four business stories (value, founder, purpose, customer), The Moth's true personal story with stakes, and the STAR interview answer. Under all of them sits one shared shape: a normal state, a disruption, what was done, a changed state, and a point (Labov's oral-narrative model is the research base for this). VoiceLab's existing content covers personal anecdotes, lessons, wins, funny stories and turning points well, but has no identity/origin story, values story, story about someone else as tribute or toast, interview (STAR) answer, pitch/vision story, apology story, explain-an-idea story or retelling.

### Cited Findings

**Research base for the shape of a spoken story**
- (strong) Labov and Waletzky's model of oral narratives of personal experience has parts: abstract, orientation (who, where, when), complicating action, evaluation (why it matters, the narrator's stance), resolution and coda (returns the listener to the present); abstract and coda are optional, and the abstract was added later than the 1967 original. Evaluation is the most complex part and often sits at the peak between complicating action and resolution, building suspense, but can be spread throughout. Critics call the model too rigid. — [Introduction to Narrative (lecture notes)](https://mail.cedw.tu.edu.iq/images/lect/EngLect/elaf%20subhi/4th/Introduction_To_Narrative.pdf); [Łódź University Press chapter](https://press.uni.lodz.pl/index.php/wul/catalog/download/342/1537/713?inline=1)
- (strong) The Edmonton Narrative Norms Instrument (ENNI) scores spoken picture-story telling with a story-grammar scheme where many units are coded for goal-directed activity (character, goal, attempt, outcome); scores separated typically developing children from those with language impairment at ages 4 to 8; normed on 300 typical and 77 language-impaired children aged 4 to 9 in Edmonton. — [University of Alberta ENNI story grammar page](https://www.ualberta.ca/en/communications-sciences-and-disorders/clinical-education/for-clinicians/edmonton-narrative-norms-instrument/pictures-analyses-and-comprehension/story-grammar.html); [Schneider, Hayward & Dubé 2006](https://talkbank.org/childes/access/Clinical-Eng/0docs/Schneider2006.pdf)

**Taxonomies**
- (moderate) Annette Simmons, *Whoever Tells the Best Story Wins* (2007; later *The Story Factor*), six types: Who-I-Am (personal background, builds trust), Why-I-Am-Here (your motive, and what is in it for the listener), Teaching, Vision, Value-in-Action, and I-Know-What-You-Are-Thinking (names the listener's objection before they raise it). Core claim: listeners want "who are you?" and "why are you here?" answered before they engage with your ideas. — [YourStory review](https://yourstory.com/2015/08/whoever-tells-the-best-story-wins-annette-simmons-book-review); [LibreTexts "Who I Am story" reading](https://human.libretexts.org/Bookshelves/Composition/Introductory_Composition/Write-What-Matters_(Liza_Long_Amy_Minervini_and_Joel_Gladd)/21%3A_Collected_Readings_for_Writing_and_Rhetoric/21.08%3A_Storytelling_Narration_and_the_Who_I_Am_Story)
- (moderate) Kindra Hall, *Stories That Stick* (HarperCollins Leadership, 2019), four core business stories: Value (shows the audience you solve their problem), Founder (for investors, customers, recruits; what sets you apart), Purpose (internal, aligns employees), Customer (told by the customer; mirrors the value story). Hall says the list is not exhaustive; match the story to the moment. — [HarperCollins Leadership](https://www.harpercollinsleadership.com/9781400211951/stories-that-stick); [Shortform summary](https://shortform.com/summary/stories-that-stick-summary-kindra-hall)
- (practical) Hall's story shape: Normal (context, daily life, stakes), Explosion (the event or realisation that disrupts), New Normal (how things changed). The common mistake is skipping the Normal and jumping to the event; the "explosion" can be a quiet realisation. Seen only in a secondary newsletter, not the book text. — [The Quiet Rich newsletter](https://thequietrich.beehiiv.com/p/rich-in-good-stories)
- (practical) The Moth: a true personal story told out loud without notes, not read or recited; needs stakes ("everything to gain or everything to lose", "why do you care?") and change or transformation; open in a scene; StorySLAM stories are 5 minutes (6 max with buffer), Main Stage 10 to 12; the producer warns that cramming your life into 5 minutes "is a disservice to everyone" (pick one moment). — [NPR Life Kit: how to tell a good story](https://www.npr.org/2022/04/30/1095781493/life-kit-how-to-tell-a-good-story); [InsideHook interview with a Moth producer](https://www.insidehook.com/advice/the-moth-story-telling-producer-on-how-to-tell-a-good-story); [Readingraphics summary of *How to Tell a Story* (The Moth)](https://readingraphics.com/book-summary-how-to-tell-a-story/202720)
- (moderate) Kenn Adams's Story Spine (improv, 1990s; popularised via Pixar): Once upon a time / Every day / But one day / Because of that / Because of that / Until finally / Ever since then. "But" marks the break from routine and "Because of that" forces causal links; it lowers the cognitive load of improvising a story. Adams himself plays down the Pixar link. — [NPR interview with Kenn Adams, June 2026](https://www.npr.org/transcripts/nx-s1-5750619); [Improv Basics: Story Spine](https://sidrdesai.substack.com/p/improv-basics-story-spine)
- (moderate) Nancy Duarte: persuasive talks alternate between "what is" and "what could be", widen the gap for tension, and end with a call to action and "the new bliss"; found in speeches from King to the iPhone launch. — [Duarte TEDxEast transcript](https://singjupost.com/nancy-duarte-discusses-common-structure-of-greatest-communicators-at-tedxeast-transcript/); [HBR's 10 Must Reads, "Structure Your Presentation Like a Story"](https://oreilly.com/library/view/hbrs-10-must/9781633698840/ch11.html)

**Interview and occasion stories**
- (practical) STAR answers (Situation, Task, Action, Result) run about 1 to 2 minutes (one source: 60 to 90 seconds, two minutes maximum), with most time on Action and Result because interviewers want your decision-making; rehearse with a timer. — [Glassdoor STAR guide](https://image4.glassdoor.co.in/blog/guide/star-method/); [Climb the Ladder](https://climbtheladder.com/how-long-should-my-answers-be-in-an-interview/)
- (practical) Wedding toasts and best-man speeches: most guidance says 3 to 5 minutes (about 400 to 550 words for 3 to 4 minutes); outline of hook, introduction, one or two stories, pivot to the couple, raise the toast; "one story, one tease, one toast" fits 3 minutes; reading time silently underestimates spoken time. Sources are low-quality SEO pages. — [Joy wedding speech tips](https://withjoy.com/blog/how-to-write-and-deliver-a-wedding-speech-tips/); [Science of People best-man speech](https://www.scienceofpeople.com/best-man-speech/.); [How Many Words: wedding speech word count](https://howmanywords.app/blog/wedding-speech-word-count)

### Catalogue (synthesis; frameworks cited above, length and beats are my synthesis unless cited)

| Type | What it is for | Length | Shape / beats | What makes it land | Common mistakes | In VoiceLab? |
|---|---|---|---|---|---|---|
| Personal anecdote / "the time I..." | Small talk, connection | 30 s to 2 min | Orientation, complication, resolution, one-line point (Labov) | One moment, a vivid detail, your reaction | Starting too far back; no point | Yes (40 prompts, guided stories) |
| Lesson learned / failure | Interviews, talks, mentoring | 1 to 2 min | Situation, what went wrong, what I did, what I learned | Owning the mistake; a concrete change since | Humble-brag; vague lesson | Yes (template) |
| Turning point | Talks, getting to know someone | 1 to 3 min | Normal, explosion, new normal (Hall) | Showing the before clearly so the change matters | Skipping the Normal | Yes (template) |
| Funny story | Social, openers | 30 s to 2 min | Set-up, escalation, punch, tag | Specific detail; punch at the end; not explaining it | Burying the punchline; over-long set-up | Yes (template, prompts) |
| Client / customer success | Sales, case studies | 1 to 2 min | Problem, what we tried, result with a number, why it matters | Customer as hero; a number | Product as hero; no stakes | Yes (Client win) |
| Who-I-am / origin ("why I do what I do") | Introductions, networking, interviews ("tell me about yourself"), founders | 1 to 2 min | Moment in the past, what it showed you, how it led to now | One specific memory, not a CV | Résumé recital; life story in 2 minutes (Moth warning) | **Missing** |
| Values-in-action | Leadership, interviews ("tell me about integrity"), team culture | 1 to 2 min | A choice under pressure, what you chose, cost, what it shows | A real cost or temptation | Moralising; no dilemma | **Missing** (partly lesson) |
| STAR / behavioural answer | Job interviews | 1 to 2 min | Situation, Task, Action, Result (+ reflection) | Most time on Action; "I" not "we"; a measurable result | Long situation; no result | **Missing as a named template** (Lesson learned is close) |
| Story about someone else / tribute / toast | Weddings, leaving dos, eulogies, thanking a colleague | 2 to 5 min (toast 3 to 5) | Hook, how you know them, one story that shows a quality, pivot to them, toast | Story shows the quality rather than listing adjectives; affectionate tease, not humiliation | Inside jokes; story about the speaker | **Missing** (prompts sp16 to sp20 touch people but not tribute form) |
| Vision / pitch ("what could be") | Pitches, proposals, change at work | 1 to 3 min | What is, what could be, the gap, the ask (Duarte) | Wide contrast; a concrete picture of the future; a clear ask | Features list; no ask | **Missing** |
| Teaching / explain an idea through a story | Explaining at work, training | 1 to 2 min | Concrete case first, then the principle | Story before abstraction | Story that does not match the point | **Missing** |
| I-know-what-you're-thinking | Handling objections, persuasion | 1 min | Name the doubt, a story that answers it | Names the objection fairly | Strawman | **Missing** |
| Apology / vulnerability | Repair at work or home, honest talks | 30 s to 2 min | What I did, its effect on you, what I will do | Specific, no "but", no excuses | Over-explaining; self-pity | **Missing** (and should stay light given the guided stories' "never painful" rule) |
| Retelling someone else's story | News, passing on a colleague's win, book or film | 30 s to 2 min | Who it is about, the key events in order, why it matters | Accurate core events; credit | Losing the point; too much detail | **Missing** (but strong research base: story-retell tasks, ENNI) |
| Purpose story | Team leads aligning a group | 1 to 3 min | A moment that shows why the work matters | A real person affected | Abstract mission statement | **Missing** (lower priority for ordinary users) |

### Inferences
- The biggest gaps for ordinary adults are the ones that come up in high-stakes moments: "tell me about yourself" (who-I-am / origin), STAR answers, toasts and tributes, and the values story. These are frequent, short, and people dread them.
- All types share Labov's core: orientation, a complication or choice, what happened, and evaluation (why it matters). An app can coach one shared shape and vary the beats per type, which is what the existing templates already do.
- Retelling is the type with the best assessment research behind it (ENNI, story retell), and is easy to score because the source is known.

### Gaps
- No official Moth, Toastmasters or Simmons primary page could be fetched (blocked hosts or not found). Toastmasters Pathways project names (e.g. storytelling projects) were not verified.
- I found no research measuring which story types adults most often need; the priority ordering above is judgement.
- No sourced typical length for apology, values or origin stories; the lengths in the table are my estimates.

---

## 2. Constrained and prompted storytelling: evidence and design patterns

### Takeaway
There is moderate evidence that constraints help creativity rather than hurt it, probably up to a point (inverted U), and good evidence from second-language research that picture-based narratives with a tight, causally linked sequence and some planning time produce more fluent speech. Story-cube and random-element studies are small and mostly with children. Improv tools (Story Spine) give a practical scaffold. Together these support a "given details" mode with a small number of concrete elements, a short plan time and scoring for use of the elements plus arc and point.

### Cited Findings

**Constraints and creativity**
- (strong) Haught-Tromp (2016, *Psychology of Aesthetics, Creativity, and the Arts*), "Green Eggs and Ham hypothesis": participants writing rhymes that had to include given words produced more creative output than those without the constraint; two experiments (first with 64 undergraduates); the benefit persisted after the constraint was removed. Named after Dr Seuss's 50-word book. — [Rider University PDF of the paper](https://www.rider.edu/sites/default/files/docs/tromp_haught-tromp_PACA_2016.pdf); [Pacific Standard coverage](https://psmag.com/?p=22040)
- (moderate) Mechanism proposed: constraints close doors and shrink the search space to a manageable subset, which pushes more unexpected associations. — [NTU seminar abstract, "The Paradox of Constraints in Creativity"](https://www.ntu.edu.sg/sss/news-events/news/detail/-psychology-seminar-the-paradox-of-constraints-in-creativity); [Big Think coverage](https://bigthink.com/mind-brain/why-imposing-restrictions-can-actually-boost-creativity/)
- (moderate) Patricia Stokes, *Creativity from Constraints*: constraints come in pairs, one precluding a familiar solution and one promoting a substitute (e.g. Monet painting colour contrast instead of light/dark). — [Springer book page](https://www.springer.com/gp/book/9783030257705); [Scott Barry Kaufman, "Does creativity require constraints?"](https://scottbarrykaufman.com/does-creativity-require-constraints)
- (strong) Acar, Tarakci & van Knippenberg (2019), *Journal of Management* 45(1): 96 to 121, cross-disciplinary integrative review of creativity under constraints (with an HBR summary, "Why Constraints Are Good for Innovation"). — [City Research Online listing](https://openaccess.city.ac.uk/view/creators_id/oguz=2Eacar.default.html)
- (moderate) Several design-research papers report the constraint-creativity relationship as an inverted U: constraints help up to a point and then become too restrictive (citing Joyce 2009); "focusing" constraints may help more than exclusionary ones. Whether the Acar review uses the inverted-U framing was not confirmed. — [Design Society, "The ins and outs of the constraint-creativity relationship"](https://asiachapter.designsociety.org/download-publication/40712/THE+INS+AND+OUTS+OF+THE+CONSTRAINT +CREATIVITY+RELATIONSHIP); [DTU, "Balancing constraints and the sweet spot"](https://backend.orbit.dtu.dk/ws/files/103339029/Balancing_Constraints_and_the_Sweet_Spot.pdf)

**Narrative tasks in language teaching (picture prompts, planning)**
- (strong) Tavakoli & Foster (2008/2011): learners in London and Tehran told stories from picture sequences; narratives with a tight structure (each episode leads from the last, order fixed) produced greater fluency and accuracy than loose ones (episodes could be reordered). — [Reading repository: Task design and second language performance](https://centaur.reading.ac.uk/34889/)
- (strong) Native speakers' fluency was not affected by tight vs loose structure (Foster & Tavakoli 2009). — [Reading repository: Native speakers and task performance](https://centaur.reading.ac.uk/31025)
- (strong) A 2024 close replication (*Studies in Second Language Acquisition*) found background information in the pictures did not affect syntactic complexity, differing from the original. — [Cambridge Core replication PDF](https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/227798491B93BCCC4727C77FB13BA915/S0272263124000445a.pdf/task-design-l1-literacy-and-second-language-oracy-a-close-replication-of-tavakoli-and-foster-2008.pdf)
- (strong) Pre-task planning (Foster & Skehan 1996 and later work) improves fluency and complexity of oral narratives but has no clear effect on accuracy; 10 minutes is a common planning length in studies (Yuan & Ellis 2003; Gilabert 2007), and complexity/accuracy can trade off. Seen via secondary reports. — [Journal of Teaching Language Learning 2020 (UAB)](https://ddd.uab.cat/pub/jtl3/jtl3_a2020v13n4/jtl3_a2020v13n4p851.pdf); [ERIC EJ1144948](https://files.eric.ed.gov/fulltext/EJ1144948.pdf)

**Oral narrative assessment**
- (strong) ENNI uses six picture stories; story grammar is scored on a simple one-episode story (A1) and a complex three-episode story (A3), against sheets listing acceptable responses per unit; a unit earns credit only if a listener could understand it. — [ENNI story grammar page](https://www.ualberta.ca/en/communications-sciences-and-disorders/clinical-education/for-clinicians/edmonton-narrative-norms-instrument/pictures-analyses-and-comprehension/story-grammar.html); [ENNI A3 scoring sheet](https://childes.talkbank.org/access/Clinical-Eng/ENNI-materials/StoryGrammar/sg-a3-scoring-sheet.pdf)

**Story dice / random elements**
- (moderate, small studies) Story cubes in a trilingual preschool (60 PreK children, 4 teachers) were highly motivating and drew personal contributions. — [Indiana University GJTE article](https://scholarworks.iu.edu/journals/index.php/gjte/article/view/36882)
- (moderate) A small UK classroom study using Rory's Story Cubes (physical and app) to prompt oral stories found qualified support for increased writing motivation and more creative language. — [EERA/ECER session](https://eera-ecer.de/ecer-programmes/conference/23/contribution/43585)
- (practical) Slippery Rock University mixed-methods project on paper story cubes for K to 3 oral language. — [SRU news](https://www.sru.edu/news/083021a)
- (practical) Story cubes improved narrative writing in a quasi-experiment (Indonesian primary) and an action-research study (30 Grade 9 students, Philippines); these measure writing, not speaking. — [UNM ICSAT article](https://ojs.unm.ac.id/icsat/article/view/17749); [IDEAS/RePEc listing](https://ideas.repec.org/a/bjf/journl/v10y2025i9p104-110.html)

**Improv**
- (moderate) Story Spine (Adams) gives fixed starters and the teller improvises the rest; it lowers the load of improvising and maps onto three acts. — [NPR interview with Kenn Adams](https://www.npr.org/transcripts/nx-s1-5750619); [Improv Basics: Story Spine](https://sidrdesai.substack.com/p/improv-basics-story-spine)

### Inferences
- Constraint research and the story-cube studies point the same way: a few required elements make starting easier and output more inventive, as long as they do not over-determine the story (inverted U).
- Tavakoli and Foster suggest that facts which already imply a causal sequence (tight structure) make speaking easier; facts that are loose or unrelated make it harder because the teller must build the links. This gives a principled difficulty dial: ordered, linked facts (easy) to unordered, unrelated elements (hard). VoiceLab's "Just the facts" items are tight (ordered, causal); "With a twist" adds a late element to integrate.
- Planning time trades for fluency: offer a short plan step (for 30 s to 2 min stories, roughly 30 to 60 seconds is proportionate; the research used up to 10 minutes for longer tasks, so exact app values are untested).
- ENNI's method (a list of required units, credit for anything a listener could understand, attention to goal and outcome) is a ready model for scoring a given-details telling.

### Gaps
- No studies found on adult native speakers using story dice or random-element prompts for spoken storytelling; evidence is from children, learners, or writing.
- One-word story, "Yes, and", and random-object improv games are widely taught but I found no research on them for this purpose (and did not search deeply for improv-education studies).
- No direct evidence on the best number of given elements for spoken stories; Rory's Story Cubes uses nine dice per roll (known product fact, not verified in this session).
- The Acar review's actual conclusions were not read.

---

## 3. Design of a "given details" mode

### Takeaway
Use 3 to 5 concrete details (the current 3 to 5 is well placed), make difficulty a dial from "ordered, linked facts" to "loose random elements plus a twist or a goal", give a short planning beat with a Story Spine or Normal/Explosion/New Normal scaffold, and judge success on three things: every detail used and understandable, a clear arc (normal, problem, change), and a point or evaluation at the end. Add type-specific variants (given facts for a STAR answer, a toast, a client story) so the mode also trains the missing real-life types.

### Cited Findings
- (strong) Tight, causally linked picture sequences produce more fluent narratives than loose ones in L2 speakers; native speakers were unaffected. — [Reading repository: Tavakoli & Foster](https://centaur.reading.ac.uk/34889/); [Foster & Tavakoli 2009](https://centaur.reading.ac.uk/31025)
- (strong) Planning time improves fluency and complexity, not accuracy. — [JTL3 2020](https://ddd.uab.cat/pub/jtl3/jtl3_a2020v13n4/jtl3_a2020v13n4p851.pdf)
- (strong) Assessment scores goal-directed units (character, goal, attempt, outcome) and credits only what a listener could follow. — [ENNI story grammar](https://www.ualberta.ca/en/communications-sciences-and-disorders/clinical-education/for-clinicians/edmonton-narrative-norms-instrument/pictures-analyses-and-comprehension/story-grammar.html)
- (strong) Required elements increase creativity, and the effect carries over after removal. — [Haught-Tromp 2016](https://www.rider.edu/sites/default/files/docs/tromp_haught-tromp_PACA_2016.pdf)
- (moderate) Too many constraints become restrictive (inverted U). — [DTU sweet spot paper](https://backend.orbit.dtu.dk/ws/files/103339029/Balancing_Constraints_and_the_Sweet_Spot.pdf)
- (practical) Stakes and change are what make a short true story work; open in a scene; pick one moment. — [NPR Life Kit](https://www.npr.org/2022/04/30/1095781493/life-kit-how-to-tell-a-good-story)
- (practical) Common failure is skipping the "normal" before the disruption. — [The Quiet Rich newsletter](https://thequietrich.beehiiv.com/p/rich-in-good-stories)
- (moderate) "But" and "Because of that" carry the causal chain in the Story Spine. — [Improv Basics: Story Spine](https://sidrdesai.substack.com/p/improv-basics-story-spine)

### Inferences (design proposals, not tested)
**How many details.** 3 to 5. Fewer than 3 is close to an open prompt; much beyond 5 is hard to hold in memory while speaking and over-constrains (inverted U). For 30-second stories use 3; for 2 to 3 minutes, up to 5.

**What kinds.** A balanced set mirrors story grammar: a character (who), a place or setting, an object, a problem or goal, and optionally a twist or a feeling to land on. The problem/goal is the most important single element because ENNI and the Story Spine both hinge on goal and disruption.

**Difficulty levels** (a dial built on Tavakoli & Foster plus constraint research):
1. Facts in order, causally linked (current "Just the facts").
2. Facts in order plus a late twist to integrate (current "With a twist").
3. Facts given out of order; teller must sequence them.
4. Loose random elements (dice-style: a person, a place, an object, a word) with no implied plot; teller must invent the links.
5. Random elements plus a required purpose or type: "make it a lesson learned", "end with a toast", "make it a STAR answer", "land it on the word 'finally'".
Optional modifiers: a time limit (30 s, 60 s, 2 min), a required first or last line, a required emotion.

**True or fictional.** Offer both. Fictional (as now, second-person "You...") lowers the stakes and suits practice of structure; "Make it true" variant asks the user to map the details onto a real memory ("something you lost, a stranger, a train"), which trains the real-life types. Moth-style stakes and change apply either way.

**Planning time.** A short visible plan step (about 30 to 60 s for short stories) with an optional scaffold: Story Spine cards or Normal / Explosion / New Normal. Planning should be skippable at higher levels to train spontaneity (Table Topics style).

**Judging success** (ENNI-style checklist plus story quality):
- Every given detail present and understandable to a listener (binary per detail; already supported by `factsOf`).
- Arc: a normal or setup, a disruption or problem, what was done, a changed state or outcome.
- Causal links ("so", "because", "but") rather than a list of facts read in order.
- A point or evaluation at the end (why it mattered, what changed, the punch, the toast).
- Fits the time limit; opens in a scene rather than with backstory.
- Type-specific checks when a type is set (STAR: most time on Action and Result, a measurable result; toast: story shows a quality of the other person, ends with the toast; client story: a number).

**Content ideas to fill the missing types with given details** (examples only):
- STAR: "A teammate missed a deadline. The client was waiting. You had one day." Judge on Action and Result.
- Toast/tribute: "Your friend Sam. A camping trip. A broken tent pole. They are getting married." Judge on story-shows-quality and raising the toast.
- Origin/who-I-am: "Age 12. A broken radio. Your job now." Judge on one specific memory linked to now.
- Values: "You found a wallet. You were late. No one saw." Judge on the dilemma and cost.
- Vision/pitch: "The office printer queue. Twenty minutes a day. A shared calendar." Judge on what is vs what could be and an ask.
- Retell: play a short story clip, then the user retells it; score units recalled (ENNI-style) plus the point.

### Gaps
- No study tests these exact parameters (number of details, plan time, levels) for adult native-speaker spoken stories; they are extrapolations from L2, children's and writing research.
- No evidence found on whether fictional vs true practice transfers better to real-life storytelling.
- Automatic scoring of "a clear arc" and "a point" by an LLM coach is not validated in these sources; ENNI shows human raters can do it reliably with unit lists, which an app could imitate.
