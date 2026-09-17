import {
  Activity,
  AlertTriangle,
  Database,
  FileText,
  MapPin,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import DashboardTour from "../components/common/DashboardTour";
import StatCard from "../components/ui/StatCard";
import Panel from "../components/ui/Panel";
import ErrorState from "../components/ui/ErrorState";
import {
  calculatePercentage,
  formatNumber,
  toNumber,
} from "../utils/format";
import {
  dashboardFallback,
  trendsFallback,
} from "../data/dashboardFallback";

const CHART_COLORS = [
  "#f97316",
  "#22c55e",
  "#f59e0b",
  "#38bdf8",
  "#ef4444",
  "#a78bfa",
  "#6b6b68",
];

function getStatusColor(name = "") {
  const label = String(name).toLowerCase();

  if (
    label.includes("under investigation") ||
    label.includes("investigat")
  ) {
    return "#f97316";
  }

  if (
    label.includes("charge") ||
    label.includes("sheeted")
  ) {
    return "#38bdf8";
  }

  if (
    label.includes("arrest")
  ) {
    return "#f59e0b";
  }

  if (
    label.includes("clos") ||
    label.includes("resolv")
  ) {
    return "#22c55e";
  }

  if (
    label.includes("undetect") ||
    label.includes("pending")
  ) {
    return "#ef4444";
  }

  return "#6b6b68";
}

const TOOLTIP_STYLE = {
  backgroundColor: "#131315",
  border: "1px solid #232326",
  borderRadius: "12px",
  color: "#f5f5f4",
};

/* ---- mix a hex color toward white (top-glow tint) ---- */
function lightenHex(hex, amount = 0.5) {
  const num = parseInt(String(hex).replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const mix = (channel) =>
    Math.round(channel + (255 - channel) * amount);

  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/* ---- line stroke glow filter ---- */
const LINE_GLOW_FILTER = {
  id: "netra-line-glow",
  x: "-20%",
  y: "-20%",
  width: "140%",
  height: "140%",
};

/* ---- signal-channel bar: sharp top edge + gradient top-glow ---- */
function SignalBarShape(props) {
  const {
    fill,
    x,
    y,
    width,
    height,
    index,
    payload,
    className,
    onMouseEnter,
    onMouseLeave,
  } = props;

  const gradientId = `netra-bar-glow-${index}`;
  const inset = Math.min(width * 0.16, 4);
  const barWidth = Math.max(width - inset * 2, 0);

  return (
    <g className={className}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="1"
          x2="0"
          y2="0"
        >
          <stop
            offset="0%"
            stopColor={fill}
            stopOpacity={1}
          />
          <stop
            offset="76%"
            stopColor={lightenHex(fill, 0.32)}
            stopOpacity={1}
          />
          <stop
            offset="92%"
            stopColor={lightenHex(fill, 0.7)}
            stopOpacity={1}
          />
          <stop
            offset="100%"
            stopColor={lightenHex(fill, 1)}
            stopOpacity={1}
          />
        </linearGradient>
      </defs>

      <rect
        x={x + inset}
        y={y}
        width={barWidth}
        height={Math.max(height, 0)}
        fill={`url(#${gradientId})`}
        onMouseEnter={
          onMouseEnter
            ? () => onMouseEnter(props, index, payload)
            : undefined
        }
        onMouseLeave={
          onMouseLeave
            ? () => onMouseLeave(props, index, payload)
            : undefined
        }
      />
    </g>
  );
}

/* ---- mono value tag floating above each bar ---- */
function renderBarValueLabel(props) {
  const { x, y, width, value } = props;

  if (x == null || y == null) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 7}
      textAnchor="middle"
      fontFamily="var(--font-mono-status)"
      fontSize={10}
      fontWeight={600}
      fill="var(--color-ink-secondary)"
    >
      {formatNumber(value)}
    </text>
  );
}

/* ---- leading-edge pulse beacon on the newest trend point ---- */
function renderLeadingDot(props) {
  const { cx, cy, isLast } = props;

  if (cx == null || cy == null || !isLast) {
    return null;
  }

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#f97316"
      >
        <animate
          attributeName="r"
          values="4;10;4"
          dur="1.9s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.45;0;0.45"
          dur="1.9s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={cx}
        cy={cy}
        r={2.5}
        fill="#f97316"
      />
    </g>
  );
}

