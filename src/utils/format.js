export function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export function formatNumber(value) {
  return toNumber(value).toLocaleString("en-IN");
}

export function calculatePercentage(value, total) {
  if (!toNumber(total)) {
    return "0.0";
  }

  return (
    (toNumber(value) / toNumber(total)) *
    100
  ).toFixed(1);
}

export function normalizeSeverity(value) {
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

export function severityRank(severity) {
  const ranks = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return ranks[severity] ?? 0;
}
