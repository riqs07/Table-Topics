// Your speaking profile, /profile and /profile?session=... (logic and tests live in components/screens/ProfileScreen.tsx; decision 90)

// Load the type for page metadata
import type { Metadata } from "next";
// Load React's tool for waiting on the address to be read
import { Suspense } from "react";
// Load the frame shown while the address is read (decision 76)
import { PageFallback } from "@/components/script/PageFallback";
// Load the address-reading wrapper
import { ProfileFromAddress } from "@/components/screens/ProfileFromAddress";

// Tab title
export const metadata: Metadata = { title: "Your speaking profile · VoiceLab" };

// Draw the profile for the address
export default function ProfilePage() {
  // The address is read in the browser, so wrap it for Next.js
  return (
    <Suspense fallback={<PageFallback title="Settings" />}>
      <ProfileFromAddress />
    </Suspense>
  );
}
