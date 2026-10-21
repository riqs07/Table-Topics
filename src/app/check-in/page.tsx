// Your check-ins: today's or the next one, quick ways to compare, and every check-in so far (decision 100)
import type { Metadata } from "next";
// Load the screen
import { CheckInScreen } from "@/components/screens/CheckInScreen";

// The browser tab's title
export const metadata: Metadata = { title: "Your check-ins · VoiceLab" };

// Draw the page
export default function CheckInPage() {
  // The screen
  return <CheckInScreen />;
}
