// Writes the service worker for this build (decision 88): the source in src/serviceWorker/sw.template.js with the build's id and its list of built files stamped in, saved as public/sw.js.
// Run by `pnpm build` after `next build`, so each release's worker differs from the last and browsers install it, clearing the old build's cached files.

// Load Node's file tools
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
// Load the tool that tells whether this file was run directly
import { fileURLToPath } from "node:url";

// The marker in the source that the build's id replaces
export const BUILD_MARKER = "__VOICELAB_BUILD__";
// The marker in the source that the list of built files replaces
export const FILES_MARKER = "/* __VOICELAB_FILES__ */";

/**
 * The worker's source with the build's id and its list of built files in place of the markers.
 * @param {string} source the worker's source
 * @param {string} buildId the build's id (letters, digits, - and _ only)
 * @param {string[]} [files] the addresses of the build's files, each under /_next/static/
 * @returns {string} the stamped source
 */
export function stampWorker(source, buildId, files = []) {
  // Refuse an id that is empty or could break the cache name or the code
  if (!/^[A-Za-z0-9_-]+$/.test(buildId)) throw new Error(`The build id "${buildId}" can only use letters, digits, - and _.`);
  // Refuse a source without exactly one of each marker, so a changed source never ships unstamped
  if (source.split(BUILD_MARKER).length !== 2 || source.split(FILES_MARKER).length !== 2) throw new Error(`The service worker source must contain ${BUILD_MARKER} and ${FILES_MARKER} exactly once each.`);
  // Refuse a file address outside the built files
  const outside = files.find((file) => !/^\/_next\/static\/[A-Za-z0-9._~/-]+$/.test(file));
  // Stop on one
  if (outside !== undefined) throw new Error(`"${outside}" is not a built file address.`);
  // Put the id and the list in
  return source.replace(BUILD_MARKER, buildId).replace(FILES_MARKER, files.map((file) => JSON.stringify(file)).join(", "));
}

/**
 * The addresses of every built script, style and font under a folder of .next/static (source maps left out).
 * @param {string} staticFolder the build's static folder, such as ".next/static"
 * @param {string} folder the folder inside it, such as "chunks"
 * @returns {string[]} the addresses, sorted
 */
export function builtFiles(staticFolder, folder) {
  // Every file below the folder, as a path relative to it
  const paths = readdirSync(`${staticFolder}/${folder}`, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile() && !entry.name.endsWith(".map")).map((entry) => `${entry.parentPath}/${entry.name}`.slice(staticFolder.length + 1));
  // As addresses the site serves, sorted so the worker is the same for the same build
  return paths.map((path) => `/_next/static/${path}`).sort();
}

/**
 * Whether a built script is the phone call's SDK (@elevenlabs/client with LiveKit, about 600 KB; decision 142), which is loaded only when a call starts and needs the network anyway, so it is not saved for everyone at install.
 * @param {string} source the script's text
 * @returns {boolean} true for the call's SDK
 */
export function callOnlyChunk(source) {
  // The SDK's own address for its calls is in no other script
  return source.includes("/v1/convai/conversation");
}

/**
 * The built media files (fonts, images) that the prerendered pages name, so only those are saved at install (decision 99): the other theme's fonts and the extra-alphabet subsets are left to load when a page asks for them.
 * @param {string[]} media the addresses of every built media file
 * @param {string[]} pages the HTML of the prerendered pages
 * @returns {string[]} the media addresses the pages name, sorted
 */
export function usedMedia(media, pages) {
  // Every built-file address the pages name
  const named = new Set(pages.flatMap((html) => [...html.matchAll(/\/_next\/static\/media\/[^"'\s)\\]+/g)].map((match) => match[0])));
  // The media files among them
  return media.filter((file) => named.has(file)).sort();
}

/**
 * The HTML of every prerendered page in a folder and the folders inside it.
 * @param {string} folder the folder, such as ".next/server/app"
 * @returns {string[]} each page's HTML
 */
export function prerenderedPages(folder) {
  // Every .html file below it
  return readdirSync(folder, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".html")).map((entry) => readFileSync(`${entry.parentPath}/${entry.name}`, "utf8"));
}

// When run directly: read this build's id, stamp the worker and save it where the site serves it
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // The id Next.js gave this build
  const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
  // The worker's source
  const source = readFileSync("src/serviceWorker/sw.template.js", "utf8");
  // This build's scripts and styles, and the fonts its pages use (decision 99)
  const files = [...builtFiles(".next/static", "chunks").filter((file) => !callOnlyChunk(readFileSync(`.next${file.slice("/_next".length)}`, "utf8"))), ...usedMedia(builtFiles(".next/static", "media"), prerenderedPages(".next/server/app"))];
  // Save the stamped worker
  writeFileSync("public/sw.js", stampWorker(source, buildId, files));
  // Say what was written
  console.log(`Service worker written for build ${buildId} (${files.length} built files to save offline)`);
}
