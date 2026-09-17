import { Search, UserRoundSearch } from "lucide-react";
import { useMemo, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

function RepeatOffenders() {
  const [search, setSearch] = useState("");

  const {
    data,
    loading,
    error,
  } = useApi(
    () => api.repeatOffenders("?minCases=2"),
    [],
  );

  const offenders = useMemo(() => {
    const source =
      data?.offenders ??
      data?.data?.offenders ??
      data?.data ??
      data ??
      [];

    if (!Array.isArray(source)) {
      return [];
    }

    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return source
      .map((offender, index) => {
        const caseCount = toNumber(
          offender.caseCount ??
            offender.totalCases ??
            offender.linkedCases,
        );

        const districts = normalizeStringArray(
          offender.districts,
        );

        const crimeTypes = normalizeStringArray(
          offender.crimeTypes ??
            offender.categories,
        );

        return {
          id:
            offender.personId ??
            offender.PersonMasterID ??
            offender.id ??
            `offender-${index}`,

          name:
            offender.name ??
            offender.personName ??
            offender.AccusedName ??
            "Unknown person",

          age:
            offender.age ??
            offender.AgeYear ??
            "Not available",

          caseCount,

          districts,

          crimeTypes,

          preferredMO:
            offender.preferredMO ??
            offender.modusOperandi ??
            "Not available",

          lastKnownCaseDate:
            offender.lastKnownCaseDate ??
            offender.latestCaseDate ??
            null,
        };
      })
      .filter((offender) => offender.caseCount >= 2)
      .filter((offender) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          offender.name,
          offender.age,
          offender.preferredMO,
          ...offender.districts,
          ...offender.crimeTypes,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch,
        );
      })
      .sort(
        (first, second) =>
          second.caseCount - first.caseCount,
      );
  }, [data, search]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={UserRoundSearch}
        title="Repeat Offenders"
        description="Identify accused persons appearing across multiple FIR records"
        action={
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-3 text-ink-muted"
            />

            <input
              value={search}
              disabled={loading}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search offender..."
              className="rounded-xl border border-edge bg-canvas/70 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-critical-soft">
            {String(error)}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-edge bg-surface shadow-card">
            <p className="text-sm text-ink-secondary">
              Analysing accused records for repeat-offender patterns...
            </p>
          </div>
        ) : offenders.length === 0 ? (
          <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-edge bg-surface shadow-card">
            <div className="text-center">
              <UserRoundSearch
                size={32}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm text-ink-secondary">
                No matching repeat offenders were found.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {offenders.map((offender) => (
              <article
                key={offender.id}
                className="rounded-2xl border border-edge bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-ink">
                      {offender.name}
                    </h2>

                    <p className="mt-1 text-sm text-ink-secondary">
                      Accused in{" "}
                      <span className="font-mono text-ink">
                        {formatNumber(
                          offender.caseCount,
                        )}
                      </span>{" "}
                      FIR records
                    </p>
                  </div>

                  <span
                    className={`h-fit rounded-full border px-3 py-1 text-xs font-semibold ${getAttentionClass(
                      offender.caseCount,
                    )}`}
                  >
                    {getAttentionLabel(
                      offender.caseCount,
                    )}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Info
                    label="Districts"
                    value={
                      offender.districts.length
                        ? offender.districts.join(
                            ", ",
                          )
                        : "Not available"
                    }
                  />

                  <Info
                    label="Crime categories"
                    value={
                      offender.crimeTypes.length
                        ? offender.crimeTypes.join(
                            ", ",
                          )
                        : "Not available"
                    }
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <div className="rounded-xl border border-edge bg-surface-raised p-3">
                    <p className="text-xs text-ink-muted">
                      Preferred modus operandi
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
                      {offender.preferredMO}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-edge bg-surface-raised p-3">
                      <p className="text-xs text-ink-muted">
                        Age
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {formatAge(offender.age)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-edge bg-surface-raised p-3">
                      <p className="text-xs text-ink-muted">
                        Latest linked case
                      </p>

                      <p className="mt-1 font-mono text-sm font-medium text-ink">
                        {formatDate(
                          offender.lastKnownCaseDate,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && offenders.length > 0 && (
          <div className="mt-5 rounded-xl border border-edge bg-surface px-4 py-3 shadow-card">
            <p className="text-xs leading-5 text-ink-muted">
              Repeat offenders are identified by grouping
              accused records using PersonMasterID and
              counting the number of distinct linked FIR
              records. The attention level is an analytical
              indicator based on linked-case count, not a
              legal classification.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          }

          return String(
            item?.districtName ??
              item?.crimeHeadName ??
              item?.name ??
              "",
          ).trim();
        })
        .filter(Boolean),
    ),
  ];
}

function getAttentionLabel(caseCount) {
  if (caseCount >= 8) {
    return "High attention";
  }

  if (caseCount >= 5) {
    return "Medium attention";
  }

  return "Monitor";
}

function getAttentionClass(caseCount) {
  if (caseCount >= 8) {
    return "border-critical/30 bg-critical/10 text-critical-soft";
  }

  if (caseCount >= 5) {
    return "border-watch/30 bg-watch/10 text-watch-soft";
  }

  return "border-primary/30 bg-primary/10 text-primary-hover";
}

function formatAge(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const age = Number(value);

  if (!Number.isFinite(age)) {
    return String(value);
  }

  return `${age} years`;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("en-IN");
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-edge bg-surface-raised p-3">
      <p className="text-xs text-ink-muted">
        {label}
      </p>

      <p className="mt-1 break-words text-sm leading-5 text-ink-secondary">
        {value}
      </p>
    </div>
  );
}

export default RepeatOffenders;