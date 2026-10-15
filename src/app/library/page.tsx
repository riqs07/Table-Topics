// The old Library address: readings now live on the Skills page
import { redirect } from "next/navigation";

// Send old links and bookmarks to the readings on Skills
export default function LibraryPage() {
  // Go there
  redirect("/skills#readings");
}
