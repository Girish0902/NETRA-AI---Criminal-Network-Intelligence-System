import {
  Bell,
  Check,
  CircleAlert,
  Filter,
  ShieldAlert,
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

const STORAGE_KEY = "NETRA-acknowledged-alerts";

function Alerts() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [acknowledgedIds, setAcknowledgedIds] =
    useState(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]",
        );

        return Array.isArray(saved)
          ? saved.map(String)
          : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      setLoading(true);
      setError("");

      try {
        const response = await api.alerts();

        if (!active) {
          return;
        }

        const source =
          response?.alerts ??
          response?.data?.alerts ??
          response?.data ??
          response ??
          [];

        setAlerts(normalizeAlerts(source));
      } catch (loadError) {
        console.error(
          "Unable to load intelligence alerts:",
          loadError,
        );

        if (!active) {
          return;
        }

        setAlerts([]);

        setError(
          loadError?.message ??
            "Unable to load intelligence alerts.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const alertsWithStatus = useMemo(() => {
    return alerts.map((alert) => ({
      ...alert,

      status: acknowledgedIds.includes(
        String(alert.id),
      )
        ? "Acknowledged"
        : "New",
    }));
  }, [alerts, acknowledgedIds]);

  const filterOptions = useMemo(() => {
    const severities = [
      ...new Set(
        alertsWithStatus
          .map((alert) => alert.severity)
          .filter(Boolean),
      ),
    ];

    return ["All", ...severities];
  }, [alertsWithStatus]);

  const filteredAlerts = useMemo(() => {
    if (filter === "All") {
      return alertsWithStatus;
    }

    return alertsWithStatus.filter(
      (alert) => alert.severity === filter,
    );
  }, [alertsWithStatus, filter]);

  const criticalCount = alertsWithStatus.filter(
    (alert) => alert.severity === "Critical",
  ).length;

  const newCount = alertsWithStatus.filter(
    (alert) => alert.status === "New",
  ).length;

  const acknowledgedCount =
    alertsWithStatus.filter(
      (alert) =>
        alert.status === "Acknowledged",
    ).length;

  const acknowledgeAlert = (id) => {
    const normalizedId = String(id);

    

    const selectedAlert = alerts.find(
        (alert) => String(alert.id) === normalizedId,
      );

      setAcknowledgedIds((current) => {
      if (current.includes(normalizedId)) {
        return current;
      }

      window.dispatchEvent(
     new CustomEvent(
    "NETRA-alert-status-updated",
     ),
     );

      const updated = [
        ...current,
        normalizedId,
      ];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated),
      );

      addAuditLog({
         action: "Acknowledged intelligence alert",
        resource:
            selectedAlert?.title ??
            normalizedId,
        category: "Alert",
        status: "Success",
      });

      return updated;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Bell}
        title={t("pages.alerts.title")}
        description={t("pages.alerts.description")}
        action={
          <div className="flex items-center gap-2">
            <Filter
              size={17}
              className="text-ink-secondary"
            />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              className="rounded-xl border border-edge bg-canvas/70 px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
            >
              {filterOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option === "All"
                    ? "All alerts"
                    : `${option} alerts`}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-critical-soft">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Summary
            title={t("pages.alerts.allAlerts")}
            value={
              loading
                ? "..."
                : formatNumber(
                    alertsWithStatus.length,
                  )
            }
          />

          <Summary
            title={t("pages.alerts.critical")}
            value={
              loading
                ? "..."
                : formatNumber(criticalCount)
            }
          />

          <Summary
            title={t("pages.alerts.new")}
            value={
              loading
                ? "..."
                : formatNumber(newCount)
            }
          />

          <Summary
            title={t("pages.alerts.acknowledged")}
            value={
              loading
                ? "..."
                : formatNumber(
                    acknowledgedCount,
                  )
            }
          />
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-edge px-5 py-5">
            <div>
              <h2 className="font-semibold text-ink">
                Alert feed
              </h2>

              <p className="mt-1 text-sm text-ink-secondary">
                Latest intelligence generated from
                dataset records
              </p>
            </div>

            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
              {loading
                ? "Loading..."
                : `${formatNumber(
                    filteredAlerts.length,
                  )} shown`}
            </span>
          </div>

          <div className="space-y-3 p-5">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <p className="text-sm text-ink-secondary">
                  Generating intelligence alerts
                  from the dataset...
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <Bell
                    size={30}
                    className="mx-auto text-slate-600"
                  />

                  <p className="mt-3 text-sm text-ink-secondary">
                    No matching alerts are
                    available.
                  </p>
                </div>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() =>
                    acknowledgeAlert(alert.id)
                  }
                />
              ))
            )}
          </div>
        </section>

        {!loading &&
          alertsWithStatus.length > 0 && (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs leading-5 text-ink-secondary">
                Alerts are generated from district
                case concentrations and repeat-person
                patterns found in the loaded synthetic
                FIR dataset. Severity values are
                supplied by the backend alert-analysis
                endpoint. Acknowledgement status is
                stored locally for this demonstration.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

function normalizeAlerts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((alert, index) => ({
      id: String(
        alert.id ??
          alert.alertId ??
          `alert-${index}`,
      ),

      title:
        alert.title ??
        alert.alertTitle ??
        "Dataset intelligence alert",

      description:
        alert.description ??
        alert.message ??
        "No additional dataset details are available.",

      severity: normalizeSeverity(
        alert.severity ??
          alert.priority ??
          alert.level,
      ),

      type: normalizeType(
        alert.type ??
          alert.category,
      ),

      district:
        alert.districtName ??
        alert.district ??
        null,

      caseCount: toNumber(
        alert.caseCount ??
          alert.count ??
          alert.totalCases,
      ),
    }))
    .sort(
      (first, second) =>
        severityRank(second.severity) -
        severityRank(first.severity),
    );
}

function normalizeSeverity(value) {
  const severity = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    severity === "critical" ||
    severity === "severe"
  ) {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  if (
    severity === "medium" ||
    severity === "moderate"
  ) {
    return "Medium";
  }

  return "Low";
}

function normalizeType(value) {
  const type = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    type.includes("offender") ||
    type.includes("person")
  ) {
    return "Repeat offender";
  }

  if (
    type.includes("hotspot") ||
    type.includes("district")
  ) {
    return "District hotspot";
  }

  return "Intelligence pattern";
}

