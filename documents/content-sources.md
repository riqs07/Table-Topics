# Where the reading texts come from

Every speech in VoiceLab is in the public domain in the United States: works published before 1930, and speeches given by US presidents and officials as part of their duties, which are works of the US government.

The texts were collected on 2026-10-17. The usual archive sites were out of reach from the build environment, so the texts came from published copies on GitHub, which hosts several well-known collections. Where two or more copies existed, they were compared word by word and each difference was settled; each copy had its own misread words (for example "urgent agents" for "insurgent agents" in one copy of Lincoln's second inaugural, and "firmness in the fight" in the other). Texts from a single copy were spell-checked for scanning errors; old and British spellings (labour, builded, maketh) were kept as published.

| Speech | Text from | Checked against |
|---|---|---|
| Patrick Henry, Give me liberty (1775) | Project Gutenberg ebook 6 (GITenberg mirror) | Spelling check |
| Frederick Douglass, What to the slave is the Fourth of July? (1852) | Douglass's own extract in My Bondage and My Freedom, Project Gutenberg ebook 202 (GITenberg mirror) | Spelling check; page numbers removed |
| Abraham Lincoln, A House Divided (1858) | Miller Center text (copy in the Vocativ presidents_readability repository) | Spelling check |
| Abraham Lincoln, Second Inaugural (1865) | Miller Center text | NLTK inaugural corpus; one word corrected from each |
| Booker T. Washington, Atlanta Exposition Address (1895) | Standard Ebooks edition of Up from Slavery | Spelling check; the book's misprint "heading" restored to "heeding" |
| Theodore Roosevelt, Citizenship in a Republic (1910) | African and European Addresses, Project Gutenberg ebook 13930 (GITenberg mirror) | Spelling check |
| Woodrow Wilson, war message (1917) | Miller Center text | Spelling check |
| Franklin D. Roosevelt, First Inaugural (1933) | Miller Center text (as delivered) | NLTK inaugural corpus (prepared text) |
| Franklin D. Roosevelt, Four Freedoms (1941) | sotu package (State of the Union texts, CRAN mirror on GitHub) | Spelling check |
| Franklin D. Roosevelt, Day of Infamy (1941) | Miller Center text | Spelling check |
| Dwight D. Eisenhower, Farewell Address (1961) | Miller Center text | Spelling check |
| John F. Kennedy, Inaugural Address (1961) | Public Papers of the Presidents (leadeR package) | Miller Center text and NLTK inaugural corpus |
| John F. Kennedy, Yale commencement (1962) | Miller Center text | Spelling check |
| John F. Kennedy, American University commencement (1963) | Public Papers of the Presidents (leadeR package) | Miller Center text |
| Lyndon B. Johnson, University of Michigan commencement (1964) | Miller Center text | Spelling check |
| Lyndon B. Johnson, Howard University commencement (1965) | Miller Center text | Spelling check |
| Ronald Reagan, Notre Dame commencement (1981) | Miller Center text | Spelling check; editors' bracketed words kept without brackets |

The short readings written earlier from memory were compared with these texts. Two were corrected: "The man in the arena" now reads "who errs, and comes short" and "knows the great enthusiasms" as published in 1910, and the Douglass highlight reads "Fourth of July" as Douglass printed it.

Still from memory, to check against a published source before relying on them: the Gettysburg Address, Susan B. Anthony's speech, Chief Joseph's surrender, "The Strenuous Life", Kennedy at Rice University, and the short readings with no full speech above.

The generator that cleans and splits the texts lives outside the repository; the result is `src/content/speeches.ts`. Parts are split at paragraph breaks into about a minute or less (140 words at 140 words a minute), so reading, listening back and trying again fits in about three minutes. A paragraph too long for one part is split between sentences, and a sentence too long for one part after a semicolon or comma; a very short part is joined to a neighbour when the two stay near a minute.

## The recorded voices (decision 82)

Every line the app says aloud is a recording made once with ElevenLabs and kept in `public/clips/`: the 72 small-talk lines and the 27 shadowing steps (94 files, since five lessons share an everyday question's file). They were made on 2026-10-20 through the ElevenLabs connector, in the flow "VoiceLab clips".

| Lines | Voice | Model | Direction |
|---|---|---|---|
| Small talk: questions, remarks, news and stories | Jessica (an ElevenLabs default voice: warm, conversational) | `eleven_v4` | A feeling tag where the line carries one: [excited] for good news, [disappointed] or [sad] for bad, [laughs softly] or [warmly] for stories. Questions and plain remarks are read as written |
| Shadowing: each phrase, then each whole passage | Graham (a voice-library voice: resonant, steady broadcaster) | `eleven_v4` | Tags for the delivery the passage teaches ([slowly], [calm and firm], [warmly], [excited]), capitals for a stressed word, "…" for a held pause |

How each line was read is in the comment above it in `src/content/voiceClips.ts`. To make one again: generate the same words with the same voice, model and direction; trim the silent ends; even the loudness to −16 LUFS; save it as 64 kbps mono MP3 under the same name; update its length in `voiceClips.ts`; and bump `VOICE_CACHE` in `src/data/voiceClient.ts` so phones drop the old copy. The checks in `tests/unit/content/voiceClips.test.ts` say which lines need a new recording when their words change.

The shadowing passages from Kennedy, Lincoln and Franklin Roosevelt are read by Graham, not by the original speakers, and the shadowing page says so. ElevenLabs does not allow voices that imitate public figures. Archive recordings of the originals could not be reached from the build environment.

ElevenLabs' terms depend on the plan: paid plans include a commercial licence; the free plan asks for credit to ElevenLabs and allows non-commercial use only. Check the plan in use before sharing the app.
