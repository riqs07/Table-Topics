// Load the type for page metadata such as the browser tab title
import type { Metadata } from "next";
// Load the type for components that wrap other content
import type { ReactNode } from "react";
// Load the app's shared name so it is defined in one place
import { APP_NAME } from "@/core/appInfo";

// Title and description shown in the browser tab and search results
export const metadata: Metadata = {
  // Use the app name as the tab title
  title: APP_NAME,
  // Describe the app in one sentence
  description: "Private, one-minute speaking practice.",
};

// The outer frame shared by every page
export default function RootLayout({ children }: { children: ReactNode }) {
  // Wrap every page in the basic HTML document structure
  return (
    // Declare the page language so screen readers pronounce it correctly
    <html lang="en">
      {/* Place the current page inside the document body */}
      <body>{children}</body>
    </html>
  );
}
