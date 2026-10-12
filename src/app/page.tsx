// Load the app's shared name so it is defined in one place
import { APP_NAME } from "@/core/appInfo";

// The home screen; a placeholder until the session screens are built (milestone 7)
export default function HomePage() {
  // Show the app name and a short note that the app is being set up
  return (
    // Wrap the page content in the main landmark for screen readers
    <main>
      {/* Show the app name as the page's main heading */}
      <h1>{APP_NAME}</h1>
      {/* Tell the visitor the app is not ready yet */}
      <p>Setting up. Practice sessions are coming soon.</p>
    </main>
  );
}
