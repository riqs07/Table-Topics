"use client";
// Load what the course pages need (decision 131): progress through every course and the takes made inside courses, with a failure that can be tried again (rule T1)

// Load React's state and effect tools
import { useCallback, useEffect, useState } from "react";
// Load the progress loader
import { loadCourseProgress } from "@/data/courses";
// Load the progress type
import type { CourseProgress } from "@/core/courses";
// Load the record and repository types
import type { SessionRecord } from "@/data/records";
import type { Repository } from "@/data/repository";

// What the pages get: loading, failed with a way to try again, or the data
export type CourseData = { status: "loading" } | { status: "failed"; retry: () => void } | { status: "ready"; progress: CourseProgress; takes: SessionRecord[]; reload: () => void };

// Load progress and course takes once the date is known
export function useCourseData(repo: Repository, today: Date | null): CourseData {
  // The state
  const [data, setData] = useState<CourseData>({ status: "loading" });
  // Bumped to load again
  const [attempt, setAttempt] = useState(0);
  // Load again
  const again = useCallback(() => setAttempt((count) => count + 1), []);

  // Load both
  useEffect(() => {
    // Wait for the date (the browser's, after the first draw)
    if (!today) return;
    // Ignore the result if the page closes first
    let cancelled = false;
    // Read progress and every take
    Promise.all([loadCourseProgress(repo, today), repo.listSessions()])
      .then(([progress, sessions]) => {
        // Keep them, with only the course takes, oldest first
        if (!cancelled) setData({ status: "ready", progress, takes: sessions.filter((session) => session.course).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), reload: again });
      })
      .catch(() => {
        // Say so, with a way to try again
        if (!cancelled) setData({ status: "failed", retry: again });
      });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [again, attempt, repo, today]);

  // The state
  return data;
}
