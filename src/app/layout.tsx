// Load the type for page metadata such as the browser tab title
import type { Metadata } from "next";
// Load the type for components that wrap other content
import type { ReactNode } from "react";
// Load the app's shared name so it is defined in one place
import { APP_NAME } from "@/core/appInfo";
// Load the font variables for every theme
import { fontVariables } from "@/theme/fonts";
// Load the builder for the theme stylesheet
import { themeCss } from "@/theme/themeCss";
// Load the theme used until checkpoint C6
import { DEFAULT_THEME } from "@/theme/themes";
// Load Tailwind and the role colors
import "./globals.css";

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
    // Declare the language, switch on the current theme, and make every font available
    <html lang="en" data-theme={DEFAULT_THEME} className={fontVariables}>
      <head>
        {/* Add the theme variables (built from theme/themes.ts) to the page */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      {/* Place the current page inside the document body */}
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
