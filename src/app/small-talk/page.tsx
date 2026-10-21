// Every Connect unit on one page (decision 95; until then the old Connect address redirected to Learn, decision 66)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the screen
import { UnitsScreen } from "@/components/screens/UnitsScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Everyday conversation · VoiceLab" };

// Draw the page
export default function UnitsPage() {
  // The screen loads its own data in the browser
  return <UnitsScreen />;
}
