// The old Lessons address: lessons now live on the Skills page
import { redirect } from "next/navigation";

// Send old links and bookmarks to the lessons on Skills
export default function LessonsPage() {
  // Go there
  redirect("/skills#lessons");
}
