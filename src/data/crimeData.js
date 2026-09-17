export const crimeCases = [
  {
    id: 1,
    crimeNo: "104430006202600001",
    caseNo: "202600001",
    date: "2026-01-12",
    district: "Bengaluru Urban",
    policeStation: "Indiranagar",
    crimeHead: "Theft",
    crimeSubHead: "Vehicle Theft",
    status: "Under Investigation",
    gravity: "Medium",
    latitude: 12.9784,
    longitude: 77.6408,
    accused: ["Ravi Kumar"],
    victims: ["Arjun Rao"],
    sections: ["IPC 379"],
  },
  {
    id: 2,
    crimeNo: "104430011202600018",
    caseNo: "202600018",
    date: "2026-02-03",
    district: "Bengaluru Urban",
    policeStation: "Koramangala",
    crimeHead: "Cyber Crime",
    crimeSubHead: "Online Fraud",
    status: "Chargesheet Filed",
    gravity: "High",
    latitude: 12.9352,
    longitude: 77.6245,
    accused: ["Sameer Khan", "Anil Das"],
    victims: ["Neha Sharma"],
    sections: ["IPC 420", "IT Act 66D"],
  },
  {
    id: 3,
    crimeNo: "104570004202600023",
    caseNo: "202600023",
    date: "2026-02-18",
    district: "Mysuru",
    policeStation: "Nazarbad",
    crimeHead: "Robbery",
    crimeSubHead: "Armed Robbery",
    status: "Under Investigation",
    gravity: "High",
    latitude: 12.3051,
    longitude: 76.6551,
    accused: ["Ravi Kumar", "Manoj S"],
    victims: ["Vijay Patel"],
    sections: ["IPC 392"],
  },
  {
    id: 4,
    crimeNo: "104600009202600031",
    caseNo: "202600031",
    date: "2026-03-05",
    district: "Mangaluru",
    policeStation: "Kadri",
    crimeHead: "Assault",
    crimeSubHead: "Serious Assault",
    status: "Arrest Made",
    gravity: "High",
    latitude: 12.8877,
    longitude: 74.8424,
    accused: ["Anil Das"],
    victims: ["Kiran Shetty"],
    sections: ["IPC 307"],
  },
  {
    id: 5,
    crimeNo: "104530015202600044",
    caseNo: "202600044",
    date: "2026-03-19",
    district: "Hubballi-Dharwad",
    policeStation: "Vidyanagar",
    crimeHead: "Theft",
    crimeSubHead: "House Theft",
    status: "Closed",
    gravity: "Medium",
    latitude: 15.3647,
    longitude: 75.124,
    accused: ["Ravi Kumar"],
    victims: ["Mahesh Kulkarni"],
    sections: ["IPC 380"],
  },
  {
    id: 6,
    crimeNo: "104430021202600052",
    caseNo: "202600052",
    date: "2026-04-02",
    district: "Bengaluru Urban",
    policeStation: "Whitefield",
    crimeHead: "Cyber Crime",
    crimeSubHead: "Identity Theft",
    status: "Under Investigation",
    gravity: "Medium",
    latitude: 12.9698,
    longitude: 77.75,
    accused: ["Sameer Khan"],
    victims: ["Priya Nair"],
    sections: ["IT Act 66C"],
  },
];

export const districtSummary = [
  {
    district: "Bengaluru Urban",
    cases: 1248,
    solved: 824,
    highRisk: 173,
    stations: 42,
  },
  {
    district: "Mysuru",
    cases: 746,
    solved: 518,
    highRisk: 91,
    stations: 25,
  },
  {
    district: "Mangaluru",
    cases: 592,
    solved: 433,
    highRisk: 62,
    stations: 20,
  },
  {
    district: "Hubballi-Dharwad",
    cases: 538,
    solved: 362,
    highRisk: 71,
    stations: 18,
  },
];

export const monthlyCrimeTrend = [
  { month: "Jan", cases: 320, solved: 213 },
  { month: "Feb", cases: 385, solved: 248 },
  { month: "Mar", cases: 412, solved: 277 },
  { month: "Apr", cases: 374, solved: 259 },
  { month: "May", cases: 448, solved: 301 },
  { month: "Jun", cases: 426, solved: 294 },
];

export const crimeCategoryData = [
  { name: "Theft", value: 940 },
  { name: "Cyber Crime", value: 624 },
  { name: "Assault", value: 483 },
  { name: "Robbery", value: 297 },
  { name: "Other", value: 416 },
];

