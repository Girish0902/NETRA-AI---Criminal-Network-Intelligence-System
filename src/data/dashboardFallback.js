export const dashboardFallback = {
  data: {
    kpis: {
      totalCases: 2500,
      activeInvestigations: 757,
      heinousOffences: 307,
      severeCases: 307,
      arrestLinkedCases: 1189,
      chargesheetedCases: 863,
      districtsCovered: 22,
    },
    casesByStatus: [
      { statusId: "1", statusName: "Under Investigation", count: 757 },
      { statusId: "2", statusName: "Undetected", count: 412 },
      { statusId: "3", statusName: "Chargesheet Filed", count: 863 },
      { statusId: "4", statusName: "Closed", count: 384 },
      { statusId: "5", statusName: "Sentenced", count: 84 },
    ],
    topCrimeTypes: [
      { crimeHeadId: "1", crimeHeadName: "Theft", count: 940 },
      { crimeHeadId: "2", crimeHeadName: "Cyber Crime", count: 624 },
      { crimeHeadId: "3", crimeHeadName: "Assault", count: 483 },
      { crimeHeadId: "4", crimeHeadName: "Robbery", count: 297 },
      { crimeHeadId: "5", crimeHeadName: "Other", count: 416 },
    ],
    topDistricts: [
      { districtId: "1", districtName: "Bengaluru Urban", count: 1248 },
      { districtId: "2", districtName: "Mysuru", count: 746 },
      { districtId: "3", districtName: "Mangaluru", count: 592 },
      { districtId: "4", districtName: "Hubballi-Dharwad", count: 538 },
    ],
    recentCases: [],
  },
};

export const trendsFallback = {
  data: {
    monthlyTrend: [
      { month: "2026-01", cases: 320 },
      { month: "2026-02", cases: 385 },
      { month: "2026-03", cases: 412 },
      { month: "2026-04", cases: 374 },
      { month: "2026-05", cases: 448 },
      { month: "2026-06", cases: 426 },
    ],
    crimeTypes: dashboardFallback.data.topCrimeTypes,
  },
};

export function resolveDashboardFallback() {
  return {
    dashboard: dashboardFallback,
    trends: trendsFallback,
  };
}