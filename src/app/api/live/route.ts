// POST /api/live: starts a live conversation with a short-lived vendor token (logic and tests live in server/liveHandler.ts; decisions 119 and 121)

// Load the handler builder
import { createLiveStartHandler } from "@/server/liveHandler";
// Load the real wiring
import { liveDeps } from "@/server/liveDeps";

// Handle POST requests: a token for one live conversation
export const POST = createLiveStartHandler(liveDeps);
