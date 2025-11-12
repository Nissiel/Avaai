import { cn } from "@/lib/utils";

interface AvaLogoIconProps {
  className?: string;
  size?: number;
  alt?: string;
}

export function AvaLogoIcon({ className, size = 48, alt = "AvaFirst logo" }: AvaLogoIconProps) {
  return (
    <img
      src="/brand/avafirst-logo.svg"
      alt={alt}
      width={size}
      height={size}
      className={cn("inline-block select-none", className)}
      draggable={false}
      loading="lazy"
    />
  );
}

interface AvaLogoWordmarkProps {
  className?: string;
  label?: string;
  subtitle?: string;
  iconSize?: number;
  stacked?: boolean;
}

export function AvaLogoWordmark({
  className,
  label = "AvaFirst",
  subtitle = "Studio",
  iconSize = 36,
  stacked = false,
}: AvaLogoWordmarkProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-left",
        stacked && "flex-col items-start gap-2",
        className,
      )}
    >
      <AvaLogoIcon size={iconSize} alt={`${label} logo`} />
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-foreground">{label}</p>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
