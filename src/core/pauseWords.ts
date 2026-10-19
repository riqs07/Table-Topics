// Whether pause words (um, uh, like) are counted on screen, and whether fluency is judged at all (decision 79)

// The two settings that decide it
interface PauseWordSettings {
  // "Show pause-word counts" (missing means shown)
  showPauseWords?: boolean;
  // "I stammer" (missing means off)
  stammer?: boolean;
}

// Whether pause-word counts, marks and headlines show: unless switched off, or the user stammers
export function pauseWordsShown(settings: PauseWordSettings): boolean {
  // Shown unless either says not to
  return settings.showPauseWords !== false && settings.stammer !== true;
}

// Whether fluency is judged (repeats, pace that is slow, phrases that fade): not for a user who stammers
export function fluencyJudged(settings: PauseWordSettings): boolean {
  // Judged unless the user stammers
  return settings.stammer !== true;
}
