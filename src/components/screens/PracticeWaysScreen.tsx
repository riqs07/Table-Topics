"use client";
// One job's ways to practise (second design pass): reached from a picture card on Practice, "‹ Practice", the job's tile beside its name and how many ways, then every way as a row with its tile, the most relevant first (the groups that sat under "More ways to practise" before, decisions 108 and 125)

// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load every way to practise, grouped into jobs
import { JOB_LOOKS, usePracticeWays, type JobId } from "@/components/screens/usePracticeWays";
// Load the tile card for one way
import { WayTileCard } from "@/components/script/WayCard";
// Load the list page's header and Sage's line
import { BackLink, HubHeader } from "@/components/script/HubHeader";
import { NotFound } from "@/components/script/SageSays";
// Load the shared page shell
import { PAGE } from "@/components/script/layout";

// Whether a name is a job
function isJob(value: string): value is JobId {
  // One of the five
  return Object.hasOwn(JOB_LOOKS, value);
}

// The job named in the address
export function PracticeWaysFromAddress() {
  // The address's query
  const params = useSearchParams();
  // The job's list
  return <PracticeWaysScreen key={params.get("job") ?? ""} job={params.get("job") ?? ""} />;
}

// One job's list
export function PracticeWaysScreen({ job, ...props }: ScreenProps & { job: string }) {
  // The repository and today (null until in the browser)
  const { repo, today } = useScreenBasics(props);
  // Every way to practise, grouped
  const { jobs, rolePlay } = usePracticeWays(repo, today);
  // The job asked for
  const shown = isJob(job) ? (job === "role-play" ? rolePlay : jobs.find((item) => item.id === job)) : undefined;
  // Name the tab after it
  usePageTitle(shown?.title ?? "Practice");
  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* Heading and navigation, in Practice */}
      <Masthead title="VoiceLab" section="practice" />
      {shown ? (
        <>
          {/* The way back, then the job's tile on its tint, its name and how many ways */}
          <HubHeader back={{ href: "/practice", label: "Practice" }} look={shown.look} title={shown.title} chip={shown.focus ? "Your focus" : undefined} line={`${shown.ways.length} ways to practise. Pick one and speak.`} />
          {/* Every way */}
          <ul aria-label="Ways to practise" data-wide className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {/* Each one */}
            {shown.ways.map((way, index) => <li key={way.name}><WayTileCard way={way} tilt={index % 2 ? 4 : -4} /></li>)}
          </ul>
        </>
      ) : (
        <>
          {/* The way back */}
          <BackLink href="/practice" label="Practice" />
          {/* Nothing by that name: Sage says so, with the way back as the one action */}
          <NotFound title="There is no list by that name." back={{ href: "/practice", label: "Back to Practice" }} className="mt-4" />
        </>
      )}
    </main>
  );
}
