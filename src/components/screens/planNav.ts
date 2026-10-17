// Where a session sits inside today's practice, for the pages after a recording

// The step, how many there are, and the next one
export interface PlanNav {
  // This step, counted from 1
  step: number;
  // How many steps today has
  total: number;
  // The next step's address and name, or null after the last
  next: { href: string; label: string } | null;
}
