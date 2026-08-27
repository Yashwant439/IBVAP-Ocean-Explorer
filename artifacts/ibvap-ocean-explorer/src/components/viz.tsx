import { ArrowDownRight, ArrowUpRight, Circle, Crosshair, Navigation } from "lucide-react";
import { useMemo, useState } from "react";
import type { CurrentLayer, OceanSlice, Observation } from "@workspace/api-client-react";

export function FieldCanvas({
  compact = false,
  slice,
  currents,
  observations = [],
  showCurrents = false,
  showObservations = false,
  opacity = 0.92,
  exaggeration = 1,
  onObservationSelect,
}: {
  compact?: boolean;
  slice?: OceanSlice;
  currents?: CurrentLayer;
  observations?: Observation[];
  showCurrents?: boolean;
  showObservations?: boolean;
  opacity?: number;
  exaggeration?: number;
  onObservationSelect?: (observation: Observation) => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const values = slice?.values ?? [Array.from({ length: 20 }, (_, index) => 19 + (index % 7) * 1.8)];
  const columns = slice?.longitude?.length ?? 20;
  const cells = useMemo(() => values.flat(), [values]);
  const normalize = (value: number) => {
    const min = slice?.min ?? 16;
    const max = slice?.max ?? 32;
    return Math.max(0, Math.min(1, (value - min) / Math.max(0.001, max - min)));
  };
  const position = (latitude: number, longitude: number) => ({
    left: `${Math.max(2, Math.min(98, ((longitude - 45) / 55) * 100))}%`,
    top: `${Math.max(4, Math.min(96, ((25 - latitude) / 43) * 100))}%`,
  });
  return <div className={`relative overflow-hidden rounded-lg border border-border bg-[hsl(201_49%_17%)] ${compact ? "h-[228px]" : "h-[390px]"}`}>
    <div
      className="absolute inset-0 origin-center transition-transform duration-300"
      style={{ transform: `perspective(900px) rotateX(${Math.min(22, exaggeration * 2)}deg) rotateZ(${rotation}deg) scale(${1 + exaggeration * .015})`, opacity }}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
      onPointerMove={(event) => { if (dragging) setRotation((current) => current + event.movementX * .08); }}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: "linear-gradient(135deg, hsl(201 49% 17%), hsl(195 50% 24%))" }} />
      <div className="absolute inset-0 grid gap-px opacity-90" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {cells.map((value, index) => {
          const normalized = normalize(value);
          return <div key={index} title={`${value} ${slice?.unit ?? ""}`} style={{ backgroundColor: `hsl(${198 - normalized * 160} ${68 + normalized * 12}% ${34 + normalized * 25}% / ${.48 + normalized * .46})` }} />;
        })}
      </div>
    </div>
    <div className="absolute inset-0 opacity-25 hairline-grid" />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 390" preserveAspectRatio="none">
      {showCurrents && currents?.points.slice(0, compact ? 32 : 80).map((point) => {
        const x = ((point.longitude - 45) / 55) * 800;
        const y = ((25 - point.latitude) / 43) * 390;
        const length = 7 + point.speed * 15;
        const angle = Math.atan2(-point.v, point.u) * 180 / Math.PI;
        return <g key={`${point.latitude}-${point.longitude}`} transform={`translate(${x} ${y}) rotate(${angle})`} opacity=".8"><line x1={-length / 2} x2={length / 2} stroke="hsl(38 82% 70%)" strokeWidth="1.3" /><path d={`M ${length / 2 - 3} -2 L ${length / 2} 0 L ${length / 2 - 3} 2`} fill="none" stroke="hsl(38 82% 70%)" strokeWidth="1.3" /></g>;
      })}
      <text x="42" y="33" fill="hsl(190 32% 90% / .7)" fontSize="10" fontFamily="DM Mono">INDIAN OCEAN FIELD / 12°S 72°E</text>
      <text x="660" y="365" fill="hsl(190 32% 90% / .55)" fontSize="9" fontFamily="DM Mono">0°</text>
      <text x="42" y="365" fill="hsl(190 32% 90% / .55)" fontSize="9" fontFamily="DM Mono">40°S</text>
    </svg>
    {showObservations && observations.slice(0, compact ? 18 : 42).map((observation) => <button
      key={observation.id}
      className="absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-accent shadow-[0_0_0_3px_hsl(173_70%_48%_/_0.18)] hover:scale-150"
      style={position(observation.latitude, observation.longitude)}
      title={`${observation.platform_name} · click to inspect`}
      onClick={() => onObservationSelect?.(observation)}
      aria-label={`Inspect ${observation.platform_name}`}
    />)}
    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-white/15 bg-slate-950/35 px-2 py-1.5 backdrop-blur-sm"><span className="font-mono-science text-[9px] text-white/70">TEMPERATURE</span><span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, hsl(198 65% 56%), hsl(173 70% 48%), hsl(38 82% 58%))" }} /><span className="font-mono-science text-[9px] text-white/70">18—31°C</span></div>
    {!compact && <div className="absolute right-3 top-3 rounded-md border border-white/15 bg-slate-950/35 p-2 text-white/80 backdrop-blur-sm"><Crosshair size={15} /></div>}
    {!compact && <div className="absolute right-3 bottom-3 rounded-md border border-white/15 bg-slate-950/35 px-2 py-1 font-mono-science text-[9px] text-white/65 backdrop-blur-sm">{dragging ? "DRAG TO ROTATE" : "DRAG FIELD TO ROTATE"}</div>}
  </div>;
}

