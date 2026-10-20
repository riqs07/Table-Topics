// Today's plan for pages where it only fills in "next step" links: the plan's code, and the content it is worked out from, load after the page has shown (decision 88)

// Load the loaded-plan type (types only, so nothing is downloaded with the page)
import type { LoadedPlan } from "@/data/dailyPlan";
// Load the repository type
import type { Repository } from "@/data/repository";

// Load the plan's code, then today's plan
export async function loadDailyPlanLater(repository: Repository, now: Date): Promise<LoadedPlan> {
  // The plan's code, fetched now
  const { loadDailyPlan } = await import("@/data/dailyPlan");
  // Today's plan
  return loadDailyPlan(repository, now);
}
