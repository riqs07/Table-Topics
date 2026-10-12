// Load the type for page metadata
import type { Metadata } from "next";
// Load the session sample component
import { ThemePreview } from "@/components/ThemePreview";
// Load the themes and their id type
import { THEMES, type ThemeId } from "@/theme/themes";

// Tab title for the style page
export const metadata: Metadata = { title: "Style tile · VoiceLab" };

// The style page: every theme side by side, for choosing at checkpoint C6
export default function StylePage() {
  // Draw one section per theme
  return (
    // Center a wide column with phone-friendly side padding
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Page heading */}
      <h1 className="font-display text-3xl">Style tile</h1>
      {/* How to use the page */}
      <p className="mt-2 max-w-prose text-ink-muted">
        Three starter themes, each in light and dark. Calm studio was chosen at checkpoint C6; the others are kept for comparison.
      </p>

      {/* One section per theme */}
      {(Object.keys(THEMES) as ThemeId[]).map((id) => (
        // Theme section, separated by a rule
        <section key={id} className="mt-12 border-t pt-8">
          {/* Theme name */}
          <h2 className="font-display text-2xl">{THEMES[id].name}</h2>
          {/* Theme description */}
          <p className="mt-1 text-ink-muted">{THEMES[id].description}</p>
          {/* Light and dark previews: stacked on phones, side by side on wider screens */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Light preview */}
            <ThemePreview themeId={id} mode="light" />
            {/* Dark preview */}
            <ThemePreview themeId={id} mode="dark" />
          </div>
        </section>
      ))}
    </main>
  );
}
