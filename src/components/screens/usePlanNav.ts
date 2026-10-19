"use client";
// Inside today's practice: which step this page is, how many there are, and where the next one is (used by the voice pages; decision 80)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the plan loader
import { loadDailyPlan } from "@/data/dailyPlan";
// Load the plan address maker
import { planHref } from "@/core/dailyPlan";
// Load the plan position type
import type { PlanNav } from "@/components/screens/planNav";
// Load the repository type
import type { Repository } from "@/data/repository";

// Load where this step sits, once the date is known (null outside today's practice or until loaded)
export function usePlanNav(repo: Repository, today: Date | null, planStep: number | null): PlanNav | null {
  // The position, once loaded
  const [plan, setPlan] = useState<PlanNav | null>(null);

  // Load it
  useEffect(() => {
    // Only inside the plan, in the browser
    if (!planStep || !today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Load today's plan
    loadDailyPlan(repo, today).then((loaded) => {
      // Stop if closed
      if (cancelled) return;
      // The next step, if any
      const after = loaded.steps[planStep];
      // Keep where this step sits
      setPlan({ step: planStep, total: loaded.steps.length, next: after ? { href: planHref(after, planStep + 1), label: after.label } : null });
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [planStep, repo, today]);

  // Hand it back
  return plan;
}
