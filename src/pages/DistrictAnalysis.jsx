import { useEffect, useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Building2 } from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import { api } from "../services/api";
import { useI18n } from "../i18n";

function DistrictAnalysis() {
  const { t } = useI18n();
  const [districtData, setDistrictData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDistrictAnalytics() {
      setLoading(true);
      setError("");

      try {
        const districtsResponse = await api.districts();

        const districtSource =
          districtsResponse?.districts ??
          districtsResponse?.data?.districts ??
          districtsResponse?.data ??
          districtsResponse ??
          [];

        const districts = normalizeDistricts(districtSource);

        const analyticsResponses = await Promise.all(
          districts.map(async (district) => {
            try {
              const response = await api.districtAnalytics(
                district.id,
              );

              return normalizeDistrictAnalytics(
                response,
                district,
              );
            } catch (districtError) {
              console.error(
                `Unable to load district ${district.name}:`,
                districtError,
              );

              return null;
            }
          }),
        );

        if (!active) {
          return;
        }

        const validDistricts = analyticsResponses
          .filter(Boolean)
          .sort(
            (first, second) =>
              second.totalCases - first.totalCases,
          );

        setDistrictData(validDistricts);
      } catch (loadError) {
        console.error(
          "District analytics loading failed:",
          loadError,
        );

        if (!active) {
          return;
        }

        setDistrictData([]);
        setError(
          loadError?.message ??
            "Unable to load district analytics.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDistrictAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo(
    () =>
      districtData.map((district) => ({
        district: district.name,
        totalCases: district.totalCases,
        resolvedCases: district.resolvedCases,
      })),
    [districtData],
  );

  const totals = useMemo(() => {
    return districtData.reduce(
      (summary, district) => ({
        totalCases:
          summary.totalCases + district.totalCases,

        resolvedCases:
          summary.resolvedCases +
          district.resolvedCases,

        unresolvedCases:
          summary.unresolvedCases +
          district.unresolvedCases,

        heinousCases:
          summary.heinousCases +
          district.heinousCases,

        policeStations:
          summary.policeStations +
          district.policeStations,
      }),
      {
        totalCases: 0,
        resolvedCases: 0,
        unresolvedCases: 0,
        heinousCases: 0,
        policeStations: 0,
      },
    );
  }, [districtData]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Building2}
        title={t("pages.districts.title")}
        description={t("pages.districts.description")}
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Summary
            title={t("pages.districts.districtsCovered")}
            value={
              loading
                ? "..."
                : formatNumber(districtData.length)
            }
          />

          <Summary
            title={t("pages.districts.totalCases")}
            value={
              loading
                ? "..."
                : formatNumber(totals.totalCases)
            }
          />

          <Summary
            title={t("pages.districts.resolved")}
            value={
              loading
                ? "..."
                : formatNumber(totals.resolvedCases)
            }
          />

          <Summary
            title={t("pages.districts.unresolved")}
            value={
              loading
                ? "..."
                : formatNumber(totals.unresolvedCases)
            }
          />

          <Summary
            title={t("pages.districts.heinousOffences")}
            value={
              loading
                ? "..."
                : formatNumber(totals.heinousCases)
            }
          />
        </div>

        <section className="mt-5 rounded-2xl border border-edge bg-surface p-5">
          <h2 className="font-semibold text-white">
            District-wise case comparison
          </h2>

          <p className="mt-1 text-sm text-ink-secondary">
            Registered and resolved case totals calculated
            from district-linked FIR records
          </p>

          {loading ? (
            <div className="flex h-[380px] items-center justify-center">
              <p className="text-sm text-ink-secondary">
                Loading district analytics from the dataset...
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[380px] items-center justify-center">
              <p className="text-sm text-ink-secondary">
                No district analytics are available.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <div
                style={{
                  minWidth: Math.max(
                    1100,
                    chartData.length * 85,
                  ),
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height={380}
                >
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 80,
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
                      angle={-35}
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
                        border:
                          "1px solid #1f2937",
                        borderRadius: "12px",
                        color: "#f5f5f4",
                      }}
                      formatter={(value, name) => [
                        formatNumber(value),
                        name,
                      ]}
                    />

                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{
                        paddingBottom: "18px",
                      }}
                    />

                    <Bar
                      dataKey="totalCases"
                      name="Total cases"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                    />

                    <Bar
                      dataKey="resolvedCases"
                      name="Resolved cases"
                      fill="#22c55e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DistrictLoading />
            <DistrictLoading />
            <DistrictLoading />
            <DistrictLoading />
          </div>
        ) : districtData.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {districtData.map((district) => (
              <DistrictCard
                key={district.id}
                district={district}
              />
            ))}
          </div>
        ) : null}

        {!loading && districtData.length > 0 && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs leading-5 text-ink-secondary">
              District totals are calculated by linking
              CaseMaster records to police stations and
              DistrictID values. Resolved cases exclude
              statuses classified as Under Investigation,
              Undetected, Pending or Unresolved. Heinous
              offences are records where GravityOffenceID
              equals 1. The records are synthetic
              demonstration data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function normalizeDistricts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
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

function normalizeDistrictAnalytics(
  response,
  fallbackDistrict,
) {
  const data =
    response?.data ??
    response ??
    {};

  const kpis =
    data.kpis ??
    data.summary ??
    {};

  const statuses = normalizeArray(
    data.statuses ??
      data.casesByStatus ??
      data.statusDistribution,
  );

  const totalCases = toNumber(
    kpis.totalCases ??
      data.totalCases,
  );

  const unresolvedCases = statuses
    .filter((status) =>
      isUnresolvedStatus(
        status.name ??
          status.statusName ??
          status.CaseStatusName,
      ),
    )
    .reduce(
      (total, status) =>
        total +
        toNumber(
          status.count ??
            status.value ??
            status.totalCases,
        ),
      0,
    );

  const resolvedCases = Math.max(
    totalCases - unresolvedCases,
    0,
  );

  const heinousCases = toNumber(
    kpis.heinousOffences ??
      kpis.severeCases ??
      kpis.highRiskCases ??
      data.heinousOffences,
  );

  const crimeTypes = normalizeArray(
    data.crimeTypes ??
      data.topCrimeTypes ??
      data.categoryDistribution,
  );

  const leadingCrime =
    crimeTypes.length > 0
      ? [...crimeTypes].sort(
          (first, second) =>
            toNumber(
              second.count ??
                second.value,
            ) -
            toNumber(
              first.count ??
                first.value,
            ),
        )[0]
      : null;

  return {
    id: String(
      data.district?.DistrictID ??
        data.district?.districtId ??
        data.districtId ??
        fallbackDistrict.id,
    ),

    name:
      data.district?.DistrictName ??
      data.district?.districtName ??
      data.districtName ??
      fallbackDistrict.name,

    totalCases,
    resolvedCases,
    unresolvedCases,
    heinousCases,

    policeStations: toNumber(
      kpis.policeStations ??
        data.policeStations,
    ),

    officers: toNumber(
      kpis.officers ??
        data.officers,
    ),

    resolutionRate: calculatePercentage(
      resolvedCases,
      totalCases,
    ),

    heinousRate: calculatePercentage(
      heinousCases,
      totalCases,
    ),

    leadingCrime:
      leadingCrime?.name ??
      leadingCrime?.crimeHeadName ??
      leadingCrime?.CrimeGroupName ??
      "Not available",

    leadingCrimeCount: toNumber(
      leadingCrime?.count ??
        leadingCrime?.value,
    ),
  };
}

function isUnresolvedStatus(value) {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    status.includes("under investigation") ||
    status.includes("undetected") ||
    status.includes("pending") ||
    status.includes("unresolved")
  );
}

function DistrictCard({ district }) {
  const { t } = useI18n();

  return (
    <article className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-white">
          {district.name}
        </h2>

        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
          {district.resolutionRate}% {t("pages.districts.resolved")}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <DataRow
          label={t("pages.districts.totalCases")}
          value={formatNumber(
            district.totalCases,
          )}
        />

        <DataRow
          label={t("pages.districts.resolved")}
          value={formatNumber(
            district.resolvedCases,
          )}
        />

        <DataRow
          label={t("pages.districts.unresolved")}
          value={formatNumber(
            district.unresolvedCases,
          )}
        />

        <DataRow
          label={t("pages.districts.heinousOffences")}
          value={formatNumber(
            district.heinousCases,
          )}
        />

        <DataRow
          label={t("pages.districts.heinousShare")}
          value={`${district.heinousRate}%`}
        />

        <DataRow
          label={t("pages.districts.policeStations")}
          value={formatNumber(
            district.policeStations,
          )}
        />

        <DataRow
          label={t("pages.districts.officers")}
          value={formatNumber(
            district.officers,
          )}
        />
      </div>

      <div className="mt-5 rounded-xl bg-surface p-3">
        <p className="text-xs text-ink-muted">
          {t("pages.districts.leadingCrime")}
        </p>

        <p className="mt-1 text-sm font-semibold text-white">
          {district.leadingCrime}
        </p>

        <p className="mt-1 text-xs text-ink-secondary">
          {formatNumber(
            district.leadingCrimeCount,
          )}{" "}
          {t("pages.districts.registeredCases")}
        </p>
      </div>
    </article>
  );
}

function Summary({ title, value }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-secondary">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-secondary">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

function DistrictLoading() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-edge bg-surface p-5">
      <p className="text-sm text-ink-secondary">
        Loading district...
      </p>
    </div>
  );
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
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

export default DistrictAnalysis;