// Load Next.js's link component for moving between pages
import Link from "next/link";
// Load the app's shared name so it is defined in one place
import { APP_NAME } from "@/core/appInfo";

// The home screen; a placeholder until the session screens are built (milestone 7)
export default function HomePage() {
  // Show the app name, a short note, and a link to the style page
  return (
    // Center a narrow column with phone-friendly side padding
    <main className="mx-auto max-w-xl px-4 py-12">
      {/* Show the app name as the page's main heading */}
      <h1 className="font-display text-4xl">{APP_NAME}</h1>
      {/* Tell the visitor the app is not ready yet */}
      <p className="mt-3 text-ink-muted">Setting up. Practice sessions are coming soon.</p>
      {/* Point to the style page for checkpoint C6 */}
      <Link href="/style" className="mt-8 inline-block underline underline-offset-4">
        {/* Link text */}
        Compare the themes
      </Link>
    </main>
  );
}
