import {
  BookOpen,
  Database,
  Download,
  FileJson,
  FileText,
  Network,
  Search,
  ShieldCheck,
  Table2,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useI18n } from "../i18n";

const resourceGroups = [
  {
    id: "cases",
    title: "Case and Investigation",
    description:
      "Primary FIR, status, court, chargesheet and modus-operandi records.",
    icon: FileText,
    match:
      /case|status|chargesheet|court|modus|crimehead|crimesubhead|gravity/i,
  },
  {
    id: "accused",
    title: "Accused and Arrest",
    description:
      "Accused-person, arrest, surrender and person-master records.",
    icon: ShieldCheck,
    match: /accused|arrest|surrender|personmaster/i,
  },
  {
    id: "victims",
    title: "Victim and Complainant",
    description:
      "Case-linked victim and complainant records.",
    icon: BookOpen,
    match: /victim|complainant/i,
  },
  {
    id: "legal",
    title: "Acts and Sections",
    description:
      "Legal acts, sections and case-level legal associations.",
    icon: FileJson,
    match: /act|section/i,
  },
  {
    id: "location",
    title: "Location and Organisation",
    description:
      "District, state, unit, employee and organisational records.",
    icon: Database,
    match:
      /district|state|unit|employee|rank|designation/i,
  },
  {
    id: "supporting",
    title: "Supporting Masters",
    description:
      "Lookup and supporting reference tables used throughout the dataset.",
    icon: Network,
    match: /.*/,
  },
];

