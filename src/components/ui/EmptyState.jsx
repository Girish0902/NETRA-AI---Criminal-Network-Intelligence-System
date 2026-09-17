import clsx from "clsx";

export default function EmptyState({
  icon: Icon,
  title = "No records available",
  message,
  action,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex min-h-64 items-center justify-center rounded-xl border border-edge bg-canvas p-8",
        className,
      )}
    >
      <div className="max-w-sm text-center">
        {Icon && (
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-edge bg-surface">
            <Icon
              size={26}
              className="text-ink-muted"
            />
          </div>
        )}

        <h3 className="mt-4 text-base font-semibold text-ink">
          {title}
        </h3>

        {message && (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {message}
          </p>
        )}

        {action && (
          <div className="mt-5">{action}</div>
        )}
      </div>
    </div>
  );
}
