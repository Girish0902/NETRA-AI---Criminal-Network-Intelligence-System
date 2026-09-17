import clsx from "clsx";

const ICON_TONES = {
  primary:
    "border-primary/30 bg-primary/10 text-primary-hover shadow-glow-primary",
  accent:
    "border-accent/30 bg-accent/10 text-primary-hover shadow-glow-accent",
  secondary:
    "border-secondary/30 bg-secondary/10 text-violet-300 shadow-glow-secondary",
};

export default function PageHeader({
  title,
  description,
  action,
  icon: Icon,
  iconTone = "primary",
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={clsx(
              "mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl border",
              ICON_TONES[iconTone] ?? ICON_TONES.primary,
            )}
          >
            <Icon size={22} />
          </div>
        )}

        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
            {title}
          </h2>

          <p className="mt-1.5 text-sm text-ink-secondary lg:text-base">
            {description}
          </p>
        </div>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
