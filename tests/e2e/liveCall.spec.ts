// Browser check for a phone call with the ElevenLabs agent (decision 142): the real SDK (@elevenlabs/client), loaded on Start, talks over a WebSocket to a stand-in agent inside the page (in place of the browser's WebSocket, since the checks cannot reach ElevenLabs). The stand-in checks the overrides it is sent, opens with the persona's line, "hears" a line of yours and answers; hanging up saves the call, and the coach reviews it as usual
import { expect, test, useStandIns } from "./support/fixtures";

// What the stand-in agent "hears" you say
const YOUR_LINE = "I went climbing on Saturday";

// The call: the SDK opens the stand-in agent's socket; the transcript is saved and the coach runs
test("a phone call's transcript is saved and the coach reviews it", async ({ page }) => {
  // The stand-in microphone (the SDK opens it for the call)
  await useStandIns(page);
  // The welcome seen, the passphrase saved
  await page.addInitScript(() => {
    // Seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The stand-in agent, speaking the ElevenLabs conversation protocol as the SDK reads it
  await page.addInitScript((yourLine: string) => {
    // What the stand-in saw, for the check
    const seen = { urls: [] as string[], overrides: null as unknown, closed: false };
    // Kept where the check can read it
    (window as unknown as { agentSeen: typeof seen }).agentSeen = seen;
    // The stand-in socket
    class StandInAgent extends EventTarget {
      // Connecting, then open
      readyState = 0;
      // The protocol agreed
      protocol = "convai";
      // Set by the SDK
      binaryType = "blob";
      // Opens a moment later
      constructor(readonly url: string) {
        // An event target
        super();
        // Noted
        seen.urls.push(url);
        // Open
        setTimeout(() => {
          // Open
          this.readyState = 1;
          // Said
          this.dispatchEvent(new Event("open"));
        }, 50);
      }
      // A message from the stand-in agent
      private say(message: unknown) {
        // Only while open
        if (this.readyState === 1) this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(message) }));
      }
      // The SDK sends JSON: the call's set-up first, then audio chunks and pongs
      send(data: string) {
        // Read
        const message = JSON.parse(data) as { type?: string; conversation_config_override?: { agent?: { first_message?: string } } };
        // The set-up: noted, then the call begins
        if (message.type === "conversation_initiation_client_data") {
          // The overrides
          seen.overrides = message.conversation_config_override ?? null;
          // The call's details
          this.say({ type: "conversation_initiation_metadata", conversation_initiation_metadata_event: { conversation_id: "stand-in-call", agent_output_audio_format: "pcm_16000", user_input_audio_format: "pcm_16000" } });
          // The persona's first line
          setTimeout(() => this.say({ type: "agent_response", agent_response_event: { agent_response: message.conversation_config_override?.agent?.first_message ?? "Hello", event_id: 1 } }), 300);
          // Your line, heard
          setTimeout(() => this.say({ type: "user_transcript", user_transcription_event: { user_transcript: yourLine, event_id: 2 } }), 1_500);
          // The reply
          setTimeout(() => this.say({ type: "agent_response", agent_response_event: { agent_response: "Climbing! Indoors or out?", event_id: 3 } }), 2_000);
        }
      }
      // Closed by the SDK
      close() {
        // Noted
        seen.closed = true;
        // Closed
        this.readyState = 3;
        // Said, normally
        this.dispatchEvent(new CloseEvent("close", { code: 1000 }));
      }
    }
    // Installed in place of the browser's
    Object.assign(window, { WebSocket: StandInAgent });
  }, YOUR_LINE);
  // The live route: a WebSocket call
  const live: string[] = [];
  // Granted
  await page.route("**/api/live", (route) => {
    // Noted
    live.push(JSON.parse(route.request().postData() ?? "{}").kind as string);
    // A signed address (the stand-in ignores it)
    return route.fulfill({ json: { kind: "b", connection: "websocket", signedUrl: "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_x&conversation_signature=stand-in", grantedSeconds: 300, minutesLeft: 55, minutesPerMonth: 60 } });
  });
  // The settle route
  await page.route("**/api/live/end", (route) => {
    // Noted
    live.push("end");
    // Done
    return route.fulfill({ json: { refunded: 4 } });
  });
  // Settings' minutes check
  await page.route("**/api/conversation", (route) => route.fulfill({ json: { minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 } }));
  // What the coach was sent
  const coached: string[] = [];
  // The coach, stood in
  await page.route("**/api/feedback", (route) => {
    // Noted
    coached.push(route.request().postData() ?? "");
    // Its notes
    return route.fulfill({ json: { feedback: { keep: "You shared a real weekend detail.", change: "Ask Maya something back.", retryCue: "Answer, then ask.", conversation: { yours: YOUR_LINE, better: "I went climbing on Saturday. Do you climb?" } } } });
  });
  // A phone call chosen
  await page.goto("/settings");
  // Chosen
  await page.getByRole("button", { name: "Phone call (beta)" }).click();
  // Saved
  await expect(page.getByRole("button", { name: "Phone call (beta)" })).toHaveAttribute("aria-pressed", "true");
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // On the call, her reply arrives after your line
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Climbing! Indoors or out?", { timeout: 20_000 });
  // Hang up
  await page.getByRole("button", { name: "End call" }).click();
  // Saved, opened on its results, and the coach's line arrives
  await expect(page.getByText("It could sound like")).toBeVisible({ timeout: 20_000 });
  // What the stand-in agent saw
  const seen = await page.evaluate(() => (window as unknown as { agentSeen: { urls: string[]; overrides: { agent: { prompt: { prompt: string }; first_message: string; language: string }; tts: { voice_id: string } }; closed: boolean } }).agentSeen);
  // The signed address, Maya's prompt, her first line and stand-in voice, the socket closed, the minutes settled, and your line sent to the coach
  expect([seen.urls[0]?.startsWith("wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_x"), seen.overrides.agent.prompt.prompt.includes("Character: Maya"), seen.overrides.agent.first_message, seen.overrides.agent.language, seen.overrides.tts.voice_id, seen.closed, live, coached.some((body) => body.includes(YOUR_LINE))]).toEqual([true, true, "Oh hi! I don’t think we’ve properly met. I’m Maya, I just joined the team.", "en", "Mac2FKpSgaGIsaNRXt8A", true, ["b", "end"], true]);
  // The results show the call's turns on the timeline
  await expect(page.locator("[data-conversation-timeline]")).toBeVisible();
});