function severityRank(severity) {
  const ranks = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return ranks[severity] ?? 0;
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

function AlertCard({
  alert,
  onAcknowledge,
}) {
  const severityClasses = {
    Critical:
      "border-critical/40 bg-critical/10 text-critical-soft",

    High:
      "border-critical/30 bg-critical/10 text-critical-soft",

    Medium:
      "border-watch/40 bg-watch/10 text-watch-soft",

    Low:
      "border-primary/40 bg-primary/10 text-primary-hover",
  };

  const styles =
    severityClasses[alert.severity] ??
    severityClasses.Low;

  return (
    <article className="rounded-2xl border border-edge bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${styles}`}
          >
            {alert.severity === "Critical" ||
            alert.severity === "High" ? (
              <ShieldAlert size={22} />
            ) : (
              <CircleAlert size={22} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-semibold text-ink">
                {alert.title}
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
              >
                {alert.severity}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  alert.status === "New"
                    ? "border border-primary/40 bg-primary/10 text-primary-hover"
                    : "border border-resolved/40 bg-resolved/10 text-resolved-soft"
                }`}
              >
                {alert.status}
              </span>
            </div>

            <p className="mt-3 max-w-4xl text-sm leading-6 text-ink-secondary">
              {alert.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
              <span>{alert.type}</span>

              {alert.district && (
                <span>
                  District: {alert.district}
                </span>
              )}

              {alert.caseCount > 0 && (
                <span>
                  Cases:{" "}
                  {formatNumber(
                    alert.caseCount,
                  )}
                </span>
              )}

              <span>
                Status: {alert.status}
              </span>
            </div>
          </div>
        </div>

        {alert.status !== "Acknowledged" && (
          <button
            type="button"
            onClick={onAcknowledge}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-secondary/30 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-secondary hover:text-violet-200"
          >
            <Check size={17} />
            Acknowledge
          </button>
        )}
      </div>
    </article>
  );
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

export default Alerts;