// The old Connect page: its mission moved to Learn and its units live under Practice (decision 66), so old links land on Learn
import { redirect } from "next/navigation";

// Send old links on
export default function ConnectPage() {
  // To Learn, where today's mission now lives
  redirect("/learn");
}
