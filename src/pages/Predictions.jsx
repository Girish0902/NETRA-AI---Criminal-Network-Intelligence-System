import {
  BrainCircuit,
  CircleAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
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

function PredictiveIntelligence() {
  const {
    data: predictiveResponse,
    loading,
    error,
  } = useApi(() => api.predictive(), []);

  const predictiveData =
    predictiveResponse?.data ??
    predictiveResponse ??
    {};

  const modelName =
    predictiveData.model ??
    "Dataset forecast model";

  const predictions = normalizePredictions(
    predictiveData.predictions,
  );

  const highRiskDistricts = predictions.filter(
    (prediction) => prediction.risk === "high",
  ).length;

  const totalPredictedCases = predictions.reduce(
    (sum, prediction) =>
      sum + prediction.predictedCases,
    0,
  );

  const totalPreviousCases = predictions.reduce(
    (sum, prediction) =>
      sum + prediction.previousCases,
    0,
  );

  const expectedCaseChange =
    calculatePercentageChange(
      totalPredictedCases,
      totalPreviousCases,
    );

  const highestForecastDistrict =
    predictions.length > 0
      ? [...predictions].sort(
          (first, second) =>
            second.predictedCases -
            first.predictedCases,
        )[0]
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={BrainCircuit}
        title="Predictive Intelligence"
        description="Forecast crime patterns and identify emerging operational risks"
        action={
          <span className="max-w-72 truncate rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary-hover">
            {loading ? "Loading model..." : modelName}
          </span>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {String(error)}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            title="High-risk districts"
            value={
              loading
                ? "..."
                : formatNumber(highRiskDistricts)
            }
            description="Classified as high risk by the forecast"
          />

          <Metric
            title="Expected case change"
            value={
              loading
                ? "..."
                : formatSignedPercentage(
                    expectedCaseChange,
                  )
            }
            description="Predicted next month versus previous average"
          />

          <Metric
            title="Highest forecast district"
            value={
              loading
                ? "..."
                : highestForecastDistrict
                  ? highestForecastDistrict.district
                  : "No data"
            }
            description={
              loading
                ? "Loading district forecast..."
                : highestForecastDistrict
                  ? `${formatNumber(
                      highestForecastDistrict.predictedCases,
                    )} predicted cases next month`
                  : "No forecast records available"
            }
          />
        </div>

        <section className="mt-5 rounded-2xl border border-edge bg-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">
                District risk forecast
              </h2>

              <p className="mt-1 text-sm text-ink-secondary">
                Predicted monthly case volume compared
                with the previous three-month average
              </p>
            </div>
          </div>

          {loading ? (
            <ChartLoading />
          ) : predictions.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <BarChart
                data={predictions}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 55,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#232326"
                />

                <XAxis
                  dataKey="district"
                  stroke="#6b6b68"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  stroke="#6b6b68"
                  allowDecimals={false}
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
                    border: "1px solid #1f2937",
                    borderRadius: "12px",
                    color: "#f5f5f4",
                  }}
                  formatter={(value, name) => [
                    formatNumber(value),
                    name,
                  ]}
                />

                <Bar
                  dataKey="previousCases"
                  fill="#6b6b68"
                  name="Previous monthly average"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="predictedCases"
                  name="Predicted next month"
                  radius={[5, 5, 0, 0]}
                >
                  {predictions.map((prediction) => (
                    <Cell
                      key={prediction.id}
                      fill={getRiskColour(
                        prediction.risk,
                      )}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {loading ? (
            <>
              <PredictionLoading />
              <PredictionLoading />
            </>
          ) : (
            predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
              />
            ))
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert
              size={21}
              className="mt-0.5 shrink-0 text-amber-400"
            />

            <div>
              <h3 className="font-semibold text-amber-300">
                Explainable prediction notice
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Forecasts are calculated from historical
                monthly FIR volumes using the model shown
                above. They should support planning and
                resource allocation and must not be treated
                as evidence that a particular person will
                commit an offence.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs leading-5 text-ink-secondary">
            District forecasts are derived from
            CrimeRegisteredDate records grouped by district.
            Predicted next-month volume uses the recent
            three-month average, while change is measured
            against the preceding three-month average. The
            underlying records are synthetic demonstration
            data.
          </p>
        </div>
      </main>
    </div>
  );
}

function normalizePredictions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((prediction, index) => {
      const predictedCases = toNumber(
        prediction.predictedNextMonth ??
          prediction.predictedCases ??
          prediction.forecast,
      );

      const changePercent = toNumber(
        prediction.changePercent ??
          prediction.change ??
          0,
      );

      return {
        id:
          prediction.districtId ??
          prediction.id ??
          `prediction-${index}`,

        district:
          prediction.districtName ??
          prediction.district ??
          prediction.name ??
          "Unknown",

        predictedCases,

        previousCases:
          derivePreviousAverage(
            predictedCases,
            changePercent,
          ),

        changePercent,

        risk: normalizeRisk(prediction.risk),
      };
    })
    .filter(
      (prediction) =>
        prediction.district !== "Unknown" ||
        prediction.predictedCases > 0,
    )
    .sort(
      (first, second) =>
        second.predictedCases -
        first.predictedCases,
    );
}

function derivePreviousAverage(
  predictedCases,
  changePercent,
) {
  if (changePercent === -100) {
    return 0;
  }

  const divisor =
    1 + changePercent / 100;

  if (!Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(predictedCases / divisor),
  );
}

function calculatePercentageChange(
  predicted,
  previous,
) {
  if (!previous) {
    return predicted > 0 ? 100 : 0;
  }

  return (
    ((predicted - previous) / previous) *
    100
  );
}

function Metric({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-secondary">
        {title}
      </p>

      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-ink">
        {value}
      </p>

      <p className="mt-2 text-xs text-ink-muted">
        {description}
      </p>
    </div>
  );
}

function PredictionCard({ prediction }) {
  const isIncreasing =
    prediction.changePercent > 0;

  const isDecreasing =
    prediction.changePercent < 0;

  const riskClass = getRiskClass(
    prediction.risk,
  );

  return (
    <article className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-ink">
            {prediction.district}
          </h2>

          <p className="mt-1 text-sm text-ink-secondary">
            Dataset-based monthly forecast
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass}`}
        >
          {formatRisk(prediction.risk)} risk
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <DataBox
          label="Predicted next month"
          value={formatNumber(
            prediction.predictedCases,
          )}
        />

        <DataBox
          label="Previous monthly average"
          value={formatNumber(
            prediction.previousCases,
          )}
        />

        <DataBox
          label="Forecast change"
          value={formatSignedPercentage(
            prediction.changePercent,
          )}
        />

        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-ink-muted">
            Trend
          </p>

          <div
            className={`mt-1 flex items-center gap-2 text-sm font-semibold ${
              isIncreasing
                ? "text-red-400"
                : isDecreasing
                  ? "text-emerald-400"
                  : "text-primary-hover"
            }`}
          >
            {isIncreasing ? (
              <TrendingUp size={16} />
            ) : isDecreasing ? (
              <TrendingDown size={16} />
            ) : (
              <span className="text-base leading-none">
                â€”
              </span>
            )}

            {isIncreasing
              ? "Increasing"
              : isDecreasing
                ? "Decreasing"
                : "Stable"}
          </div>
        </div>
      </div>
    </article>
  );
}

function DataBox({ label, value }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <p className="text-xs text-ink-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-ink">
        {value}
      </p>
    </div>
  );
}

function normalizeRisk(value) {
  const risk = String(value ?? "")
    .trim()
    .toLowerCase();

  if (risk === "high") {
    return "high";
  }

  if (risk === "medium") {
    return "medium";
  }

  return "low";
}

function getRiskColour(risk) {
  if (risk === "high") {
    return "#ef4444";
  }

  if (risk === "medium") {
    return "#f59e0b";
  }

  return "#22c55e";
}

function getRiskClass(risk) {
  if (risk === "high") {
    return "bg-critical/15 text-critical-soft";
  }

  if (risk === "medium") {
    return "bg-watch/15 text-watch-soft";
  }

  return "bg-resolved/15 text-resolved-soft";
}

function formatRisk(risk) {
  return (
    risk.charAt(0).toUpperCase() +
    risk.slice(1)
  );
}

function formatSignedPercentage(value) {
  const number = toNumber(value);

  return `${
    number > 0 ? "+" : ""
  }${number.toFixed(1)}%`;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString(
    "en-IN",
  );
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function ChartLoading() {
  return (
    <div className="flex h-[340px] items-center justify-center">
      <p className="text-sm text-ink-secondary">
        Calculating district forecasts...
      </p>
    </div>
  );
}

function NoData() {
  return (
    <div className="flex h-[340px] items-center justify-center">
      <p className="text-sm text-ink-secondary">
        No forecast records are available.
      </p>
    </div>
  );
}

function PredictionLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-secondary">
        Loading district forecast...
      </p>
    </div>
  );
}

export default PredictiveIntelligence;