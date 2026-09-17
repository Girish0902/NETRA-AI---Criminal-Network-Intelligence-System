import clsx from "clsx";

const ICON_TONES = {
  primary:
    "border-primary/30 bg-primary/10 text-primary-hover",
  accent:
    "border-accent/30 bg-accent/10 text-accent",
  secondary:
    "border-secondary/30 bg-secondary/10 text-secondary",
  success:
    "border-success/30 bg-success/10 text-success",
  warning:
    "border-warning/30 bg-warning/10 text-warning",
  danger:
    "border-danger/30 bg-danger/10 text-danger",
  neutral:
    "border-edge bg-surface-hover text-ink-secondary",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconTone = "primary",
  footer,
  className,
}) {
  return (
    <article
      className={clsx(
        "group flex flex-col rounded-2xl border border-edge bg-surface p-5 shadow-card transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-secondary">
            {title}
          </p>

          <p className="mt-2 truncate font-mono text-3xl font-bold tracking-tight text-ink lg:text-4xl">
            {value}
          </p>
        </div>

        {Icon && (
          <div
            className={clsx(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border",
              ICON_TONES[iconTone] ?? ICON_TONES.primary,
            )}
          >
            <Icon size={23} />
          </div>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-ink-muted">
          {description}
        </p>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </article>
  );
}