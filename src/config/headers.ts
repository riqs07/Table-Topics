// Header names shared by the browser and the server (kept here so browser code never loads server-only files)

// Header the app sends the passphrase in
export const PASSPHRASE_HEADER = "x-voicelab-passphrase";

// Shortest passphrase the server accepts (checked on the server, and in Settings so a short one is caught at once)
export const MIN_PASSPHRASE_LENGTH = 16;

// Header carrying a take's length in seconds when its audio is sent for deeper analysis (decision 91)
export const DURATION_HEADER = "x-voicelab-duration";
