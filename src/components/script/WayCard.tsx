// One kind of practice as a card with its blob scene (decision 136), used for Practice's main ways and Today's lesson and Quick play tiles (decision 137)

// Load Next.js's link component
import Link from "next/link";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the blob scenes
import { Scene, type SceneMotion, type SceneName } from "@/components/scenes/Scene";
// Load the pressed look
import { PRESS } from "@/components/script/Buttons";
// Load the card look
import { CARD } from "@/components/script/textStyles";

// One kind of practice on the page
export interface Way {
  // Its name
  name: string;
  // What it is, in a few words, with its length
  detail: string;
  // Where it starts (none while it cannot start yet)
  href: string | null;
  // Its icon
  icon: Icon;
  // Its blob scene, where it has one (decision 136)
  scene?: SceneName;
}

// One kind of practice as a card with its blob scene (decision 136): the big one across the top (its scene always moving, "Your focus" when the focus chose it), or one of the smaller ones below (their scenes play a few rounds, then rest); the whole card a link, quiet while it cannot start
export function WayCard({ way, big = false, forFocus = false, delay = 0 }: { way: Way; big?: boolean; forFocus?: boolean; delay?: number }) {
  // How much its scene moves
  const motion: SceneMotion = big ? "loop" : "few";
  // The scene's place: a white tile beside the words on the big card, a tinted panel above them on a small one
  const art = (
    <span aria-hidden="true" className={big ? "flex size-28 flex-none items-center justify-center rounded-[18px] bg-card" : "flex h-26 items-center justify-center rounded-2xl bg-warm-tint"}>
      {/* The scene */}
      {way.scene ? <Scene name={way.scene} motion={motion} className={big ? "size-26" : "size-24"} /> : <way.icon className="size-10 text-warm-ink" />}
    </span>
  );
  // The words: the name first (so the link is named by it), then what it is, with the focus mark shown above them
  const words = (
    <span className={`flex min-w-0 flex-col ${big ? "flex-1" : "mt-2.5"}`}>
      {/* The name */}
      <span className={`font-display font-semibold leading-tight tracking-tight ${big ? "text-2xl" : "text-xl"}`}>{way.name}</span>
      {/* What it is */}
      <span className="mt-0.5 text-footnote leading-snug text-ink-muted">{way.detail}</span>
      {/* The focus mark, drawn first */}
      {forFocus && <span className="order-first mb-1.5 self-start rounded-full bg-card px-2 py-0.5 text-tab font-semibold text-warm-ink">Your focus</span>}
    </span>
  );
  // The look: the big one tinted with the scene beside the words, the small ones white cards with the scene on top
  const look = big ? "flex items-center gap-4 rounded-[22px] bg-warm-tint p-3 pr-4" : `flex h-full flex-col p-3 pb-4 ${CARD}`;
  // Arriving with a small rise, one after another
  const arrive = { animationDelay: `${delay}ms` };
  // A card that starts it, or a quiet one
  return way.href ? (
    <Link href={way.href} data-way-card={big ? "big" : "small"} style={arrive} className={`${look} ${PRESS} motion-safe:animate-rise hover:text-accent`}>
      {/* The scene and the words */}
      {art}{words}
    </Link>
  ) : (
    <div data-way-card={big ? "big" : "small"} style={arrive} className={`${look} text-ink-muted motion-safe:animate-rise`}>{art}{words}</div>
  );
}

