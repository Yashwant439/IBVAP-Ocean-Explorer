import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart3, BookOpen, ChevronRight, Database, Droplets, Info, Layers3, Map, Menu, Radar, Satellite, ShipWheel, Upload, Waves, X } from "lucide-react";
import { useState } from "react";

export const navGroups = [
  { label: "MISSION", items: [{ href: "/", label: "Mission desk", icon: Radar }, { href: "/explorer", label: "Ocean explorer", icon: Waves }, { href: "/map", label: "Domain map", icon: Map }] },
  { label: "EVIDENCE", items: [{ href: "/observations", label: "Observations", icon: Satellite }, { href: "/comparison", label: "Compare fields", icon: Activity }, { href: "/analytics", label: "Analytics", icon: BarChart3 }] },
  { label: "CATALOGUE", items: [{ href: "/datasets", label: "Datasets", icon: Database }, { href: "/ingestion", label: "Ingest a file", icon: Upload }] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-5">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <div className="grid size-9 place-items-center rounded-[11px] bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-teal-950/20"><Droplets size={19} strokeWidth={2.5} /></div>
            <div><div className="font-display text-[17px] font-bold tracking-tight text-sidebar-accent-foreground">IBVAP</div><div className="font-mono-science text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/60">ocean explorer</div></div>
          </Link>
          <button className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-navigation"><X size={18} /></button>
        </div>
        <div className="px-4 py-5">
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-sidebar-primary/25 bg-sidebar-primary/10 px-3 py-2.5">
            <span className="size-2 rounded-full bg-sidebar-primary animate-pulse-line" />
            <div><div className="font-mono-science text-[10px] uppercase tracking-[.15em] text-sidebar-primary">Demo environment</div><div className="mt-0.5 text-[10px] text-sidebar-foreground/55">Decision-support preview</div></div>
          </div>
          <nav className="space-y-6">
            {navGroups.map((group) => <div key={group.label}><div className="mb-2 px-3 font-mono-science text-[9px] font-medium tracking-[.2em] text-sidebar-foreground/40">{group.label}</div><div className="space-y-1">{group.items.map(({ href, label, icon: Icon }) => { const active = href === "/" ? location === href : location.startsWith(href); return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}><Icon size={16} strokeWidth={active ? 2.2 : 1.7} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60"} /><span className="flex-1">{label}</span>{active && <ChevronRight size={14} className="text-sidebar-primary" />}</Link>; })}</div></div>)}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <Link href="/about" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" data-testid="link-nav-about"><Info size={16} /><span>About this MVP</span></Link>
          <div className="mt-4 flex items-center gap-2 px-3 text-[9px] font-mono-science uppercase tracking-[.15em] text-sidebar-foreground/35"><ShipWheel size={14} /> INCOIS / MoES context</div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-overlay-navigation" />}
      <main className="min-h-[100dvh] md:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/75 bg-background/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-border bg-card p-2 md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-navigation"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 text-[11px] font-mono-science uppercase tracking-[.18em] text-muted-foreground sm:flex"><span>INDIAN OCEAN</span><span className="text-border">/</span><span className="text-primary">LIVE WORKSPACE</span></div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-mono-science text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-accent" /> API CONNECTED</div>
            <div className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">IO</div>
          </div>
        </header>
        <div className="ocean-wash min-h-[calc(100dvh-76px)] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 font-mono-science text-[10px] font-medium uppercase tracking-[.2em] text-primary"><span className="h-px w-5 bg-accent" />{eyebrow}</div><h1 className="font-display text-3xl font-bold tracking-[-.03em] text-foreground sm:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function Panel({ children, className = "", title, meta, action }: { children: ReactNode; className?: string; title?: string; meta?: string; action?: ReactNode }) {
  return <section className={`rounded-xl border border-card-border bg-card shadow-[0_8px_28px_hsl(198_50%_18%_/_0.045)] ${className}`}><div className={title ? "flex items-center justify-between border-b border-border/80 px-5 py-4" : ""}>{title && <div><h2 className="text-[12px] font-bold uppercase tracking-[.11em] text-foreground">{title}</h2>{meta && <p className="mt-1 font-mono-science text-[10px] text-muted-foreground">{meta}</p>}</div>}{action}</div>{children}</section>;
}

export function StatCard({ label, value, suffix, note, tone = "teal" }: { label: string; value: string; suffix?: string; note: string; tone?: "teal" | "amber" | "blue" | "coral" }) {
  const tones = { teal: "text-primary border-l-primary", amber: "text-[hsl(38_82%_42%)] border-l-[hsl(38_82%_58%)]", blue: "text-[hsl(198_65%_43%)] border-l-[hsl(198_65%_56%)]", coral: "text-[hsl(3_62%_48%)] border-l-[hsl(3_62%_58%)]" };
  return <div className={`rounded-xl border border-card-border border-l-[3px] bg-card p-4 shadow-[0_8px_28px_hsl(198_50%_18%_/_0.04)] ${tones[tone]}`}><div className="font-mono-science text-[10px] uppercase tracking-[.13em] text-muted-foreground">{label}</div><div className="mt-2 flex items-baseline gap-1"><span className="font-display text-[28px] font-bold tracking-tight">{value}</span>{suffix && <span className="font-mono-science text-[11px] text-muted-foreground">{suffix}</span>}</div><div className="mt-1 text-[11px] text-muted-foreground">{note}</div></div>;
}

export function DataState({ loading, error, empty, children, onRetry }: { loading?: boolean; error?: boolean; empty?: boolean; children: ReactNode; onRetry?: () => void }) {
  if (loading) return <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>;
  if (error) return <div className="flex flex-col items-center justify-center gap-2 p-12 text-center"><div className="font-display text-lg font-bold">Signal interrupted</div><p className="max-w-sm text-xs text-muted-foreground">The API did not return this observation layer. Try the request again.</p>{onRetry && <button className="mt-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90" onClick={onRetry} data-testid="button-retry-request">Retry request</button>}</div>;
  if (empty) return <div className="flex flex-col items-center justify-center p-12 text-center"><div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Layers3 size={19} /></div><div className="mt-3 font-display font-bold">No records in this view</div><p className="mt-1 text-xs text-muted-foreground">Change the filters or add a dataset to continue.</p></div>;
  return <>{children}</>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teal" | "amber" | "blue" | "coral" }) {
  const styles = { neutral: "bg-muted text-muted-foreground", teal: "bg-accent/15 text-primary", amber: "bg-[hsl(38_82%_58%_/_0.15)] text-[hsl(38_82%_38%)]", blue: "bg-[hsl(198_65%_56%_/_0.15)] text-[hsl(198_65%_37%)]", coral: "bg-[hsl(3_62%_58%_/_0.14)] text-[hsl(3_62%_42%)]" };
  return <span className={`inline-flex rounded-full px-2 py-1 font-mono-science text-[9px] font-medium uppercase tracking-[.08em] ${styles[tone]}`}>{children}</span>;
}