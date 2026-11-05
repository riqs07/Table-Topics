// The Chart Kit's key (second design pass): each mark drawn small beside its name, the same five marks every chart uses, so a key reads the same everywhere

// The marks a key can show
export type KeyKind = "voice" | "ghost-ribbon" | "pause" | "pause-grey" | "um" | "pitch" | "ghost" | "ghost-faint" | "band" | "fell";

// One mark, drawn small (decoration: its name is beside it)
function KeyMark({ kind }: { kind: KeyKind }) {
  // The picture
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true" className="flex-none">
      {/* Your voice: a few rounded bars */}
      {(kind === "voice" || kind === "ghost-ribbon") && [3, 8, 13, 18, 23].map((x, index) => <rect key={x} x={x - 1.5} y={[4, 1, 3, 2, 5][index]} width="3" height={14 - 2 * [4, 1, 3, 2, 5][index]!} rx="1.5" className={kind === "voice" ? "fill-chart-voice" : "fill-chart-ghost"} />)}
      {/* A real pause: a soft band */}
      {kind === "pause" && <rect x="2" y="5" width="22" height="4" rx="2" className="fill-chart-well" opacity="0.45" />}
      {/* A pause the headline does not praise: a grey dashed line */}
      {kind === "pause-grey" && <line x1="3" x2="23" y1="7" y2="7" className="stroke-chart-ghost" strokeWidth="3" strokeDasharray="3 3" strokeLinecap="round" />}
      {/* A pause word: a dot */}
      {kind === "um" && <circle cx="13" cy="7" r="4.5" className="fill-chart-um" />}
      {/* Pitch: one soft line */}
      {kind === "pitch" && <path d="M2 9 Q9 3 15 7 T24 5" className="stroke-chart-voice" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {/* Your last time: a dashed ghost */}
      {kind === "ghost" && <line x1="2" x2="24" y1="7" y2="7" className="stroke-chart-ghost" strokeWidth="2.5" strokeDasharray="5 3" strokeLinecap="round" />}
      {/* An earlier time still: fainter dots */}
      {kind === "ghost-faint" && <line x1="2" x2="24" y1="7" y2="7" className="stroke-chart-ghost" strokeWidth="2" strokeDasharray="1 4" strokeLinecap="round" />}
      {/* The target: a band */}
      {kind === "band" && <rect x="1" y="2" width="24" height="10" rx="3" className="fill-chart-band stroke-chart-well" strokeWidth="1" />}
      {/* A clean fall at the end: a teal dot */}
      {kind === "fell" && <circle cx="13" cy="7" r="4" className="fill-chart-well" />}
    </svg>
  );
}

// A key: each mark with its name, in a row that wraps
export function ChartKey({ items }: { items: ReadonlyArray<{ kind: KeyKind; name: string }> }) {
  // The row
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
      {/* Each mark */}
      {items.map((item) => <span key={`${item.kind}-${item.name}`} className="flex items-center gap-1.5"><KeyMark kind={item.kind} />{item.name}</span>)}
    </div>
  );
}