function Resources() {
  const { t } = useI18n();

  const {
    data: response,
    loading,
    error,
  } = useApi(() => api.resources(), []);

  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] =
    useState(null);
  const [showSummary, setShowSummary] =
    useState(false);

  const data = response?.data ?? response ?? {};
  const dataset = data.dataset ?? {};

  const tables = useMemo(
    () =>
      Array.isArray(data.tables)
        ? data.tables
        : [],
    [data.tables],
  );

  const filteredTables = useMemo(() => {
    const normalized = search
      .trim()
      .toLowerCase();

    if (!normalized) {
      return tables;
    }

    return tables.filter((table) =>
      [
        table.tableName,
        table.fileName,
        ...(table.columns ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [tables, search]);

  const groupedResources = useMemo(() => {
    const assigned = new Set();

    return resourceGroups
      .map((group) => {
        const groupTables =
          filteredTables.filter((table) => {
            if (assigned.has(table.id)) {
              return false;
            }

            if (
              group.id === "supporting" ||
              group.match.test(table.tableName)
            ) {
              assigned.add(table.id);
              return true;
            }

            return false;
          });

        return {
          ...group,
          tables: groupTables,
          recordCount: groupTables.reduce(
            (sum, table) =>
              sum +
              toNumber(table.recordCount),
            0,
          ),
        };
      })
      .filter(
        (group) =>
          group.tables.length > 0,
      );
  }, [filteredTables]);

  const downloadSchemaJson = () => {
    downloadTextFile(
      JSON.stringify(data, null, 2),
      `NETRA-dataset-schema-${currentDate()}.json`,
      "application/json;charset=utf-8",
    );
  };

  const downloadSchemaCsv = () => {
    const rows = tables.flatMap((table) =>
      (table.columns ?? []).map(
        (column, index) => ({
          table_name: table.tableName,
          file_name: table.fileName,
          record_count: table.recordCount,
          column_order: index + 1,
          column_name: column,
          non_empty_values:
            table.nonEmptyCounts?.[
              column
            ] ?? 0,
        }),
      ),
    );

    downloadCsv(
      rows,
      `NETRA-dataset-schema-${currentDate()}.csv`,
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Database}
        title={t("pages.resources.title")}
        description={t("pages.resources.description")}
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {String(error)}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-primary/30 bg-surface">
          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-hover">
                  <Database size={23} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
                    Live dataset resource
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white">
                    {loading
                      ? "Loading dataset..."
                      : dataset.name ??
                        "FIR Dataset"}
                  </h2>
                </div>
              </div>

              <p className="mt-4 max-w-4xl text-sm leading-6 text-ink-secondary">
                {loading
                  ? "Inspecting CSV files and schema information..."
                  : `The backend currently contains ${formatNumber(
                      dataset.tableCount,
                    )} CSV tables with ${formatNumber(
                      dataset.totalRecords,
                    )} records and ${formatNumber(
                      dataset.totalColumns,
                    )} schema columns.`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowSummary(true)
                }
                className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
              >
                Open summary
              </button>

              <button
                type="button"
                disabled={
                  loading ||
                  tables.length === 0
                }
                onClick={downloadSchemaJson}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-secondary/30 bg-surface px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-secondary hover:text-violet-200 disabled:opacity-50"
              >
                <Download size={16} />
                JSON
              </button>

              <button
                type="button"
                disabled={
                  loading ||
                  tables.length === 0
                }
                onClick={downloadSchemaCsv}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-secondary/30 bg-surface px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-secondary hover:text-violet-200 disabled:opacity-50"
              >
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>

          <div className="grid border-t border-edge sm:grid-cols-3">
            <DatasetMetric
              label="CSV tables"
              value={
                loading
                  ? "..."
                  : formatNumber(
                      dataset.tableCount,
                    )
              }
            />

            <DatasetMetric
              label="Total records"
              value={
                loading
                  ? "..."
                  : formatNumber(
                      dataset.totalRecords,
                    )
              }
            />

            <DatasetMetric
              label="Schema columns"
              value={
                loading
                  ? "..."
                  : formatNumber(
                      dataset.totalColumns,
                    )
              }
            />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-edge bg-surface p-4">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search tables, files or column names..."
              className="w-full rounded-xl border border-edge bg-surface py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-ink-muted focus:border-primary"
            />
          </div>

          {!loading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
              <span>
                Showing{" "}
                {formatNumber(
                  filteredTables.length,
                )}{" "}
                of{" "}
                {formatNumber(tables.length)}{" "}
                tables
              </span>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="font-medium text-primary-hover hover:text-primary"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>

        {loading ? (
          <div className="mt-5 flex min-h-96 items-center justify-center rounded-2xl border border-edge bg-surface">
            <p className="text-sm text-ink-secondary">
              Reading dataset structure...
            </p>
          </div>
        ) : groupedResources.length === 0 ? (
          <div className="mt-5 flex min-h-96 items-center justify-center rounded-2xl border border-edge bg-surface">
            <div className="text-center">
              <Search
                size={30}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm text-ink-secondary">
                No matching dataset resources
                were found.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {groupedResources.map(
              (group) => (
                <ResourceCard
                  key={group.id}
                  group={group}
                  onSelectTable={
                    setSelectedTable
                  }
                />
              ),
            )}
          </div>
        )}

        <section className="mt-5 rounded-2xl border border-edge bg-surface p-5">
          <div>
            <h2 className="font-semibold text-white">
              Development guidelines
            </h2>

            <p className="mt-1 text-sm text-ink-secondary">
              Recommended practices for using
              FIR intelligence data safely.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Guideline
              number="01"
              title="Use safe queries"
              description="Allow read-only analytics queries and reject destructive database operations."
            />

            <Guideline
              number="02"
              title="Protect personal information"
              description="Restrict sensitive victim, complainant and accused information using role-based access controls."
            />

            <Guideline
              number="03"
              title="Verify AI output"
              description="Treat generated intelligence as investigative support rather than a final legal conclusion."
            />

            <Guideline
              number="04"
              title="Maintain audit trails"
              description="Record users, queries, report exports, timestamps and access outcomes for important activity."
            />
          </div>
        </section>

        {!loading && tables.length > 0 && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs leading-5 text-ink-secondary">
              Table names, record totals and
              columns are inspected directly
              from CSV files in the backend data
              directory. No schema totals are
              stored in this React component.
            </p>
          </div>
        )}
      </main>

      {selectedTable && (
        <TableDetailsModal
          table={selectedTable}
          onClose={() =>
            setSelectedTable(null)
          }
        />
      )}

      {showSummary && (
        <SchemaSummaryModal
          dataset={dataset}
          tables={tables}
          generatedAt={data.generatedAt}
          onClose={() =>
            setShowSummary(false)
          }
        />
      )}
    </div>
  );
}

function DatasetMetric({ label, value }) {
  return (
    <div className="border-edge px-6 py-4 sm:border-r sm:last:border-r-0">
      <p className="text-xs uppercase tracking-wider text-ink-muted">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function ResourceCard({
  group,
  onSelectTable,
}) {
  const Icon = group.icon;

  return (
    <article className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-edge bg-surface">
      <div className="border-b border-edge p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-hover">
            <Icon size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-white">
              {group.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              {group.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-hover">
            {formatNumber(
              group.tables.length,
            )}{" "}
            tables
          </span>

          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {formatNumber(
              group.recordCount,
            )}{" "}
            records
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {group.tables.map((table) => (
          <button
            key={table.id}
            type="button"
            onClick={() =>
              onSelectTable(table)
            }
            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-edge bg-surface px-4 py-3 text-left transition hover:border-primary/60 hover:bg-surface-raised"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-white">
                {table.tableName}
              </p>

              <p className="mt-1 text-xs text-ink-muted">
                {formatNumber(
                  table.columnCount,
                )}{" "}
                columns
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-primary-hover">
                {formatNumber(
                  table.recordCount,
                )}
              </p>

              <p className="mt-1 text-[11px] text-ink-muted">
                rows
              </p>
            </div>
          </button>
        ))}
      </div>
    </article>
  );
}

function TableDetailsModal({
  table,
  onClose,
}) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Table2 className="text-primary-hover" />

            <h2 className="text-xl font-bold text-white">
              {table.tableName}
            </h2>
          </div>

          <p className="mt-2 text-sm text-ink-secondary">
            {table.fileName}
          </p>
        </div>

        <CloseButton onClick={onClose} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricBox
          label="Records"
          value={formatNumber(
            table.recordCount,
          )}
        />

        <MetricBox
          label="Columns"
          value={formatNumber(
            table.columnCount,
          )}
        />
      </div>

      <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-xl border border-edge">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-slate-300">
                Column
              </th>

              <th className="px-4 py-3 text-right text-slate-300">
                Non-empty
              </th>

              <th className="px-4 py-3 text-right text-slate-300">
                Completion
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-surface">
            {(table.columns ?? []).map(
              (column) => {
                const nonEmpty = toNumber(
                  table.nonEmptyCounts?.[
                    column
                  ],
                );

                return (
                  <tr key={column}>
                    <td className="px-4 py-3 font-medium text-white">
                      {column}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      {formatNumber(nonEmpty)}
                    </td>

                    <td className="px-4 py-3 text-right text-ink-secondary">
                      {percentage(
                        nonEmpty,
                        table.recordCount,
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function SchemaSummaryModal({
  dataset,
  tables,
  generatedAt,
  onClose,
}) {
  const largestTables = [...tables]
    .sort(
      (first, second) =>
        toNumber(second.recordCount) -
        toNumber(first.recordCount),
    )
    .slice(0, 10);

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Dataset schema summary
          </h2>

          <p className="mt-2 text-sm text-ink-secondary">
            Generated{" "}
            {formatDateTime(generatedAt)}
          </p>
        </div>

        <CloseButton onClick={onClose} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricBox
          label="CSV tables"
          value={formatNumber(
            dataset.tableCount,
          )}
        />

        <MetricBox
          label="Total records"
          value={formatNumber(
            dataset.totalRecords,
          )}
        />

        <MetricBox
          label="Schema columns"
          value={formatNumber(
            dataset.totalColumns,
          )}
        />
      </div>

      <div className="mt-5">
        <h3 className="font-semibold text-white">
          Largest dataset tables
        </h3>

        <div className="mt-3 space-y-2">
          {largestTables.map((table) => (
            <div
              key={table.id}
              className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
            >
              <span className="text-sm text-slate-300">
                {table.tableName}
              </span>

              <span className="text-sm font-semibold text-white">
                {formatNumber(
                  table.recordCount,
                )}{" "}
                rows
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-edge bg-surface p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-ink-secondary transition hover:bg-white/5 hover:text-white"
    >
      <X size={20} />
    </button>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-ink-muted">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function Guideline({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4 rounded-xl bg-surface p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary-hover">
        {number}
      </span>

      <div>
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}

function downloadCsv(rows, fileName) {
  if (!rows.length) {
    return;
  }

  const columns = [
    ...new Set(
      rows.flatMap((row) =>
        Object.keys(row),
      ),
    ),
  ];

  const lines = [
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

  downloadTextFile(
    `\uFEFF${lines.join("\n")}`,
    fileName,
    "text/csv;charset=utf-8",
  );
}

function downloadTextFile(
  content,
  fileName,
  mimeType,
) {
  const blob = new Blob([content], {
    type: mimeType,
  });

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
  const text = String(value ?? "");

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

function percentage(value, total) {
  const numericTotal = toNumber(total);

  if (!numericTotal) {
    return "0.0%";
  }

  return `${(
    (toNumber(value) /
      numericTotal) *
    100
  ).toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function currentDate() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString(
    "en-IN",
  );
}

export default Resources;