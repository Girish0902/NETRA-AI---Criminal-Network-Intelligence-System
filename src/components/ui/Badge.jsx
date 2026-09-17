import clsx from "clsx";

const TONE_STYLES = {
  neutral:
    "border-edge bg-surface text-ink-secondary",
  primary:
    "border-primary/30 bg-primary/10 text-primary-hover",
  accent:
    "border-accent/30 bg-accent/10 text-primary-hover",
  secondary:
    "border-secondary/30 bg-secondary/10 text-violet-300",
  success:
    "border-success/30 bg-success/10 text-emerald-300",
  warning:
    "border-warning/30 bg-warning/10 text-amber-300",
  danger:
    "border-danger/30 bg-danger/10 text-red-300",
};

const SEVERITY_MAP = {
  critical: "danger",
  high: "danger",
  urgent: "danger",
  watch: "warning",
  medium: "warning",
  pending: "warning",
  low: "success",
  resolved: "success",
  acknowledged: "success",
  active: "success",
  new: "primary",
  closed: "neutral",
};

export default function Badge({
  children,
  tone = "neutral",
  severity,
  dot,
  className,
}) {
  const resolvedTone = severity
    ? SEVERITY_MAP[String(severity).toLowerCase()] ??
      "neutral"
    : tone;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_STYLES[resolvedTone],
        className,
      )}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
