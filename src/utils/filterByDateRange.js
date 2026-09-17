export function filterByDateRange(records, dateRange) {
  if (dateRange === "all") {
    return records;
  }

  const months = Number(dateRange);

  if (!Number.isFinite(months)) {
    return records;
  }

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  return records.filter((record) => {
    const recordDate = new Date(
      record.date || record.CrimeRegisteredDate
    );

    return (
      !Number.isNaN(recordDate.getTime()) &&
      recordDate >= cutoffDate
    );
  });
}