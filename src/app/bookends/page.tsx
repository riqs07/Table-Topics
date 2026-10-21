// The old Openings and closings address: the drill was retired (decision 106), so old links and bookmarks lead to Practice
import { redirect } from "next/navigation";

// Send old links to Practice
export default function BookendsPage() {
  // Go there
  redirect("/practice");
}
