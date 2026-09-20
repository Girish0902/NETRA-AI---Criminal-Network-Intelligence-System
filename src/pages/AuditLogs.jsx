import {
  CheckCircle2,
  Download,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";

import {
  getAuditLogs,
  subscribeToAuditLogs,
} from "../utils/auditLogger";
import { useI18n } from "../i18n";

function AuditLogs() {
  const { t } = useI18n();

  const [logs, setLogs] = useState(
    () => getAuditLogs(),
  );

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  useEffect(() => {
    setLogs(getAuditLogs());

    return subscribeToAuditLogs(
      (updatedLogs) => {
        setLogs(updatedLogs);
      },
    );
  }, []);

  const filterOptions = useMemo(() => {
    const categories = [
      ...new Set(
        logs
          .map((log) => log.category)
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(second),
    );

    return [
      "All",
      ...categories,
      "Success",
      "Denied",
      "Failed",
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          log.user,
          log.role,
          log.action,
          log.resource,
          log.category,
          log.status,
          log.details,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter =
        filter === "All" ||
        log.category === filter ||
        log.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [logs, search, filter]);

  const exportCsv = () => {
    if (!filteredLogs.length) {
      return;
    }

    const rows = filteredLogs.map(
      (log) => ({
        User: log.user,
        Role: log.role,
        Action: log.action,
        Resource: log.resource,
        Category: log.category,
        Timestamp: log.timestamp,
        Status: log.status,
        Details: log.details || "",
      }),
    );

    downloadCsv(
      rows,
      `NETRA-audit-logs-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={ShieldCheck}
        title={t("pages.auditLogs.title")}
        description={t("pages.auditLogs.description")}
        action={
          <button
            type="button"
            onClick={exportCsv}
            disabled={
              filteredLogs.length === 0
            }
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={17} />
            Export CSV
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            title={t("pages.auditLogs.totalActivities")}
            value={formatNumber(
              logs.length,
            )}
          />

          <Summary
            title={t("pages.auditLogs.successful")}
            value={formatNumber(
              logs.filter(
                (log) =>
                  log.status ===
                  "Success",
              ).length,
            )}
          />

          <Summary
            title={t("pages.auditLogs.denied")}
            value={formatNumber(
              logs.filter(
                (log) =>
                  log.status ===
                  "Denied",
              ).length,
            )}
          />

          <Summary
            title={t("pages.auditLogs.aiQueries")}
            value={formatNumber(
              logs.filter(
                (log) =>
                  log.category ===
                  "AI Query",
              ).length,
            )}
          />
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-edge bg-surface p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search users, actions or resources..."
              className="w-full rounded-xl border border-edge bg-canvas/70 py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
            />
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value,
              )
            }
            className="rounded-xl border border-edge bg-canvas/70 px-4 py-3 text-sm text-ink outline-none focus:border-primary"
          >
            {filterOptions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option === "All"
                    ? "All activities"
                    : option}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-edge">
          <table className="min-w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {[
                  "User",
                  "Role",
                  "Action",
                  "Resource",
                  "Category",
                  "Timestamp",
                  "Status",
                ].map((title) => (
                  <th
                    key={title}
                    className="whitespace-nowrap px-4 py-4 text-left text-slate-300"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 bg-surface">
              {filteredLogs.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-48 px-4 py-8 text-center text-ink-secondary"
                  >
                    <ShieldCheck
                      size={30}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-3">
                      No audit activities
                      have been recorded
                      yet.
                    </p>

                    <p className="mt-1 text-xs text-ink-muted">
                      Searches, AI queries,
                      report downloads and
                      alert acknowledgements
                      will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(
                  (log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-surface"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-[0.8125rem] font-semibold text-ink">
                        {log.user}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-ink-secondary">
                        {log.role}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {log.action}
                      </td>

                      <td className="max-w-72 break-words px-4 py-4 font-mono text-[0.8125rem] text-ink-secondary">
                        {log.resource}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-hover">
                          {log.category}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-ink-secondary">
                        {formatDateTime(
                          log.timestamp,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge
                          status={
                            log.status
                          }
                        />
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs leading-5 text-ink-secondary">
            Audit entries represent actual
            actions performed inside this
            NETRA AI browser session. FIR
            dataset rows are not converted
            into fake audit events. Logs are
            stored locally for this
            demonstration and can be
            exported as CSV.
          </p>
        </div>
      </main>
    </div>
  );
}

function Summary({ title, value }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-secondary">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Denied") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
        <ShieldX size={14} />
        Denied
      </span>
    );
  }

  if (status === "Failed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
        <ShieldX size={14} />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
      <CheckCircle2 size={14} />
      Success
    </span>
  );
}

function downloadCsv(rows, fileName) {
  const columns = [
    ...new Set(
      rows.flatMap((row) =>
        Object.keys(row),
      ),
    ),
  ];

  const csvLines = [
    columns
      .map(escapeCsvValue)
      .join(","),

    ...rows.map((row) =>
      columns
        .map((column) =>
          escapeCsvValue(
            row[column] ?? "",
          ),
        )
        .join(","),
    ),
  ];

  const blob = new Blob(
    [
      "\uFEFF" +
        csvLines.join("\n"),
    ],
    {
      type:
        "text/csv;charset=utf-8;",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const text = String(
    value ?? "",
  );

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(
      /"/g,
      '""',
    )}"`;
  }

  return text;
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN")
    : "0";
}

export default AuditLogs;