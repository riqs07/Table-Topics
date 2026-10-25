// The 4/3/2 drill: the same content told three times, shorter each time (decisions 118 and 126)
import type { Metadata } from "next";
// Load the screen
import { FourThreeTwoScreen } from "@/components/screens/FourThreeTwoScreen";

// The browser tab's title
export const metadata: Metadata = { title: "4/3/2 · VoiceLab" };

// Draw the page
export default function FourThreeTwoPage() {
  // The screen
  return <FourThreeTwoScreen />;
}
