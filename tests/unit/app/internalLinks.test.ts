// Every internal address written in the app's content, logic and screens leads to a page the app has (decision 105): a removed page cannot leave a link behind
import { describe, expect, it } from "vitest";
// Load the file tools, to read the source and check the app's folders
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
// Load the path tools
import { join } from "node:path";

// The folders whose files hold links a user can follow (the server only calls other services, so it is left out)
const FOLDERS = ["src/content", "src/core", "src/components", "src/app", "src/data"];

// Strings that look like an address but are not one: a unit ("/min") and the service worker's own file
const NOT_ADDRESSES = new Set(["/min", "/sw"]);

// Every .ts and .tsx file under a folder
function sourceFiles(folder: string): string[] {
  // Each entry, walked
  return readdirSync(folder).flatMap((name) => {
    // Its full path
    const path = join(folder, name);
    // A folder: walk it; a source file: keep it
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

// The addresses in one file: a quote or backtick, then a slash and a lower-case path, ending at the quote, a query, an anchor or a ${…}
function addressesIn(text: string): string[] {
  // Each match's path part
  return [...text.matchAll(/["'`](\/[a-z][a-z0-9/-]*)(?=["'`?#]|\$\{)/g)].map((match) => match[1] ?? "").filter((path) => path && !NOT_ADDRESSES.has(path));
}

// Whether the app answers an address: a page, an API route, or a file it serves
function answered(path: string): boolean {
  // The address without a trailing slash
  const clean = path.replace(/\/$/, "");
  // A page or a route in the app folder, or a file (or folder of files) in public
  return existsSync(`src/app${clean}/page.tsx`) || existsSync(`src/app${clean}/route.ts`) || existsSync(`public${clean}`) || existsSync(`public${clean}.png`);
}

// Group the checks about internal links
describe("internal links", () => {
  // Every address the source names exists
  it("leads every address in content, logic and screens to a page the app has", () => {
    // Each file's addresses that lead nowhere
    const broken = FOLDERS.flatMap(sourceFiles).flatMap((file) => addressesIn(readFileSync(file, "utf8")).filter((path) => !answered(path)).map((path) => `${file}: ${path}`));
    // Confirm none
    expect(broken).toEqual([]);
  });

  // The scan really finds addresses, so an empty result is not a scan that saw nothing
  it("finds the addresses it checks", () => {
    // The addresses in the Learn cards
    const found = new Set(addressesIn(readFileSync("src/content/learn.ts", "utf8")));
    // Confirm a few well-known ones, and that a made-up page is caught
    expect([found.has("/session"), found.has("/stories/tell"), found.has("/voice/drill"), answered("/no-such-page"), addressesIn("href: \"/gone?x=1\"")]).toEqual([true, true, true, false, ["/gone"]]);
  });
});