export const networkNodes = [
  {
    data: {
      id: "ravi",
      label: "Ravi Kumar",
      type: "accused",
      risk: "high",
    },
  },
  {
    data: {
      id: "sameer",
      label: "Sameer Khan",
      type: "accused",
      risk: "high",
    },
  },
  {
    data: {
      id: "anil",
      label: "Anil Das",
      type: "accused",
      risk: "medium",
    },
  },
  {
    data: {
      id: "manoj",
      label: "Manoj S",
      type: "accused",
      risk: "medium",
    },
  },

  {
    data: {
      id: "case2",
      label: "FIR 202600018",
      type: "case",
    },
  },
  {
    data: {
      id: "case3",
      label: "FIR 202600023",
      type: "case",
    },
  },
  {
    data: {
      id: "case4",
      label: "FIR 202600031",
      type: "case",
    },
  },
  {
    data: {
      id: "case5",
      label: "FIR 202600044",
      type: "case",
    },
  },

  {
    data: {
      id: "bengaluru",
      label: "Bengaluru Urban",
      type: "district",
    },
  },
  {
    data: {
      id: "mysuru",
      label: "Mysuru",
      type: "district",
    },
  },
  {
    data: {
      id: "mangaluru",
      label: "Mangaluru",
      type: "district",
    },
  },
];

export const networkEdges = [
  {
    data: {
      id: "e1",
      source: "sameer",
      target: "case2",
      relation: "accused in",
    },
  },
  {
    data: {
      id: "e2",
      source: "anil",
      target: "case2",
      relation: "co-accused",
    },
  },
  {
    data: {
      id: "e3",
      source: "ravi",
      target: "case3",
      relation: "accused in",
    },
  },
  {
    data: {
      id: "e4",
      source: "manoj",
      target: "case3",
      relation: "co-accused",
    },
  },
  {
    data: {
      id: "e5",
      source: "anil",
      target: "case4",
      relation: "accused in",
    },
  },
  {
    data: {
      id: "e6",
      source: "ravi",
      target: "case5",
      relation: "accused in",
    },
  },

  {
    data: {
      id: "e7",
      source: "case2",
      target: "bengaluru",
      relation: "registered in",
    },
  },
  {
    data: {
      id: "e8",
      source: "case3",
      target: "mysuru",
      relation: "registered in",
    },
  },
  {
    data: {
      id: "e9",
      source: "case4",
      target: "mangaluru",
      relation: "registered in",
    },
  },
  {
    data: {
      id: "e10",
      source: "case5",
      target: "bengaluru",
      relation: "linked district",
    },
  },
];

export const predictions = [
  {
    district: "Bengaluru Urban",
    category: "Cyber Crime",
    predictedCases: 168,
    previousCases: 139,
    riskScore: 87,
    trend: "Increasing",
    confidence: 91,
  },
  {
    district: "Mysuru",
    category: "Robbery",
    predictedCases: 83,
    previousCases: 72,
    riskScore: 74,
    trend: "Increasing",
    confidence: 85,
  },
  {
    district: "Mangaluru",
    category: "Assault",
    predictedCases: 61,
    previousCases: 65,
    riskScore: 52,
    trend: "Stable",
    confidence: 81,
  },
  {
    district: "Hubballi-Dharwad",
    category: "Theft",
    predictedCases: 97,
    previousCases: 104,
    riskScore: 46,
    trend: "Decreasing",
    confidence: 79,
  },
];

export const alertsData = [
  {
    id: 1,
    type: "Critical",
    title: "Cybercrime surge detected",
    description:
      "Cybercrime registrations in Bengaluru Urban increased significantly compared with the previous period.",
    district: "Bengaluru Urban",
    time: "10 minutes ago",
    status: "New",
  },
  {
    id: 2,
    type: "High",
    title: "Repeat offender linked across districts",
    description:
      "An accused person appears in FIR records registered in Bengaluru Urban, Mysuru and Hubballi-Dharwad.",
    district: "Multiple districts",
    time: "38 minutes ago",
    status: "Reviewing",
  },
  {
    id: 3,
    type: "Medium",
    title: "Robbery hotspot emerging",
    description:
      "A cluster of robbery incidents has been identified around central Mysuru.",
    district: "Mysuru",
    time: "2 hours ago",
    status: "New",
  },
  {
    id: 4,
    type: "Low",
    title: "Case closure rate improved",
    description:
      "Mangaluru reported an improvement in resolved cases during the current analysis period.",
    district: "Mangaluru",
    time: "5 hours ago",
    status: "Acknowledged",
  },
];

export const auditLogs = [
  {
    id: 1,
    user: "KP-Admin",
    role: "Administrator",
    action: "Viewed FIR record",
    resource: "202600018",
    timestamp: "2026-07-22 16:21",
    status: "Success",
  },
  {
    id: 2,
    user: "Investigator-104",
    role: "Investigator",
    action: "Generated AI query",
    resource: "Repeat offenders in Bengaluru",
    timestamp: "2026-07-22 16:18",
    status: "Success",
  },
  {
    id: 3,
    user: "Analyst-22",
    role: "Crime Analyst",
    action: "Exported district report",
    resource: "Mysuru District",
    timestamp: "2026-07-22 16:02",
    status: "Success",
  },
  {
    id: 4,
    user: "Investigator-117",
    role: "Investigator",
    action: "Accessed restricted case",
    resource: "202600031",
    timestamp: "2026-07-22 15:56",
    status: "Denied",
  },
  {
    id: 5,
    user: "KP-Admin",
    role: "Administrator",
    action: "Updated alert status",
    resource: "Alert #2",
    timestamp: "2026-07-22 15:45",
    status: "Success",
  },
];