/* =====================================================================
   RadarWeb — radar/web chart for "Case Category Distribution"
   Geometry ported 1:1 from the approved reference implementation:
   viewBox 380x340, center (190,165), R=118, 3 grid rings (0.33/0.66/1.0),
   spokes to each category's max-radius vertex, animated polygon draw-in,
   radial-gradient fill fade, staggered point dots, label/pct placement
   with start/middle/end text-anchor logic.
   ===================================================================== */
const RADAR_VB_WIDTH = 380;
const RADAR_VB_HEIGHT = 340;
const RADAR_CX = 190;
const RADAR_CY = 165;
const RADAR_R = 118;
const RADAR_RING_FRACS = [0.33, 0.66, 1];
const RADAR_LABEL_RADIUS = 1.24;
const RADAR_DASH = 700;

function radarPointAt(index, count, frac) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: RADAR_CX + Math.cos(angle) * RADAR_R * frac,
    y: RADAR_CY + Math.sin(angle) * RADAR_R * frac,
  };
}

function RadarWeb({ data, total }) {
  const [fillVisible, setFillVisible] = useState(false);
  const [visible, setVisible] = useState(
    () => new Set(),
  );
  const timersRef = useRef([]);

  const count = data.length;

  const dataScaleMax = useMemo(() => {
    const maxPct = Math.max(
      ...data.map((item) => Number(item.pct) || 0),
      0.001,
    );
    return Math.ceil(maxPct / 5) * 5;
  }, [data]);

  const dataPoints = useMemo(
    () =>
      data.map((item, index) => {
        const frac = (Number(item.pct) || 0) / dataScaleMax;
        return radarPointAt(index, count, frac);
      }),
    [data, dataScaleMax, count],
  );

  useEffect(() => {
    const timers = timersRef.current;

    const fillTimer = window.setTimeout(
      () => setFillVisible(true),
      0,
    );
    timers.push(fillTimer);

    data.forEach((_, index) => {
      const t = window.setTimeout(
        () =>
          setVisible((previous) => {
            const next = new Set(previous);
            next.add(index);
            return next;
          }),
        1100 + index * 40,
      );
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
  }, [data]);

  const polygonPoints = dataPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="flex w-full justify-center">
      <div
        style={{
          width: "100%",
          maxWidth: RADAR_VB_WIDTH,
          aspectRatio: `${RADAR_VB_WIDTH} / ${RADAR_VB_HEIGHT}`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${RADAR_VB_WIDTH} ${RADAR_VB_HEIGHT}`}
          role="img"
          aria-label={`Case category distribution — share of ${formatNumber(total)} total cases`}
        >
        <defs>
          <radialGradient
            id="radarFill"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop
              offset="0%"
              stopColor="#f97316"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="#f97316"
              stopOpacity="0.02"
            />
          </radialGradient>
        </defs>

        {RADAR_RING_FRACS.map((frac) => {
          const ringPoints = Array.from(
            { length: count },
            (_, index) => {
              const point = radarPointAt(index, count, frac);
              return `${point.x},${point.y}`;
            },
          ).join(" ");

          return (
            <polygon
              key={`ring-${frac}`}
              className="radar-grid-ring"
              points={ringPoints}
            />
          );
        })}

        {data.map((item, index) => {
          const outer = radarPointAt(index, count, 1);

          return (
            <line
              key={`spoke-${index}`}
              className="radar-spoke"
              x1={RADAR_CX}
              y1={RADAR_CY}
              x2={outer.x}
              y2={outer.y}
            />
          );
        })}

        <polygon
          className="radar-poly-fill"
          style={{
            opacity: fillVisible ? 1 : 0,
            transition: "opacity 0.6s ease 0.4s",
          }}
          points={polygonPoints}
        />

        <polygon
          className="radar-poly-stroke"
          style={{
            strokeDasharray: RADAR_DASH,
            strokeDashoffset: RADAR_DASH,
            animation: `netraRadarDraw 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards`,
          }}
          points={polygonPoints}
        />

        {dataPoints.map((point, index) => (
          <circle
            key={`dot-${index}`}
            className="radar-pt"
            style={{
              opacity: visible.has(index) ? 1 : 0,
              transition: "opacity 0.3s",
            }}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={data[index].color}
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}

        {data.map((item, index) => {
          const labelPos = radarPointAt(
            index,
            count,
            RADAR_LABEL_RADIUS,
          );
          const anchor =
            Math.abs(labelPos.x - RADAR_CX) < 8
              ? "middle"
              : labelPos.x > RADAR_CX
                ? "start"
                : "end";

          return (
            <g key={`label-${index}`}>
              <text
                className="radar-axis-label"
                x={labelPos.x}
                y={labelPos.y - 5}
                textAnchor={anchor}
              >
                {String(item.name).toUpperCase()}
              </text>
              <text
                className="radar-axis-pct"
                x={labelPos.x}
                y={labelPos.y + 8}
                textAnchor={anchor}
                fill={item.color}
              >
                {item.pct.toFixed(1)}%
              </text>
            </g>
          );
        })}
        </svg>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const {
    data: dashboardResponse,
    loading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard,
  } = useApi(() => api.dashboard(), []);

  const {
    data: trendsResponse,
    loading: trendsLoading,
    error: trendsError,
  } = useApi(() => api.crimeTrends(), []);

  const loading = dashboardLoading || trendsLoading;
  const error = dashboardError || trendsError;

  const loadedDashboardResponse = error
    ? dashboardFallback
    : dashboardResponse;

  const loadedTrendsResponse = error
    ? trendsFallback
    : trendsResponse;

  const dashboardData = normalizeDashboardData(
    loadedDashboardResponse,
    loadedTrendsResponse,
  );

  const handleRetry = () => {
    reloadDashboard();
  };

  const {
    totalCases,
    activeInvestigations,
    heinousOffences,
    highestCaseVolume,
    categoryDistribution,
    statusDistribution,
    monthlyTrend,
  } = dashboardData;

  const activePercentage = calculatePercentage(
    activeInvestigations,
    totalCases,
  );

  const heinousPercentage = calculatePercentage(
    heinousOffences,
    totalCases,
  );

  const [tourOpen, setTourOpen] =
    useState(false);

  const donutTotal = useMemo(
    () =>
      categoryDistribution.reduce(
        (sum, item) => sum + (Number(item.value) || 0),
        0,
      ),
    [categoryDistribution],
  );

  const radarGeometry = useMemo(
    () => ({
      total: donutTotal,
      data: categoryDistribution.map((item, index) => ({
        name: String(item.name),
        pct:
          (Number(item.value) /
            Math.max(donutTotal, 1)) *
          100,
        color:
          CHART_COLORS[
            index % CHART_COLORS.length
          ],
      })),
    }),
    [categoryDistribution, donutTotal],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div data-tour="dashboard-header">
        <PageHeader
          icon={Activity}
          title="Crime Intelligence Dashboard"
          description="Historical and operational insights from FIR records"
          action={
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="rounded-xl bg-primary px-5 py-3 font-medium text-white transition hover:bg-primary-hover"
            >
              Take a tour
            </button>
          }
        />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5">
            <ErrorState
              title="Dashboard unavailable"
              message={`The intelligence feed could not be reached (${String(
                error,
              )}). Showing demonstration indicators based on the loaded dataset sample.`}
              onRetry={handleRetry}
            />
          </div>
        )}

        <div
          data-tour="dashboard-kpis"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Total Registered Cases"
            value={
              loading
                ? "..."
                : formatNumber(totalCases)
            }
            description={
              loading ? (
                <span className="netra-tag netra-tag--warn">
                  <span className="netra-tag__dot" />
                  [~] SYNCING_INTERFACE
                </span>
              ) : error ? (
                <span className="netra-tag netra-tag--critical">
                  <span className="netra-tag__dot" />
                  [!] DEMO_MODE
                </span>
              ) : (
                <span className="netra-tag netra-tag--ok">
                  <span className="netra-tag__dot" />
                  [✓] LIVE_DATASET
                </span>
              )
            }
            footer={
              <button
                type="button"
                onClick={() =>
                  navigate("/resources")
                }
                className="text-xs font-semibold text-primary-hover transition hover:text-primary"
              >
                Live dataset ↗
              </button>
            }
            icon={FileText}
            iconTone="primary"
          />

          <StatCard
            title="Active Investigations"
            value={
              loading
                ? "..."
                : formatNumber(
                    activeInvestigations,
                  )
            }
            description={
              loading
                ? "Calculating..."
                : `${activePercentage}% of total cases`
            }
            footer={
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/cases?status=Under%20Investigation",
                  )
                }
                className="text-xs font-semibold text-primary-hover transition hover:text-primary"
              >
                Investigation records ↗
              </button>
            }
            icon={Activity}
            iconTone="accent"
          />

          <StatCard
            title="Heinous Offences"
            value={
              loading
                ? "..."
                : formatNumber(
                    heinousOffences,
                  )
            }
            description={
              loading
                ? "Calculating..."
                : `${heinousPercentage}% of total cases`
            }
            footer={
              <button
                type="button"
                onClick={() =>
                  navigate("/cases?gravity=High")
                }
                className="text-xs font-semibold text-primary-hover transition hover:text-primary"
              >
                High severity cases ↗
              </button>
            }
            icon={AlertTriangle}
            iconTone="danger"
          />

          <StatCard
            title="Highest Case Volume"
            value={
              loading
                ? "..."
                : highestCaseVolume.district
            }
            description={
              loading
                ? "Loading..."
                : `${formatNumber(
                    highestCaseVolume.count,
                  )} registered cases`
            }
            footer={
              <button
                type="button"
                onClick={() =>
                  navigate("/hotspots")
                }
                className="text-xs font-semibold text-primary-hover transition hover:text-primary"
              >
                View map ↗
              </button>
            }
            icon={MapPin}
            iconTone="secondary"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-5">
          <Panel
            title="Case Category Distribution"
            subtitle={`share of ${formatNumber(
              donutTotal,
            )} total`}
            bodyClassName="p-3"
            className="xl:col-span-2"
          >
            <div data-tour="category-chart">
              {loading ? (
                <ChartLoading />
              ) : categoryDistribution.length ===
                0 ? (
                <NoChartData />
              ) : (
                <div className="rounded-xl border border-edge bg-canvas p-3">
                  <RadarWeb
                    data={radarGeometry.data}
                    total={radarGeometry.total}
                  />
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Offence Severity Distribution"
            bodyClassName="p-3"
            className="xl:col-span-3"
          >
            <div data-tour="severity-chart">
              {loading ? (
                <ChartLoading />
              ) : statusDistribution.length ===
                0 ? (
                <NoChartData />
              ) : (
                <div className="rounded-xl border border-edge bg-canvas p-3">
                  <ResponsiveContainer
                    width="100%"
                    height={270}
                  >
                    <BarChart
                      data={statusDistribution}
                      barCategoryGap="24%"
                      margin={{
                        top: 22,
                        right: 10,
                        left: 0,
                        bottom: 35,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="2 6"
                        stroke="#232326"
                        strokeOpacity={0.55}
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#232326"
                        tick={{
                          fontSize: 9,
                          fontFamily:
                            "var(--font-mono-status)",
                          fill: "#6b6b68",
                        }}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                      />

                      <YAxis
                        stroke="#232326"
                        tick={{
                          fontSize: 9,
                          fontFamily:
                            "var(--font-mono-status)",
                          fill: "#6b6b68",
                        }}
                      />

                      <Tooltip
                        cursor={{
                          fill:
                            "rgba(249, 115, 22, 0.06)",
                        }}
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => [
                          formatNumber(value),
                          "Cases",
                        ]}
                      />

                      <Bar
                        dataKey="value"
                        shape={
                          <SignalBarShape />
                        }
                        barSize={16}
                        isAnimationActive={false}
                        label={renderBarValueLabel}
                      >
                        {statusDistribution.map(
                          (item, index) => (
                            <Cell
                              key={`${item.name}-${index}`}
                              fill={getStatusColor(
                                item.name,
                              )}
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-5">
          <Panel
            title="Cases Over Time"
            bodyClassName="p-3"
          >
            <div data-tour="time-chart">
              {loading ? (
                <ChartLoading height="h-[310px]" />
              ) : monthlyTrend.length === 0 ? (
                <NoChartData height="h-[310px]" />
              ) : (
                <div className="rounded-xl border border-edge bg-canvas p-3">
                  <ResponsiveContainer
                    width="100%"
                    height={290}
                  >
                    <AreaChart
                      data={monthlyTrend}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 15,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="netra-area-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f97316"
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="55%"
                            stopColor="#f97316"
                            stopOpacity={0.12}
                          />
                          <stop
                            offset="100%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <filter
                          id={LINE_GLOW_FILTER.id}
                          x={LINE_GLOW_FILTER.x}
                          y={LINE_GLOW_FILTER.y}
                          width={LINE_GLOW_FILTER.width}
                          height={LINE_GLOW_FILTER.height}
                        >
                          <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="5"
                            floodColor="#f97316"
                            floodOpacity="0.42"
                          />
                        </filter>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="2 6"
                        stroke="#232326"
                        strokeOpacity={0.55}
                      />

                      <XAxis
                        dataKey="month"
                        stroke="#232326"
                        tick={{
                          fontSize: 9,
                          fontFamily:
                            "var(--font-mono-status)",
                          fill: "#6b6b68",
                        }}
                        minTickGap={25}
                      />

                      <YAxis
                        stroke="#232326"
                        tick={{
                          fontSize: 9,
                          fontFamily:
                            "var(--font-mono-status)",
                          fill: "#6b6b68",
                        }}
                      />

                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => [
                          formatNumber(value),
                          "Cases",
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="cases"
                        name="Cases"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        fill="url(#netra-area-fill)"
                        filter={`url(#${LINE_GLOW_FILTER.id})`}
                        dot={(dotProps) =>
                          renderLeadingDot({
                            ...dotProps,
                            isLast:
                              dotProps.index ===
                              monthlyTrend.length - 1,
                          })
                        }
                        activeDot={{
                          r: 3.5,
                          fill: "#fb923c",
                          stroke: "#131315",
                          strokeWidth: 2,
                        }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="netra-console netra-console--ok">
          <div className="netra-console__header">
            <span className="netra-console__title">
              <Database size={14} />
              DATA_PIPELINE
            </span>

            <span className="netra-console__badge">
              [SYNC_OK]
            </span>
          </div>

          <div className="netra-console__line">
            <span className="netra-console__prompt">$</span>
            DEMO_SOURCE loaded — synthetic dataset generated for the NETRA AI prototype
          </div>

          <div className="netra-console__line">
            <span className="netra-console__prompt">!</span>
            No real police records or personal data present in this build
          </div>
        </div>
      </main>

      <DashboardTour
        open={tourOpen}
        onClose={() =>
          setTourOpen(false)
        }
      />
    </div>
  );
}

function normalizeDashboardData(
  dashboardResponse,
  trendsResponse,
) {
  const dashboard =
    dashboardResponse?.data ??
    dashboardResponse ??
    {};

  const trendData =
    trendsResponse?.data ??
    trendsResponse ??
    {};

  const kpis =
    dashboard.kpis ??
    dashboard.summary ??
    {};

  const totalCases = toNumber(
    kpis.totalCases ??
      kpis.totalRegisteredCases ??
      dashboard.totalCases ??
      dashboard.totalRegisteredCases,
  );

  const activeInvestigations = toNumber(
    kpis.activeInvestigations ??
      kpis.underInvestigation ??
      kpis.investigationCases ??
      dashboard.activeInvestigations,
  );

  const heinousOffences = toNumber(
    kpis.heinousOffences ??
      kpis.severeCases ??
      kpis.highSeverityCases ??
      dashboard.heinousOffences,
  );

  const districtRows = normalizeArray(
    dashboard.topDistricts ??
      dashboard.districtDistribution ??
      dashboard.districts ??
      dashboard.casesByDistrict,
  );

  const highestDistrictRow =
    districtRows.length > 0
      ? [...districtRows].sort(
          (first, second) =>
            getCount(second) -
            getCount(first),
        )[0]
      : null;

  const highestCaseVolume = {
    district:
      kpis.highestCaseVolume?.district ??
      kpis.highestCaseVolume
        ?.districtName ??
      dashboard.highestCaseVolume
        ?.district ??
      dashboard.highestCaseVolume
        ?.districtName ??
      highestDistrictRow?.district ??
      highestDistrictRow?.districtName ??
      highestDistrictRow?.name ??
      "No data",

    count: toNumber(
      kpis.highestCaseVolume?.count ??
        dashboard.highestCaseVolume
          ?.count ??
        getCount(highestDistrictRow),
    ),
  };

  const categorySource = normalizeArray(
    dashboard.categoryDistribution ??
      dashboard.crimeCategories ??
      dashboard.topCrimeTypes ??
      dashboard.casesByCrimeCategory ??
      trendData.crimeTypes ??
      trendData.categoryDistribution,
  );

  const categoryDistribution =
    categorySource
      .map((item) => ({
        name:
          item.name ??
          item.crimeGroupName ??
          item.crimeHeadName ??
          item.category ??
          item.label ??
          "Unknown",

        value: getCount(item),
      }))
      .filter(
        (item) => item.value > 0,
      );

  const statusSource = normalizeArray(
    dashboard.statusDistribution ??
      dashboard.casesByStatus ??
      dashboard
        .offenceSeverityDistribution ??
      dashboard.caseStatusDistribution ??
      trendData.statusDistribution ??
      trendData.casesByStatus,
  );

  const statusDistribution =
    statusSource
      .map((item) => ({
        name:
          item.name ??
          item.statusName ??
          item.gravityName ??
          item.status ??
          item.label ??
          "Unknown",

        value: getCount(item),
      }))
      .filter(
        (item) => item.value > 0,
      );

  const monthlySource = normalizeArray(
    dashboard.monthlyTrend ??
      dashboard.casesOverTime ??
      dashboard.monthlyCases ??
      trendData.monthlyTrend ??
      trendData.casesOverTime ??
      trendData.monthlyCases,
  );

  const monthlyTrend = monthlySource
    .map((item) => ({
      month:
        item.month ??
        item.yearMonth ??
        item.period ??
        item.date ??
        item.label ??
        "Unknown",

      cases: toNumber(
        item.cases ??
          item.count ??
          item.value ??
          item.totalCases,
      ),
    }))
    .filter(
      (item) => item.cases >= 0,
    );

  return {
    totalCases,
    activeInvestigations,
    heinousOffences,
    highestCaseVolume,
    categoryDistribution,
    statusDistribution,
    monthlyTrend,
  };
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function getCount(item) {
  if (!item) {
    return 0;
  }

  return toNumber(
    item.count ??
      item.value ??
      item.total ??
      item.totalCases ??
      item.caseCount ??
      item.cases,
  );
}

function ChartLoading({
  height = "h-[270px]",
}) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-xl border border-edge bg-canvas`}
    >
      <p className="text-sm text-ink-secondary">
        Loading dataset analytics...
      </p>
    </div>
  );
}

function NoChartData({
  height = "h-[270px]",
}) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-xl border border-edge bg-canvas`}
    >
      <p className="text-sm text-ink-secondary">
        No dataset records available.
      </p>
    </div>
  );
}

export default Dashboard;