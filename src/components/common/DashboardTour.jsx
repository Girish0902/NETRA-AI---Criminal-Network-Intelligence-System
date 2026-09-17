import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const TOUR_STORAGE_KEY =
  "NETRA-dashboard-tour-completed";

const tourSteps = [
  {
    selector: '[data-tour="dashboard-header"]',
    title: "Crime Intelligence Dashboard",
    description:
      "This dashboard provides operational insights calculated from the loaded FIR dataset.",
  },
  {
    selector: '[data-tour="dashboard-kpis"]',
    title: "Key intelligence metrics",
    description:
      "Review registered cases, active investigations, heinous offences and the district with the highest case volume.",
  },
  {
    selector: '[data-tour="category-chart"]',
    title: "Case category distribution",
    description:
      "This chart compares registered cases across crime categories from the dataset.",
  },
  {
    selector: '[data-tour="severity-chart"]',
    title: "Offence severity distribution",
    description:
      "This chart displays case totals grouped by investigation and case-resolution status.",
  },
  {
    selector: '[data-tour="time-chart"]',
    title: "Cases over time",
    description:
      "Use this chart to inspect changes in registered FIR volume across the selected date range.",
  },
  {
    selector: '[data-tour="topbar-date"]',
    title: "Date-range control",
    description:
      "Change the date range to update dataset-based information across supported dashboard pages.",
  },
  {
    selector: '[data-tour="sidebar"]',
    title: "Intelligence modules",
    description:
      "Use the navigation sidebar to open hotspots, trends, networks, repeat offenders, predictions and other intelligence tools.",
  },
];

export default function DashboardTour({
  open,
  onClose,
}) {
  const [stepIndex, setStepIndex] =
    useState(0);

  const [targetRect, setTargetRect] =
    useState(null);

  const step = tourSteps[stepIndex];

  const totalSteps = tourSteps.length;

  const isFirstStep = stepIndex === 0;
  const isLastStep =
    stepIndex === totalSteps - 1;

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setTargetRect(null);
      return undefined;
    }

    const updateTarget = () => {
      const target =
        document.querySelector(
          step.selector,
        );

      if (!target) {
        setTargetRect(null);
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      window.setTimeout(() => {
        const rect =
          target.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
      }, 350);
    };

    updateTarget();

    window.addEventListener(
      "resize",
      updateTarget,
    );

    window.addEventListener(
      "scroll",
      updateTarget,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateTarget,
      );

      window.removeEventListener(
        "scroll",
        updateTarget,
        true,
      );
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        localStorage.setItem(
          TOUR_STORAGE_KEY,
          "true",
        );
        setStepIndex(0);
        onClose();
      }

      if (
        event.key === "ArrowRight" &&
        !isLastStep
      ) {
        setStepIndex(
          (current) => current + 1,
        );
      }

      if (
        event.key === "ArrowLeft" &&
        !isFirstStep
      ) {
        setStepIndex(
          (current) => current - 1,
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    isFirstStep,
    isLastStep,
    onClose,
  ]);

  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform:
          "translate(-50%, -50%)",
      };
    }

    const tooltipWidth = 360;
    const screenPadding = 16;

    let top =
      targetRect.bottom + 18;

    let left =
      targetRect.left +
      targetRect.width / 2 -
      tooltipWidth / 2;

    if (
      top + 260 >
      window.innerHeight
    ) {
      top =
        targetRect.top - 250;
    }

    left = Math.max(
      screenPadding,
      Math.min(
        left,
        window.innerWidth -
          tooltipWidth -
          screenPadding,
      ),
    );

    top = Math.max(
      screenPadding,
      top,
    );

    return {
      top,
      left,
      width: tooltipWidth,
    };
  }, [targetRect]);

  function closeTour() {
    localStorage.setItem(
      TOUR_STORAGE_KEY,
      "true",
    );

    setStepIndex(0);
    onClose();
  }

  function nextStep() {
    if (isLastStep) {
      closeTour();
      return;
    }

    setStepIndex(
      (current) => current + 1,
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/75" />

      {targetRect && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.12),0_0_35px_rgba(249,115,22,0.55)] transition-all duration-300"
          style={{
            top: Math.max(
              targetRect.top - 8,
              4,
            ),
            left: Math.max(
              targetRect.left - 8,
              4,
            ),
            width:
              targetRect.width + 16,
            height:
              targetRect.height + 16,
          }}
        />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard tour"
        className="absolute rounded-2xl border border-edge bg-surface p-5 shadow-2xl"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-hover">
              Step {stepIndex + 1} of{" "}
              {totalSteps}
            </p>

            <h2 className="mt-2 text-lg font-bold text-white">
              {step.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeTour}
            className="rounded-lg p-2 text-ink-secondary transition hover:bg-white/5 hover:text-white"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          {step.description}
        </p>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${
                ((stepIndex + 1) /
                  totalSteps) *
                100
              }%`,
            }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={isFirstStep}
            onClick={() =>
              setStepIndex(
                (current) =>
                  current - 1,
              )
            }
            className="flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} />
            Back
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            {isLastStep
              ? "Finish"
              : "Next"}

            {!isLastStep && (
              <ChevronRight size={17} />
            )}
          </button>
        </div>
      </section>
    </div>
  );
}