import {
  ArrowRight,
  BookMarked,
  Layers,
  Repeat,
  ScanSearch,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import StatCard from "../components/ui/StatCard";
import MonoLabel from "../components/ui/MonoLabel";
import { patternLibraryData } from "../data/patternLibrary";

const FILTERS = [
  { key: "All", label: "All patterns" },
  { key: "Recurring", label: "Recurring" },
  { key: "Suspicious", label: "Suspicious" },
  { key: "Trend", label: "Trends" },
];

const TYPE_TONES = {
  Recurring: "success",
  Suspicious: "warning",
  Trend: "primary",
};

const TREND_CLASS = {
  Increasing: "text-critical-soft",
  Expanding: "text-watch-soft",
  Stable: "text-resolved-soft",
  Elevated: "text-watch-soft",
  Emerging: "text-primary-hover",
};

function PatternLibrary() {
  const [filter, setFilter] = useState("All");

  const patterns = useMemo(() => {
    if (filter === "All") {
      return patternLibraryData;
    }

    return patternLibraryData.filter(
      (pattern) => pattern.type === filter,
    );
  }, [filter]);

  const totals = useMemo(() => {
    const recurring = patternLibraryData.filter(
      (pattern) => pattern.type === "Recurring",
    ).length;

    const suspicious = patternLibraryData.filter(
      (pattern) => pattern.type === "Suspicious",
    ).length;

    const totalCases = new Set(
      patternLibraryData.flatMap(
        (pattern) => pattern.linkedCases ?? [],
      ),
    ).size;

    return {
      patterns: patternLibraryData.length,
      recurring,
      suspicious,
      totalCases,
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={BookMarked}
        title="Pattern Intelligence Library"
        description="Recurring modus operandi, suspicious clusters and case-instance patterns that feed similar-case suggestions"
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Detected patterns"
            value={totals.patterns}
            description="Active intelligence library"
            icon={Layers}
          />

          <StatCard
            title="Recurring patterns"
            value={totals.recurring}
            description="May indicate organised groups"
            icon={Repeat}
            iconTone="success"
          />

          <StatCard
            title="Suspicious patterns"
            value={totals.suspicious}
            description="Require case review"
            icon={ScanSearch}
            iconTone="warning"
          />

          <StatCard
            title="Cases referenced"
            value={totals.totalCases}
            description="Across all linked FIR records"
            icon={TrendingUp}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setFilter(option.key)
              }
              className={
                filter === option.key
                  ? "rounded-xl border border-primary/50 bg-gradient-to-r from-primary/25 to-accent/10 px-4 py-2 text-sm font-semibold text-primary-hover shadow-glow-primary transition"
                  : "rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-ink"
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {patterns.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Layers}
                title="No patterns in this category"
                message="Patterns are generated from case instances as recurring behaviour is detected across FIR records."
              />
            </div>
          ) : (
            patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
              />
            ))
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-edge bg-surface px-4 py-3 shadow-card">
          <Layers
            size={15}
            className="mt-0.5 shrink-0 text-ink-muted"
          />

          <p className="text-xs leading-5 text-ink-muted">
            Unlike the aggregate Crime Trends view, the
            Pattern Library is case-instance-level: each
            entry is tied to specific FIR records and
            entities, and is proposed as a source for
            "Suggest similar cases" inside an active
            investigation workspace.
          </p>
        </div>
      </main>
    </div>
  );
}

function PatternCard({ pattern }) {
  return (
    <Panel
      className="flex flex-col"
      bodyClassName="flex flex-1 flex-col gap-4"
      hover
      action={
        <Badge
          severity={pattern.type}
          tone={TYPE_TONES[pattern.type]}
        >
          {pattern.type}
        </Badge>
      }
    >
      <div>
        <h3 className="font-semibold text-ink">
          {pattern.name}
        </h3>

        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          {pattern.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-muted">
            Confidence
          </span>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              pattern.confidence >= 85
                ? "border-resolved/30 bg-resolved/10 text-resolved-soft"
                : pattern.confidence >= 70
                  ? "border-watch/30 bg-watch/10 text-watch-soft"
                  : "border-primary/30 bg-primary/10 text-primary-hover"
            }`}
          >
            {pattern.confidence}%
          </span>
        </div>

        <span
          className={`text-xs font-medium ${TREND_CLASS[pattern.trend] ?? "text-ink-secondary"}`}
        >
          Trend: {pattern.trend}
        </span>

        <span className="text-xs text-ink-muted">
          {pattern.caseCount} case
          {pattern.caseCount === 1 ? "" : "s"}
        </span>
      </div>

      {pattern.entities.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Key entities
          </p>

          <div className="flex flex-wrap gap-2">
            {pattern.entities.map((entity) => (
              <span
                key={entity}
                className="rounded-full border border-edge bg-surface-raised px-3 py-1 text-xs text-ink-secondary"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Linked FIR records
        </p>

        <div className="flex flex-wrap gap-2">
          {pattern.linkedCases.map((caseNumber) => (
              <Link
                key={caseNumber}
                to={`/investigation/${encodeURIComponent(
                  caseNumber,
                )}`}
                className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 transition hover:border-primary/50"
              >
                <MonoLabel className="text-primary-hover">
                  {caseNumber}
                </MonoLabel>
              </Link>
            ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-edge pt-4">
        <span className="font-mono text-[0.75rem] text-ink-muted">
          {pattern.id} Ã‚Â· observed{" "}
          {pattern.lastObserved}
        </span>

        {pattern.linkedCases.length > 0 && (
          <Link
            to={`/investigation/${encodeURIComponent(
              pattern.linkedCases[0],
            )}?suggest=1`}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Open investigation
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </Panel>
  );
}

export default PatternLibrary;