export function MiniMap({ tracks = true }: { tracks?: boolean }) {
  const dots = [[18,42],[28,53],[35,34],[47,58],[56,42],[62,67],[70,32],[78,54],[87,40],[49,25],[24,72],[67,77]];
  return <div className="relative h-[340px] overflow-hidden rounded-xl border border-border bg-[hsl(202_55%_13%)]">
    <div className="absolute inset-0 opacity-20 hairline-grid" />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 340">
      <path d="M 40 85 L 116 51 L 204 63 L 284 32 L 364 47 L 445 23 L 540 60 L 566 119 L 516 172 L 458 214 L 402 282 L 319 255 L 254 288 L 195 241 L 130 221 L 84 173 Z" fill="hsl(191 40% 94% / .09)" stroke="hsl(191 40% 94% / .3)" strokeWidth="1" />
      <path d="M 30 270 C 142 225, 181 282, 267 227 S 413 197, 557 137" fill="none" stroke="hsl(173 70% 48% / .75)" strokeWidth="2" strokeDasharray="7 5" />
      <path d="M 110 305 C 177 251, 239 275, 315 212 S 461 120, 541 82" fill="none" stroke="hsl(38 82% 58% / .72)" strokeWidth="2" />
      <path d="M 65 124 C 180 83, 270 160, 354 118 S 476 86, 551 116" fill="none" stroke="hsl(198 65% 56% / .54)" strokeWidth="1.4" />
      <text x="42" y="321" fill="hsl(191 40% 94% / .62)" fontSize="10" fontFamily="DM Mono">40°S</text><text x="518" y="321" fill="hsl(191 40% 94% / .62)" fontSize="10" fontFamily="DM Mono">110°E</text>
    </svg>
    {dots.map(([x, y], i) => <span key={i} className="absolute size-2 rounded-full border border-white/80 bg-accent shadow-[0_0_0_3px_hsl(173_70%_48%_/_0.18)]" style={{ left: `${x}%`, top: `${y}%` }} />)}
    {tracks && <div className="absolute bottom-3 left-3 flex gap-3 rounded-md border border-white/15 bg-slate-950/40 px-2.5 py-2 text-[9px] text-white/70 backdrop-blur-sm"><span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-accent" />GLIDER TRACK</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-[hsl(38_82%_58%)]" />ARGO DRIFT</span></div>}
    <div className="absolute right-3 top-3 rounded-md border border-white/15 bg-slate-950/35 p-2 text-white/70"><Navigation size={14} /></div>
  </div>;
}

export function ComparisonBars({ values = [0.86, 0.76, 0.91, 0.68, 0.82, 0.74, 0.9] }: { values?: number[] }) {
  return <div className="flex h-[168px] items-end gap-2.5 px-2 pt-6">{values.map((v, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-sm bg-primary/80" style={{ height: `${v * 112}px` }} /><span className="font-mono-science text-[9px] text-muted-foreground">D{i * 50}</span></div>)}</div>;
}

export function TrendLine() {
  return <svg className="h-[172px] w-full overflow-visible" viewBox="0 0 620 172" preserveAspectRatio="none"><path d="M 0 129 C 42 111, 54 116, 93 99 S 147 107, 181 81 S 236 94, 270 70 S 334 84, 365 57 S 421 72, 457 45 S 518 62, 555 26 S 588 41, 620 18" fill="none" stroke="hsl(173 70% 48%)" strokeWidth="3" /><path d="M 0 129 C 42 111, 54 116, 93 99 S 147 107, 181 81 S 236 94, 270 70 S 334 84, 365 57 S 421 72, 457 45 S 518 62, 555 26 S 588 41, 620 18 L 620 172 L 0 172 Z" fill="url(#fillTeal)" opacity=".15" /><defs><linearGradient id="fillTeal" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="hsl(173 70% 48%)" /><stop offset="1" stopColor="hsl(173 70% 48% / 0)" /></linearGradient></defs><line x1="0" y1="153" x2="620" y2="153" stroke="hsl(191 29% 83% / .5)" /><line x1="0" y1="91" x2="620" y2="91" stroke="hsl(191 29% 83% / .35)" strokeDasharray="3 5" /><line x1="0" y1="30" x2="620" y2="30" stroke="hsl(191 29% 83% / .35)" strokeDasharray="3 5" /></svg>;
}

export function DirectionGlyph({ positive = true }: { positive?: boolean }) { return positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />; }
export function LegendDot({ color = "teal" }: { color?: "teal" | "amber" | "blue" }) { return <Circle size={8} fill={`hsl(var(--${color === "teal" ? "accent" : color === "amber" ? "chart-4" : "chart-3"}))`} stroke="none" />; }