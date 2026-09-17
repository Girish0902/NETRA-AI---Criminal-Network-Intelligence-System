import clsx from "clsx";

export default function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  hover,
}) {
  return (
    <section
      className={clsx(
        "overflow-hidden rounded-2xl border border-edge bg-surface shadow-card transition-all duration-300",
        hover &&
          "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-semibold text-ink">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-0.5 text-sm text-ink-muted">
                {subtitle}
              </p>
            )}
          </div>

          {action && <div>{action}</div>}
        </div>
      )}

      <div className={clsx("p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
