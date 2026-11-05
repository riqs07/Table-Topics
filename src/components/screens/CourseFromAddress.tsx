"use client";
// Reads the guided course pages' addresses (decision 131): /courses/course?id=…, /courses/part?id=…&step=…&try=…, and /courses/revisit?id=…&take=…

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the screens
import { CourseScreen } from "@/components/screens/CourseScreen";
// Load the illustrated course headers (the Illustration Study)
import { CourseHeader } from "@/components/scenes/CourseHeader";
import { CoursePartScreen } from "@/components/screens/CoursePartScreen";
import { CourseRevisitScreen } from "@/components/screens/CourseRevisitScreen";
// Load the step type
import type { PartStep } from "@/core/courses";

// The steps a part's address may name
const STEPS: ReadonlyArray<PartStep> = ["learn", "see", "try", "wrap"];

// The course named in the address
export function CourseFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The course
  // The course's id from the address
  const id = params.get("id") ?? "";
  // The course, its illustrated scene at the top of its band
  return <CourseScreen key={id} courseId={id} header={<CourseHeader course={id} fit="cover" className="h-44 overflow-hidden rounded-2xl md:h-60" />} />;
}

// The part and step named in the address
export function CoursePartFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The step named, if it is one
  const named = params.get("step");
  // A known step, else the first
  const step = STEPS.find((item) => item === named) ?? "learn";
  // The try, 2 only when asked for
  const attempt = params.get("try") === "2" ? 2 : 1;
  // The part, drawn afresh for each step and try
  return <CoursePartScreen key={`${params.get("id")}-${step}-${attempt}`} partId={params.get("id") ?? ""} step={step} attempt={attempt} />;
}

// The comeback named in the address
export function CourseRevisitFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The comparison
  return <CourseRevisitScreen key={params.get("take") ?? ""} partId={params.get("id") ?? ""} takeId={params.get("take") ?? ""} />;
}
