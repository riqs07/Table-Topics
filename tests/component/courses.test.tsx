// @vitest-environment jsdom
// Checks for the guided course pages (decision 131): the course with its lessons and parts, a part's steps, the wrap-up that marks it done, the prompt coming back, the list, and a take recorded inside a course
import { afterEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and acting like a user
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens being checked
import { CourseScreen } from "@/components/screens/CourseScreen";
import { CoursePartScreen } from "@/components/screens/CoursePartScreen";
import { CourseRevisitScreen, firstSentence } from "@/components/screens/CourseRevisitScreen";
import { CoursesScreen } from "@/components/screens/CoursesScreen";
import { RecordingScreen } from "@/components/screens/RecordingScreen";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load progress saving and reading
import { loadCourseProgress, markPartDone } from "@/data/courses";
// Load the course lookups, to finish a whole course in a check
import { coursePlaces, findCourse } from "@/core/courses";
// Load the recording contracts
import type { RecordingServices } from "@/audio/services";
// Load the session builder
import { makeSession } from "../support/fixtures";

// Remove drawn screens after each check
afterEach(cleanup);

// A fixed "now"
const NOW = new Date("2026-10-28T18:00:00Z");

// The draft course's parts used here: lesson 1 part 1 (two tries, pause words), lesson 1 part 2 (one try), lesson 2 part 1 (a model answer)
const [BEAT1, BEAT2, POINT1] = ["sf-beat-1", "sf-beat-2", "sf-point-1"];

// A repository with some progress and takes
async function seeded(progress: Array<[string, string | null, string]> = [], takes: ReturnType<typeof makeSession>[] = []): Promise<Repository> {
  // The repository
  const repository = createRepository(new MemoryStore());
  // Each take
  for (const take of takes) await repository.saveSession(take);
  // Each finished part
  for (const [partId, takeId, when] of progress) await markPartDone(repository, partId, takeId, new Date(when));
  // Hand it back
  return repository;
}

// A repository whose settings cannot be read the first time
function failingOnce(base: Repository): Repository {
  // Whether it has failed yet
  let failed = false;
  // The repository with a failing first read
  return { ...base, getSettings: async (now) => { if (!failed) { failed = true; throw new Error("blocked"); } return base.getSettings(now); } };
}

// Group the checks about the course page
describe("CourseScreen", () => {
  // The course, its lessons and parts, the next one marked, and the way on
  it("lists every lesson and part, marks the next, and carries on", async () => {
    // The first part done
    const repository = await seeded([[BEAT1, "a", "2026-10-27T10:00:00Z"]]);
    // Draw it
    render(<CourseScreen courseId="stop-freezing" repository={repository} now={NOW} />);
    // Wait for the parts
    await screen.findByText("Pause, don’t fill");
    // Every part is a link, the next marked "Up next"
    const parts = document.querySelectorAll("[data-course-part]");
    // Confirm the title, no draft note (the words are final, decision 144), 16 parts, the next part's note, and Continue to it
    expect([screen.getByRole("heading", { level: 1 }).textContent, screen.queryByText(/draft lessons/), parts.length, document.querySelector(`[data-course-part="${BEAT2}"]`)?.textContent?.includes("Up next"), screen.getByRole("link", { name: /Continue/ }).getAttribute("href")]).toEqual(["Stop freezing", null, 16, true, `/courses/part?id=${BEAT2}`]);
  });

  // The course's tile moves gently at the top; each lesson's tile plays a few rounds and rests (decision 142)
  it("shows the course's tile and one for each lesson", async () => {
    // Draw it
    render(<CourseScreen courseId="stop-freezing" repository={await seeded()} now={NOW} />);
    // Wait for the parts
    await screen.findByText("Pause, don’t fill");
    // Each tile's name and how much it moves
    const tiles = [...document.querySelectorAll("[data-course-tile]")].map((tile) => [tile.getAttribute("data-course-tile"), tile.getAttribute("data-motion")]);
    // Confirm the course's, then the six lessons' in order
    expect(tiles).toEqual([["stop-freezing", "loop"], ["buy-a-beat", "few"], ["point-first", "few"], ["point-reason-example", "few"], ["land-it", "few"], ["back-on-track", "few"], ["the-run", "few"]]);
  });

  // Every part done: the course is complete, with first and latest takes
  it("says the course is complete once every part is done", async () => {
    // Two takes
    const takes = [makeSession({ id: "t1", createdAt: "2026-10-20T10:00:00Z", fillersPerMinute: 4, course: { part: BEAT1, attempt: 1 } }), makeSession({ id: "t2", createdAt: "2026-10-26T10:00:00Z", fillersPerMinute: 1, course: { part: "sf-run-1", attempt: 2 } })];
    // Every part done
    const all = coursePlaces(findCourse("stop-freezing")!).map((place): [string, string | null, string] => [place.part.id, null, "2026-10-26T10:00:00Z"]);
    // Draw it
    render(<CourseScreen courseId="stop-freezing" repository={await seeded(all, takes)} now={NOW} />);
    // Confirm the section, its hand-drawn celebration (decision 134) and its line, and no Continue
    expect([(await screen.findByRole("heading", { name: "Course complete" })).textContent, !!document.querySelector("[data-course-done] [data-drawing='courseDone']"), screen.getByText(/Fewer pause words/).textContent, screen.queryByRole("link", { name: /Continue/ })]).toEqual(["Course complete", true, "Fewer pause words: 4 a minute, then 1.", null]);
  });

  // A course that does not exist
  it("says when a course cannot be found", () => {
    // Draw a missing one
    render(<CourseScreen courseId="nope" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the message
    expect(screen.getByText(/could not be found/)).toBeTruthy();
  });

  // Progress that cannot be read is said, and Try again loads it (rule T1)
  it("says when progress cannot be read, and tries again", async () => {
    // A repository that fails once
    const repository = failingOnce(createRepository(new MemoryStore()));
    // Draw it
    render(<CourseScreen courseId="stop-freezing" repository={repository} now={NOW} />);
    // The message
    const alert = await screen.findByRole("alert");
    // Try again
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    // Confirm the message, then the lessons
    expect([alert.textContent?.includes("could not be read"), !!(await screen.findByText("Pause, don’t fill"))]).toEqual([true, true]);
  });
});

// Group the checks about a part's steps
describe("CoursePartScreen", () => {
  // A part's own lesson clip plays in See it: tap to play, nothing loaded first, with its words to read instead (decisions 146 and 147)
  it("shows a part's lesson clip with its words to read", () => {
    // The first part of Stories that land, at See it
    render(<CoursePartScreen partId="sl-find-1" step="see" repository={createRepository(new MemoryStore())} now={NOW} />);
    // The clip
    const video = document.querySelector("[data-lesson-clip] video");
    // Confirm the heading, the clip's file, still, controls and that it loads nothing first, and the words to read
    expect([screen.getByRole("heading", { level: 1 }).textContent, video?.getAttribute("src"), video?.getAttribute("poster"), video?.hasAttribute("controls"), video?.getAttribute("preload"), screen.getByText("Read it instead").tagName, !!screen.getByText(/write one of them down/)]).toEqual(["Watch it", "/lessons/stories-that-land-find.mp4", "/lessons/stories-that-land-find-poster.jpg", true, "none", "SUMMARY", true]);
  });


  it("links to the Learn card and to a practice elsewhere", () => {
    // A part with a card
    render(<CoursePartScreen partId={BEAT1} repository={createRepository(new MemoryStore())} now={NOW} />);
    // Its card link
    const card = screen.getByRole("link", { name: /^Why it works/ });
    // The text and address
    const first = [card.textContent, card.getAttribute("href")];
    // Clear
    cleanup();
    // A part with a link to Rehearse my talk
    render(<CoursePartScreen partId="rd-msg-1" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the card link, and the practice link with no card link beside it
    expect([...first, screen.getByRole("link", { name: /Rehearse my talk/ }).getAttribute("href"), screen.queryByRole("link", { name: /^Why it works/ })]).toEqual(["Why it works: Keep the pause, drop the “um”.", "/learn/card?id=voice-silent-pause", "/rehearse", null]);
  });

  // Learn, then See it, then Try it: each step's way on
  it("goes through learn, see and try", () => {
    // A part with all three
    const repository = createRepository(new MemoryStore());
    // Learn
    render(<CoursePartScreen partId={POINT1} repository={repository} now={NOW} />);
    // The idea and the way on
    const learn = [screen.getByRole("heading", { level: 1 }).textContent, screen.getByRole("link", { name: /Next/ }).getAttribute("href"), screen.getByRole("list", { name: /Step 1 of 4: Learn/ }) !== null];
    // Clear
    cleanup();
    // See it
    render(<CoursePartScreen partId={POINT1} step="see" repository={repository} now={NOW} />);
    // The highlight and the way on
    const see = [document.querySelector("mark")?.textContent, screen.getByRole("link", { name: /Your turn/ }).getAttribute("href")];
    // Clear
    cleanup();
    // Try it
    render(<CoursePartScreen partId={POINT1} step="try" repository={repository} now={NOW} />);
    // The goal and the recorder's address
    const tryIt = [screen.getByRole("region", { name: "Your one goal" }).textContent?.includes("first sentence"), screen.getByRole("link", { name: /Start/ }).getAttribute("href")];
    // Confirm each step
    expect([learn, see, tryIt]).toEqual([["Say your answer first. Explain after.", `/courses/part?id=${POINT1}&step=see`, true], ["Yes, the basics.", `/courses/part?id=${POINT1}&step=try`], [true, `/session?mode=talk&prompt=t004&course=${POINT1}&try=1`]]);
  });

  // A part with no "see" skips it; an unknown step shows the first
  it("leaves out steps a part does not have", () => {
    // A part without something to see, asked for its see step
    render(<CoursePartScreen partId={BEAT2} step="see" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the learn step and three steps in the bar (a lesson's later parts have no clip, decision 147)
    expect([screen.getByRole("list", { name: /Step 1 of 3: Learn/ }) !== null, screen.getByRole("link", { name: /Next/ }).getAttribute("href")]).toEqual([true, `/courses/part?id=${BEAT2}&step=try`]);
  });

  // The second try says how the first went, and can be skipped
  it("shows the first try on the second, with a way to skip it", async () => {
    // A first try
    const repository = await seeded([], [makeSession({ id: "a", createdAt: "2026-10-28T10:00:00Z", fillersPerMinute: 3.2, course: { part: BEAT1, attempt: 1 } })]);
    // The second try
    render(<CoursePartScreen partId={BEAT1} step="try" attempt={2} repository={repository} now={NOW} />);
    // Confirm the line, the recorder's address and the skip
    expect([(await screen.findByText(/Try 1 ·/)).textContent, screen.getByRole("link", { name: /Try again/ }).getAttribute("href"), screen.getByRole("link", { name: "Skip the second try" }).getAttribute("href")]).toEqual(["Try 1 · Pause words a minute: 3.2. Same topic, one more go.", `/session?mode=talk&prompt=t003&course=${BEAT1}&try=2`, `/courses/part?id=${BEAT1}&step=wrap`]);
  });

  // The wrap-up compares the two tries and marks the part done with the second
  it("wraps up with what changed, and marks the part done", async () => {
    // Two tries
    const repository = await seeded([], [makeSession({ id: "a", createdAt: "2026-10-28T10:00:00Z", fillersPerMinute: 4, course: { part: BEAT1, attempt: 1 } }), makeSession({ id: "b", createdAt: "2026-10-28T10:05:00Z", fillersPerMinute: 1.5, course: { part: BEAT1, attempt: 2 } })]);
    // The wrap-up
    render(<CoursePartScreen partId={BEAT1} step="wrap" repository={repository} now={NOW} />);
    // The line
    const line = (await screen.findByRole("heading", { level: 1 })).textContent;
    // Saved
    await waitFor(async () => expect((await loadCourseProgress(repository, NOW))[BEAT1]?.takeId).toBe("b"));
    // Confirm the line, the comeback note, the results link and the next part
    expect([line, !!document.querySelector("[data-comes-back]"), screen.getByRole("link", { name: "See the full results" }).getAttribute("href"), screen.getByRole("link", { name: /Next part/ }).getAttribute("href")]).toEqual(["Fewer pause words: 4 a minute, then 1.5.", true, "/sessions?id=b", `/courses/part?id=${BEAT2}`]);
  });

  // No take yet: nothing is marked, and the way to try is offered
  it("does not mark a part done without a take", async () => {
    // Nothing recorded
    const repository = createRepository(new MemoryStore());
    // The wrap-up
    render(<CoursePartScreen partId={BEAT1} step="wrap" repository={repository} now={NOW} />);
    // Confirm the message, the way to try, and nothing saved
    expect([!!(await screen.findByText("No take for this part yet.")), screen.getByRole("link", { name: /Try it/ }).getAttribute("href"), await loadCourseProgress(repository, NOW)]).toEqual([true, `/session?mode=talk&prompt=t003&course=${BEAT1}&try=1`, {}]);
  });

  // The last part of the course goes back to the course
  it("goes back to the course after the last part", async () => {
    // A take on the last part
    const repository = await seeded([], [makeSession({ id: "z", createdAt: "2026-10-28T10:00:00Z", course: { part: "sf-run-2", attempt: 1 } })]);
    // Its wrap-up
    render(<CoursePartScreen partId="sf-run-2" step="wrap" repository={repository} now={NOW} />);
    // Confirm the way back
    expect((await screen.findByRole("link", { name: /Back to the course/ })).getAttribute("href")).toBe("/courses/course?id=stop-freezing");
  });
});

// Group the checks about a prompt coming back
describe("CourseRevisitScreen", () => {
  // Both answers, their first sentences, what changed, and the comeback saved
  it("compares the answers and marks the comeback", async () => {
    // The first answer, the part finished with it, and today's answer
    const repository = await seeded([[BEAT1, "a", "2026-10-20T10:00:00Z"]], [makeSession({ id: "a", createdAt: "2026-10-20T10:00:00Z", fillersPerMinute: 5, transcript: "Um, so, I guess dogs. They are loyal.", course: { part: BEAT1, attempt: 2 } }), makeSession({ id: "n", createdAt: "2026-10-28T10:00:00Z", fillersPerMinute: 1, transcript: "Dogs. They are always glad to see you.", course: { part: BEAT1, attempt: 1, revisit: true } })]);
    // Draw it
    render(<CourseRevisitScreen partId={BEAT1} takeId="n" repository={repository} now={NOW} />);
    // The line
    const line = (await screen.findByText(/Fewer pause words/)).textContent;
    // Saved
    await waitFor(async () => expect((await loadCourseProgress(repository, NOW))[BEAT1]?.revisitTakeId).toBe("n"));
    // Confirm the question, the line and both first sentences
    expect([screen.getByRole("heading", { level: 1 }).textContent, line, !!screen.getByText("“Um, so, I guess dogs.”"), !!screen.getByText("“Dogs.”")]).toEqual(["“Cats or dogs?”", "Fewer pause words: 5 a minute, then 1.", true, true]);
  });

  // A missing take is said plainly
  it("says when the answers cannot be found", async () => {
    // Nothing saved
    render(<CourseRevisitScreen partId={BEAT1} takeId="x" repository={createRepository(new MemoryStore())} now={NOW} />);
    // Confirm the message
    expect(await screen.findByText(/could not be found/)).toBeTruthy();
  });

  // First sentences: cut at the first stop, or at twenty words
  it("finds a first sentence", () => {
    // Confirm each
    expect([firstSentence("Yes. Then more."), firstSentence(" Why not? Fine."), firstSentence(Array.from({ length: 25 }, (_, index) => `w${index}`).join(" ")).endsWith("w19…")]).toEqual(["Yes.", "Why not?", true]);
  });
});

// Group the checks about the list of courses
describe("CoursesScreen", () => {
  // The Courses tab puts your course first: one started, else the first for your focus; with neither, every course under one heading (decision 148)
  it("puts your course first", async () => {
    // The address of each course card in a section
    const hrefs = (name: string) => within(screen.getByRole("region", { name })).getAllByRole("link").map((link) => link.getAttribute("href"));
    // A repository with telling stories picked
    const focused = createRepository(new MemoryStore());
    // The focus
    await focused.saveSettings({ ...(await focused.getSettings(NOW)), practiceFocus: ["stories"] });
    // Draw it
    render(<CoursesScreen repository={focused} now={NOW} />);
    // Your course, once the focus is read
    await waitFor(() => expect(hrefs("Your course")).toEqual(["/courses/course?id=stories-that-land"]));
    // The rest
    const rest = hrefs("More courses");
    // Clear
    cleanup();
    // Stop freezing started, with no focus
    render(<CoursesScreen repository={await seeded([[BEAT1, "a", "2026-10-27T10:00:00Z"]])} now={NOW} />);
    // Confirm the started course first, saying so
    await waitFor(() => expect([hrefs("Your course"), screen.getByRole("region", { name: "Your course" }).textContent?.includes("Carry on")]).toEqual([["/courses/course?id=stop-freezing"], true]));
    // Clear
    cleanup();
    // Nothing started and no focus
    render(<CoursesScreen repository={createRepository(new MemoryStore())} now={NOW} />);
    // Every course under one heading
    const all = await waitFor(() => hrefs("All courses"));
    // Confirm the rest left out the focus's course, and all twelve with no "Your course" (two for each focus area since decision 155)
    expect([rest.length, rest.includes("/courses/course?id=stories-that-land"), all.length, screen.queryByRole("region", { name: "Your course" })]).toEqual([11, false, 12, null]);
  });

  // Each course with how far through
  it("lists the courses", async () => {
    // One part done
    render(<CoursesScreen repository={await seeded([[BEAT1, "a", "2026-10-27T10:00:00Z"]])} now={NOW} />);
    // Confirm the card and its count
    const card = await screen.findByRole("link", { name: "Stop freezing, 1 of 16" });
    // Confirm where it leads, and its tile in place of the icon (decision 142)
    expect([card.getAttribute("href"), card.querySelector("[data-course-tile]")?.getAttribute("data-course-tile")]).toEqual(["/courses/course?id=stop-freezing", "stop-freezing"]);
  });
});

// Group the checks about a take recorded inside a course
describe("RecordingScreen inside a course", () => {
  // Stand-in recording pieces
  function services(): RecordingServices {
    // The pieces
    return {
      // Speech is supported
      speechSupported: () => true,
      // A microphone with no tracks
      openMicrophone: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) as unknown as MediaStream,
      // A transcriber that hears a sentence when stopped
      createTranscriber: () => ({ start: () => {}, stop: async () => "Cats, because they leave you alone until you need them." }),
      // A capture with a steady level
      createCapture: () => ({ level: () => 0.5, stop: async () => new Blob(["voice"]) }),
    };
  }

  // The goal shows, the take is saved with its part and try, and it goes on to the second try
  it("saves the course take and goes on to the next try", async () => {
    // A clock the check moves
    let time = new Date("2026-10-28T10:00:00Z").getTime();
    // Where it goes
    const navigate = vi.fn();
    // The repository
    const repository = createRepository(new MemoryStore());
    // Draw the first try of a two-try part
    render(<RecordingScreen promptId="t003" mode="talk" retryOf={null} repository={repository} services={services()} clock={() => new Date(time)} navigate={navigate} course={{ part: BEAT1, attempt: 1 }} />);
    // The course line and goal
    const line = (await screen.findByText(/lesson 1, part 1/)).textContent;
    // Start
    fireEvent.click(screen.getByRole("button", { name: /Show my topic/ }));
    // Past the countdown
    time += 11_000;
    // Wait for the stop
    const stop = await screen.findByRole("button", { name: /Stop/ }, { timeout: 15_000 });
    // Forty seconds
    time += 40_000;
    // Stop
    fireEvent.click(stop);
    // It goes on
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    // The saved take
    const [saved] = await repository.listSessions();
    // Confirm the line, the saved course take and the next address
    expect([line, saved?.course, navigate.mock.calls[0]![0]]).toEqual(["Stop freezing · lesson 1, part 1 · try 1 of 2", { part: BEAT1, attempt: 1 }, `/courses/part?id=${BEAT1}&step=try&try=2`]);
  }, 20_000);
});
