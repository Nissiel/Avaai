import { cn } from "@/lib/utils";

type LogoLayout = "horizontal" | "stacked";

interface AvaLogoMarkProps {
  className?: string;
  glow?: boolean;
}

export function AvaLogoMark({ className, glow = true }: AvaLogoMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-950/90 p-2 ring-1 ring-white/10 shadow-[0_18px_40px_-22px_rgba(79,70,229,0.7)]",
        className,
      )}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[26px] bg-gradient-to-br from-primary/40 via-secondary/40 to-secondary/70 opacity-90 blur-2xl"
        />
      )}
      <img
        src="/brand/avafirst-logo.svg"
        alt="AvaFirst logo"
        className="relative h-full w-full select-none"
        draggable={false}
      />
    </span>
  );
}

interface AvaLogoWordmarkProps {
  className?: string;
  layout?: LogoLayout;
  subtitle?: string;
  glow?: boolean;
}

export function AvaLogoWordmark({
  className,
  layout = "horizontal",
  subtitle = "Studio",
  glow = true,
}: AvaLogoWordmarkProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-left",
        layout === "stacked" && "flex-col text-center",
        className,
      )}
    >
      <AvaLogoMark
        glow={glow}
        className={cn(
          layout === "stacked" ? "h-16 w-16" : "h-11 w-11",
          "p-1.5 shadow-[0_20px_45px_-25px_rgba(15,23,42,1)] ring-white/15",
        )}
      />
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-foreground">AvaFirst</p>
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
