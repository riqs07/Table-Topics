// The home page: shows the Home screen (logic and tests live in components/screens/HomeScreen.tsx)

// Load the Home screen
import { HomeScreen } from "@/components/screens/HomeScreen";

// Draw the Home screen with the browser's saved data
export default function HomePage() {
  // The screen loads its own data in the browser
  return <HomeScreen />;
}
