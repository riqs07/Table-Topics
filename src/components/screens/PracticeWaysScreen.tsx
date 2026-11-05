"use client";
// One job's ways to practise (second design pass): reached from a picture card on Practice, "‹ Practice", the job's tile beside its name and how many ways, then every way as a row with its tile, the most relevant first (the groups that sat under "More ways to practise" before, decisions 108 and 125)

// Load Next.js's link component
import Link from "next/link";
// Load the address reader
import { useSearchParams } from "next/navigation";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the page heading with the main navigation
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen set-up
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load every way to practise, grouped into jobs
import { JOB_LOOKS, usePracticeWays, type JobId } from "@/components/screens/usePracticeWays";
// Load the row for one way
import { WayRow } from "@/components/script/WayCard";
// Load the mode tile and its tints
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
// Load the shared looks
import { CARD_LIST, CHIP_GOOD } from "@/components/script/textStyles";
import { TEXT_LINK } from "@/components/script/Buttons";
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
      {/* The way back */}
      <p className="mt-1 md:-mt-12"><Link href="/practice" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" weight="bold" className="size-4" />Practice</Link></p>
      {shown ? (
        <>
          {/* The job's tile on its tint, its name and how many ways */}
          <div className={`mt-3 flex items-center gap-4 rounded-[22px] p-4 md:gap-5 md:p-5 ${GROUND_TINT[shown.look.ground]}`}>
            {/* The tile */}
            <ModeTile ground={shown.look.ground} prop={shown.look.prop} face={shown.look.face} tilt={-4} motion="loop" className="size-20 md:size-24" />
            {/* The words */}
            <div className="min-w-0">
              {/* Its focus mark */}
              {shown.focus && <span className={CHIP_GOOD}>Your focus</span>}
              {/* The page's name */}
              <h1 className="font-display text-statement leading-tight font-semibold">{shown.title}</h1>
              {/* How many */}
              <p className="font-bold text-ink">{shown.ways.length} ways to practise. Pick one and speak.</p>
            </div>
          </div>
          {/* Every way */}
          <ul aria-label="Ways to practise" className={`mt-5 ${CARD_LIST}`}>
            {/* Each one */}
            {shown.ways.map((way) => <li key={way.name}><WayRow way={way} /></li>)}
          </ul>
        </>
      ) : (
        <>
          {/* The page's heading */}
          <h1 className="mt-3 font-display text-statement font-semibold">Practice</h1>
          {/* Nothing by that name */}
          <p className="mt-2 text-lede">There is no list by that name. <Link href="/practice" className={TEXT_LINK} data-inline>Back to Practice</Link></p>
        </>
      )}
    </main>
  );
}
