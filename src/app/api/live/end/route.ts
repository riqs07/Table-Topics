// POST /api/live/end: hands back a live conversation's unused minutes, once (logic and tests live in server/liveHandler.ts; decision 140)

// Load the handler builder
import { createLiveEndHandler } from "@/server/liveHandler";
// Load the real wiring
import { liveDeps } from "@/server/liveDeps";

// Handle POST requests: settle one live conversation
export const POST = createLiveEndHandler(liveDeps);
