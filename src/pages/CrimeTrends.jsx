import {
  BarChart3,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "../components/common/PageHeader";
import clsx from "clsx";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

function CrimeTrends() {
  const {
    data: dashboardResponse,
    loading: dashboardLoading,
    error: dashboardError,
  } = useApi(() => api.dashboard(), []);

  const {
    data: trendsResponse,
    loading: trendsLoading,
    error: trendsError,
  } = useApi(() => api.crimeTrends(), []);

  const dashboard =
    dashboardResponse?.data ??
    dashboardResponse ??
    {};

  const trends =
    trendsResponse?.data ??
    trendsResponse ??
    {};

  const casesByStatus = normalizeArray(
    dashboard.casesByStatus ??
      dashboard.statusDistribution,
  );

  const monthlyCrimeTrend = normalizeArray(
    trends.monthlyTrend ??
      dashboard.monthlyTrend,
  )
    .map((item) => ({
      month:
        item.month ??
        item.period ??
        item.date ??
        "Unknown",

      cases: toNumber(
        item.count ??
          item.cases ??
          item.value,
      ),
    }))
    .sort((first, second) =>
      String(first.month).localeCompare(
        String(second.month),
      ),
    );

  const crimeCategoryData = normalizeArray(
    trends.crimeTypes ??
      dashboard.topCrimeTypes ??
      dashboard.categoryDistribution,
  )
    .map((item) => ({
      name:
        item.crimeHeadName ??
        item.name ??
        item.category ??
        "Unknown",

      value: toNumber(
        item.count ??
          item.value ??
          item.totalCases,
      ),
    }))
    .filter((item) => item.value > 0)
    .sort(
      (first, second) =>
        second.value - first.value,
    );

  const totalCases = toNumber(
    dashboard?.kpis?.totalCases ??
      dashboard.totalCases,
  );

  const unresolvedCases = casesByStatus
    .filter((item) =>
      isUnresolvedStatus(
        item.statusName ??
          item.name ??
          item.status,
      ),
    )
    .reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.count ??
            item.value ??
            item.totalCases,
        ),
      0,
    );

  const solvedCases = Math.max(
    totalCases - unresolvedCases,
    0,
  );

  const solvedPercentage =
    calculatePercentage(
      solvedCases,
      totalCases,
    );

  const unresolvedPercentage =
    calculatePercentage(
      unresolvedCases,
      totalCases,
    );

  const loading =
    dashboardLoading || trendsLoading;

  const error =
    dashboardError || trendsError;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={BarChart3}
        title="Crime Trends"
        description="Analyse changes in crime volume, categories and case resolution"
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-critical-soft">
            {String(error)}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            title="Total cases"
            value={
              loading
                ? "..."
                : formatNumber(totalCases)
            }
            change={
              loading
                ? "Loading dataset..."
                : "Live dataset"
            }
            icon={TrendingUp}
            tone="primary"
            changeTone="neutral"
          />

          <Metric
            title="Cases solved"
            value={
              loading
                ? "..."
                : formatNumber(solvedCases)
            }
            change={
              loading
                ? "Calculating..."
                : `${solvedPercentage}% of total cases`
            }
            icon={TrendingUp}
            tone="success"
            changeTone="success"
          />

          <Metric
            title="Unresolved cases"
            value={
              loading
                ? "..."
                : formatNumber(
                    unresolvedCases,
                  )
            }
            change={
              loading
                ? "Calculating..."
                : `${unresolvedPercentage}% of total cases`
            }
            icon={TrendingDown}
            tone="danger"
            changeTone="danger"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartCard title="Monthly case trend">
            {loading ? (
              <ChartLoading />
            ) : monthlyCrimeTrend.length === 0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <AreaChart
                  data={monthlyCrimeTrend}
                >
                  <defs>
                    <linearGradient
                      id="trendAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#fb923c"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="#f97316"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#232326"
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#a3a3a0"
                    minTickGap={25}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    stroke="#a3a3a0"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131315",
                      border:
                        "1px solid #232326",
                      borderRadius: "12px",
                      color: "#f5f5f4",
                    }}
                    formatter={(value) => [
                      formatNumber(value),
                      "Cases",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="cases"
                    name="Registered cases"
                    stroke="#f97316"
                    fill="url(#trendAreaGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Cases by crime category">
            {loading ? (
              <ChartLoading />
            ) : crimeCategoryData.length ===
              0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart
                  data={crimeCategoryData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 65,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#232326"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#a3a3a0"
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    stroke="#a3a3a0"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      fill:
                        "rgba(249, 115, 22, 0.06)",
                    }}
                    contentStyle={{
                      backgroundColor: "#131315",
                      border:
                        "1px solid #232326",
                      borderRadius: "12px",
                      color: "#f5f5f4",
                    }}
                    formatter={(value) => [
                      formatNumber(value),
                      "Cases",
                    ]}
                  />

                  <Bar
                    dataKey="value"
                    name="Registered cases"
                    radius={[7, 7, 0, 0]}
                  >
                    {crimeCategoryData.map(
                      (item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="mt-5 rounded-xl border border-edge bg-surface px-4 py-3 shadow-card">
          <p className="text-xs leading-5 text-ink-muted">
            Crime volumes, category totals and case
            resolution figures are calculated from
            the loaded synthetic FIR dataset. A case
            is treated as unresolved when its status
            is Under Investigation or Undetected.
          </p>
        </div>
      </main>
    </div>
  );
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
    status.includes("unresolved") ||
    status.includes("pending")
  );
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
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

function calculatePercentage(value, total) {
  if (!total) {
    return "0.0";
  }

  return (
    (toNumber(value) /
      toNumber(total)) *
    100
  ).toFixed(1);
}

const CHART_COLORS = [
  "#f97316",
  "#22c55e",
  "#f59e0b",
  "#38bdf8",
  "#ef4444",
  "#a78bfa",
  "#6b6b68",
];

const METRIC_ICON_TONES = {
  primary: "border border-primary/30 bg-primary/10 text-primary-hover",
  success: "border border-success/30 bg-success/10 text-success",
  danger: "border border-danger/30 bg-danger/10 text-danger",
  warning: "border border-warning/30 bg-warning/10 text-warning",
  neutral: "border border-edge bg-surface-hover text-ink-secondary",
};

const METRIC_CHANGE_TONES = {
  primary: "text-primary",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-ink-secondary",
};

function Metric({
  title,
  value,
  change,
  icon: Icon,
  tone = "primary",
  changeTone = "primary",
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover">
      <div className="flex justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-secondary">
            {title}
          </p>

          <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-ink lg:text-4xl">
            {value}
          </p>
        </div>

        <div
          className={clsx(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            METRIC_ICON_TONES[tone],
          )}
        >
          <Icon size={21} />
        </div>
      </div>

      <p
        className={clsx(
          "mt-4 text-sm font-medium",
          METRIC_CHANGE_TONES[changeTone],
        )}
      >
        {change}
      </p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-ink">
        {title}
      </h2>

      {children}
    </section>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-[320px] items-center justify-center">
      <p className="text-sm text-ink-secondary">
        Loading crime trend records...
      </p>
    </div>
  );
}

function NoChartData() {
  return (
    <div className="flex h-[320px] items-center justify-center">
      <p className="text-sm text-ink-secondary">
        No dataset records available.
      </p>
    </div>
  );
}

export default CrimeTrends;