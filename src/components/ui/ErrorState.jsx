import { AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function ErrorState({
  title = "Unable to load data",
  message = "The requested information could not be retrieved. Please try again.",
  onRetry,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex min-h-64 items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 p-8",
        className,
      )}
    >
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
          <AlertTriangle
            size={26}
            className="text-red-300"
          />
        </div>

        <h3 className="mt-4 text-base font-semibold text-ink">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
