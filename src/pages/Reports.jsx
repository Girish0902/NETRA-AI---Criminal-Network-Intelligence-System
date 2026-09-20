import {
  BarChart3,
  Building2,
  Download,
  FileText,
  MapPinned,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { addAuditLog } from "../utils/auditLogger";

import PageHeader from "../components/common/PageHeader";
import { api } from "../services/api";
import { useI18n } from "../i18n";

const ACTIVITY_STORAGE_KEY =
  "NETRA-report-activity";

function Reports() {
  const { t } = useI18n();

  const [generatingReport, setGeneratingReport] =
    useState(null);

  const [error, setError] = useState("");

  const [reportActivity, setReportActivity] =
    useState(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            ACTIVITY_STORAGE_KEY,
          ) || "[]",
        );

        return Array.isArray(saved)
          ? saved
          : [];
      } catch {
        return [];
      }
    });

  const reportDefinitions = useMemo(
    () => [
      {
        id: "state-overview",
        title: "State Crime Overview",
        description:
          "Summary of registered cases, crime categories and resolution rates.",
        tag: "Analytics",
        icon: BarChart3,
      },
      {
        id: "district-performance",
        title: "District Performance Report",
        description:
          "District-wise case volume, resolved cases and police station metrics.",
        tag: "District",
        icon: Building2,
      },
      {
        id: "repeat-offenders",
        title: "Repeat Offender Intelligence",
        description:
          "Accused persons linked to multiple FIR records and districts.",
        tag: "Offender",
        icon: UsersRound,
      },
      {
        id: "hotspot-assessment",
        title: "Crime Hotspot Assessment",
        description:
          "Geospatial analysis of incident locations and emerging clusters.",
        tag: "Geospatial",
        icon: MapPinned,
      },
    ],
    [],
  );

  useEffect(() => {
    localStorage.setItem(
      ACTIVITY_STORAGE_KEY,
      JSON.stringify(reportActivity),
    );
  }, [reportActivity]);

  async function generateReport(report) {
    if (generatingReport) {
      return;
    }

    setGeneratingReport(report.id);
    setError("");

    try {
      let rows = [];
      let fileName = "";
      let generatedTitle = report.title;

      if (report.id === "state-overview") {
        rows =
          await generateStateOverviewRows();

        fileName =
          createFileName(
            "NETRA-state-crime-overview",
          );
      }

      if (
        report.id === "district-performance"
      ) {
        rows =
          await generateDistrictPerformanceRows();

        fileName =
          createFileName(
            "NETRA-district-performance",
          );
      }

      if (report.id === "repeat-offenders") {
        rows =
          await generateRepeatOffenderRows();

        fileName =
          createFileName(
            "NETRA-repeat-offender-intelligence",
          );
      }

      if (
        report.id === "hotspot-assessment"
      ) {
        rows =
          await generateHotspotRows();

        fileName =
          createFileName(
            "NETRA-crime-hotspot-assessment",
          );
      }

      if (!rows.length) {
        throw new Error(
          "No dataset records are available for this report.",
        );
      }

      downloadCsv(rows, fileName);

      addAuditLog({
        action: "Generated report",
        resource: report.title,
        category: "Report",
        status: "Success",
        details: `${rows.length} dataset rows exported as CSV`,
      });

      const activity = {
        id: createId(),
        report: generatedTitle,
        generatedBy: getCurrentUserName(),
        generatedAt:
          new Date().toISOString(),
        format: "CSV",
        recordCount: rows.length,
      };

      setReportActivity((current) => [
        activity,
        ...current,
      ].slice(0, 20));
    } catch (generationError) {
      console.error(
        "Report generation failed:",
        generationError,
      );

      addAuditLog({
         action: "Generated report",
         resource: report.title,
        category: "Report",
        status: "Failed",
        details:
        generationError?.message ??
         "Report generation failed",
      });

      setError(
        generationError?.message ??
          "Unable to generate the report.",
      );
    } finally {
      setGeneratingReport(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={FileText}
        title={t("pages.reports.title")}
        description={t("pages.reports.description")}
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {reportDefinitions.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              loading={
                generatingReport === report.id
              }
              disabled={
                Boolean(generatingReport)
              }
              onGenerate={() =>
                generateReport(report)
              }
            />
          ))}
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-edge bg-surface">
          <div className="border-b border-edge px-5 py-5">
            <h2 className="font-semibold text-ink">
              Recent report activity
            </h2>

            <p className="mt-1 text-sm text-ink-secondary">
              Reports generated from the current
              synthetic FIR dataset
            </p>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-edge">
                  {[
                    "Report",
                    "Generated by",
                    "Date",
                    "Records",
                    "Format",
                  ].map((title) => (
                    <th
                      key={title}
                      className="whitespace-nowrap px-4 py-4 text-left text-ink-secondary"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {reportActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-40 px-4 py-8 text-center text-ink-secondary"
                    >
                      No reports have been
                      generated yet.
                    </td>
                  </tr>
                ) : (
                  reportActivity.map(
                    (activity) => (
                      <tr key={activity.id}>
                        <td className="px-4 py-4 font-semibold text-ink">
                          {activity.report}
                        </td>

                        <td className="px-4 py-4 text-slate-300">
                          {
                            activity.generatedBy
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-ink-secondary">
                          {formatDateTime(
                            activity.generatedAt,
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-300">
                          {formatNumber(
                            activity.recordCount,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
                            {activity.format}
                          </span>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs leading-5 text-ink-secondary">
            Generated reports are calculated from
            the loaded synthetic FIR CSV dataset.
            Downloaded CSV files contain only the
            records returned by the corresponding
            backend analytics endpoints.
          </p>
        </div>
      </main>
    </div>
  );
}

function ReportCard({
  report,
  loading,
  disabled,
  onGenerate,
}) {
  const Icon = report.icon;

  return (
    <article className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-hover">
          <Icon size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-semibold text-ink">
              {report.title}
            </h2>

            <span className="rounded-full bg-slate-700/70 px-3 py-1 text-xs font-medium text-slate-300">
              {report.tag}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-ink-secondary">
            {report.description}
          </p>

          <p className="mt-3 text-xs text-ink-muted">
            Generated from live dataset records
          </p>

          <button
            type="button"
            disabled={disabled}
            onClick={onGenerate}
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />

            {loading
              ? "Generating..."
              : "Generate report"}
          </button>
        </div>
      </div>
    </article>
  );
}

async function generateStateOverviewRows() {
  const [
    dashboardResponse,
    trendResponse,
  ] = await Promise.all([
    api.dashboard(),
    api.crimeTrends(),
  ]);

  const dashboard =
    dashboardResponse?.data ??
    dashboardResponse ??
    {};

  const trends =
    trendResponse?.data ??
    trendResponse ??
    {};

  const kpis = dashboard.kpis ?? {};

  const totalCases = toNumber(
    kpis.totalCases,
  );

  const statuses = normalizeArray(
    dashboard.casesByStatus,
  );

  const unresolvedCases = statuses
    .filter((status) =>
      isUnresolvedStatus(
        status.statusName ??
          status.name,
      ),
    )
    .reduce(
      (sum, status) =>
        sum + toNumber(status.count),
      0,
    );

  const resolvedCases = Math.max(
    totalCases - unresolvedCases,
    0,
  );

  const summaryRows = [
    {
      section: "State Summary",
      metric: "Total registered cases",
      category: "",
      value: totalCases,
      percentage: "100.0%",
    },
    {
      section: "State Summary",
      metric: "Active investigations",
      category: "",
      value: toNumber(
        kpis.activeInvestigations,
      ),
      percentage: percentage(
        kpis.activeInvestigations,
        totalCases,
      ),
    },
    {
      section: "State Summary",
      metric: "Resolved cases",
      category: "",
      value: resolvedCases,
      percentage: percentage(
        resolvedCases,
        totalCases,
      ),
    },
    {
      section: "State Summary",
      metric: "Unresolved cases",
      category: "",
      value: unresolvedCases,
      percentage: percentage(
        unresolvedCases,
        totalCases,
      ),
    },
    {
      section: "State Summary",
      metric: "Heinous offences",
      category: "",
      value: toNumber(
        kpis.heinousOffences ??
          kpis.severeCases,
      ),
      percentage: percentage(
        kpis.heinousOffences ??
          kpis.severeCases,
        totalCases,
      ),
    },
  ];

  const crimeRows = normalizeArray(
    trends.crimeTypes ??
      dashboard.topCrimeTypes,
  ).map((crime) => ({
    section: "Crime Category",
    metric: "Registered cases",
    category:
      crime.crimeHeadName ??
      crime.name ??
      "Unknown",
    value: toNumber(crime.count),
    percentage: percentage(
      crime.count,
      totalCases,
    ),
  }));

  const statusRows = statuses.map(
    (status) => ({
      section: "Case Status",
      metric: "Registered cases",
      category:
        status.statusName ??
        status.name ??
        "Unknown",
      value: toNumber(status.count),
      percentage: percentage(
        status.count,
        totalCases,
      ),
    }),
  );

  return [
    ...summaryRows,
    ...crimeRows,
    ...statusRows,
  ];
}

async function generateDistrictPerformanceRows() {
  const districtsResponse =
    await api.districts();

  const districtSource =
    districtsResponse?.districts ??
    districtsResponse?.data?.districts ??
    districtsResponse?.data ??
    districtsResponse ??
    [];

  const districts =
    normalizeDistricts(districtSource);

  const rows = await Promise.all(
    districts.map(async (district) => {
      const response =
        await api.districtAnalytics(
          district.id,
        );

      const data =
        response?.data ??
        response ??
        {};

      const kpis = data.kpis ?? {};

      const statuses = normalizeArray(
        data.statuses ??
          data.casesByStatus,
      );

      const totalCases = toNumber(
        kpis.totalCases,
      );

      const unresolvedCases = statuses
        .filter((status) =>
          isUnresolvedStatus(
            status.name ??
              status.statusName,
          ),
        )
        .reduce(
          (sum, status) =>
            sum +
            toNumber(status.count),
          0,
        );

      const resolvedCases = Math.max(
        totalCases - unresolvedCases,
        0,
      );

      const leadingCrime =
        normalizeArray(
          data.crimeTypes,
        )
          .sort(
            (first, second) =>
              toNumber(second.count) -
              toNumber(first.count),
          )[0];

      return {
        district_id: district.id,
        district: district.name,
        total_cases: totalCases,
        resolved_cases: resolvedCases,
        unresolved_cases:
          unresolvedCases,
        resolution_rate: percentage(
          resolvedCases,
          totalCases,
        ),
        heinous_offences: toNumber(
          kpis.heinousOffences ??
            kpis.severeCases,
        ),
        police_stations: toNumber(
          kpis.policeStations,
        ),
        officers: toNumber(
          kpis.officers,
        ),
        leading_crime_category:
          leadingCrime?.name ??
          leadingCrime?.crimeHeadName ??
          "Not available",
        leading_crime_cases: toNumber(
          leadingCrime?.count,
        ),
      };
    }),
  );

  return rows.sort(
    (first, second) =>
      second.total_cases -
      first.total_cases,
  );
}

async function generateRepeatOffenderRows() {
  const response =
    await api.repeatOffenders(
      "?minCases=2",
    );

  const source =
    response?.offenders ??
    response?.data?.offenders ??
    response?.data ??
    response ??
    [];

  return normalizeArray(source)
    .map((offender) => ({
      person_id:
        offender.personId ??
        offender.PersonMasterID ??
        offender.id ??
        "",
      person_name:
        offender.name ??
        offender.personName ??
        "Unknown",
      age:
        offender.age ??
        "Not available",
      linked_fir_records: toNumber(
        offender.caseCount ??
          offender.totalCases,
      ),
      districts: normalizeTextArray(
        offender.districts,
      ).join("; "),
      crime_categories:
        normalizeTextArray(
          offender.crimeTypes,
        ).join("; "),
      preferred_modus_operandi:
        offender.preferredMO ??
        offender.modusOperandi ??
        "Not available",
      latest_linked_case:
        offender.lastKnownCaseDate ??
        offender.latestCaseDate ??
        "Not available",
    }))
    .sort(
      (first, second) =>
        second.linked_fir_records -
        first.linked_fir_records,
    );
}

async function generateHotspotRows() {
  const response = await api.hotspots();

  const clusters =
    response?.clusters ??
    response?.data?.clusters ??
    [];

  const points =
    response?.points ??
    response?.data?.points ??
    [];

  const mappedIncidents =
    normalizeArray(points).length;

  return normalizeArray(clusters)
    .map((cluster) => ({
      district_id:
        cluster.districtId ??
        cluster.DistrictID ??
        "",
      district:
        cluster.districtName ??
        cluster.DistrictName ??
        "Unknown",
      registered_cases: toNumber(
        cluster.count ??
          cluster.caseCount,
      ),
      mapped_case_share: percentage(
        cluster.count ??
          cluster.caseCount,
        mappedIncidents,
      ),
      risk_classification:
        cluster.risk ??
        "Not available",
      latitude:
        cluster.latitude ??
        cluster.Latitude ??
        "",
      longitude:
        cluster.longitude ??
        cluster.Longitude ??
        "",
    }))
    .sort(
      (first, second) =>
        second.registered_cases -
        first.registered_cases,
    );
}

function normalizeDistricts(value) {
  return normalizeArray(value)
    .map((district, index) => ({
      id: String(
        district.districtId ??
          district.DistrictID ??
          district.id ??
          index,
      ),
      name:
        district.districtName ??
        district.DistrictName ??
        district.name ??
        "Unknown",
    }))
    .filter(
      (district) =>
        district.id &&
        district.name !== "Unknown",
    );
}

function normalizeTextArray(value) {
  return normalizeArray(value)
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return (
        item?.districtName ??
        item?.crimeHeadName ??
        item?.name ??
        ""
      );
    })
    .filter(Boolean);
}

function isUnresolvedStatus(value) {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    status.includes(
      "under investigation",
    ) ||
    status.includes("undetected") ||
    status.includes("pending") ||
    status.includes("unresolved")
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

  const csvRows = [
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

  const csvContent =
    "\uFEFF" + csvRows.join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type:
        "text/csv;charset=utf-8;",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

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

function getCurrentUserName() {
  try {
    const user = JSON.parse(
      localStorage.getItem(
        "NETRA-user",
      ) || "{}",
    );

    return (
      user.name ??
      user.displayName ??
      user.username ??
      user.email ??
      "Current investigator"
    );
  } catch {
    return "Current investigator";
  }
}

function createFileName(prefix) {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return `${prefix}-${date}.csv`;
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
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

export default Reports;