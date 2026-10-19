// Load the type for page metadata such as the browser tab title
import type { Metadata, Viewport } from "next";
// Load the type for components that wrap other content
import { Suspense, type ReactNode } from "react";
// Load the app's shared name so it is defined in one place
import { APP_NAME } from "@/core/appInfo";
// Load the font variables for every theme
import { fontVariables } from "@/theme/fonts";
// Load the builder for the theme stylesheet
import { themeCss } from "@/theme/themeCss";
// Load the background sender for waiting feedback
import { FeedbackSync } from "@/components/FeedbackSync";
// Load the focus mover for page changes
import { RouteFocus } from "@/components/RouteFocus";
// Load the offline worker registration
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
// Load the app theme
import { DEFAULT_THEME, THEMES } from "@/theme/themes";
// Load Tailwind and the role colors
import "./globals.css";
// Load the early script that applies a saved light or dark choice
import { COLOR_MODE_SCRIPT } from "@/data/colorMode";

// Title and description shown in the browser tab and search results
export const metadata: Metadata = {
  // Use the app name as the tab title
  title: APP_NAME,
  // Describe the app in one sentence
  description: "Private public-speaking practice.",
  // Settings for iPhone home-screen apps
  appleWebApp: {
    // Open full screen from the home screen
    capable: true,
    // Name under the icon
    title: APP_NAME,
    // Light status bar text over the page
    statusBarStyle: "default",
  },
};

// Browser color for the address bar and status bar, from the theme
export const viewport: Viewport = {
  // The accent color
  themeColor: THEMES[DEFAULT_THEME].colors.light.accent,
};

// The outer frame shared by every page
export default function RootLayout({ children }: { children: ReactNode }) {
  // Wrap every page in the basic HTML document structure
  return (
    // Declare the language, switch on the current theme, and make every font available
    <html lang="en" data-theme={DEFAULT_THEME} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Apply a saved light or dark choice before the page is drawn (it changes data-mode above, hence the hydration note) */}
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
        {/* Add the theme variables (built from theme/themes.ts) to the page */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      {/* Place the current page inside the document body */}
      <body className="min-h-dvh antialiased">
        {/* The current page */}
        {children}
        {/* Move focus to each new page's main heading (decision 76) */}
        <Suspense fallback={null}><RouteFocus /></Suspense>
        {/* Send waiting feedback when the app opens and when the connection returns */}
        <FeedbackSync />
        {/* Register the offline worker in the released app */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
