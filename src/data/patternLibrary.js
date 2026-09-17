export const patternLibraryData = [
  {
    id: "pattern-101",
    name: "Night-time Two-wheeler Theft Ring",
    type: "Recurring",
    description:
      "Coordinated vehicle thefts registered between 22:00–04:00 across adjacent police station limits, sharing the same accused core in FIR records.",
    confidence: 92,
    linkedCases: ["FIR-2026-1041", "FIR-2026-1028", "FIR-2026-0997"],
    entities: ["Ravi Kumar", "Manoj S", "Sameer Khan"],
    primaryDistrict: "Bengaluru Urban",
    trend: "Increasing",
    caseCount: 3,
    lastObserved: "2026-05-18",
  },
  {
    id: "pattern-102",
    name: "Cyber Fraud Credential Phishing Cluster",
    type: "Recurring",
    description:
      "Online fraud FIRs sharing identical phishing infrastructure indicators and account endpoints across multiple complainants.",
    confidence: 87,
    linkedCases: ["FIR-2026-1120", "FIR-2026-1104"],
    entities: ["Anil Das", "Sameer Khan"],
    primaryDistrict: "Bengaluru Urban",
    trend: "Increasing",
    caseCount: 2,
    lastObserved: "2026-05-02",
  },
  {
    id: "pattern-103",
    name: "Cross-district Burglary Team Movement",
    type: "Suspicious",
    description:
      "Housebreak incidents in Mysuru, Hubballi-Dharwad and Mangaluru with overlapping accused identifiers indicative of a travelling crew.",
    confidence: 78,
    linkedCases: ["FIR-2026-0881", "FIR-2026-0845"],
    entities: ["Ravi Kumar", "Unknown accomplice #417"],
    primaryDistrict: "Mysuru",
    trend: "Expanding",
    caseCount: 2,
    lastObserved: "2026-04-27",
  },
  {
    id: "pattern-104",
    name: "Spike: Weekend Assault in Central District",
    type: "Trend",
    description:
      "Assault registrations concentrated on weekend evenings near central police station limits, above the three-month district average.",
    confidence: 64,
    linkedCases: ["FIR-2026-0763"],
    entities: [],
    primaryDistrict: "Mysuru",
    trend: "Elevated",
    caseCount: 1,
    lastObserved: "2026-04-11",
  },
  {
    id: "pattern-105",
    name: "Serial Property Crime — Same Modus Operandi",
    type: "Recurring",
    description:
      "Property crimes logged with identical modus operandi codes and similar victim profiles, suggesting repeated targeting by a linked group.",
    confidence: 95,
    linkedCases: ["FIR-2026-1201", "FIR-2026-0944", "FIR-2026-0912"],
    entities: ["Anil Das"],
    primaryDistrict: "Mangaluru",
    trend: "Stable",
    caseCount: 3,
    lastObserved: "2026-05-22",
  },
  {
    id: "pattern-106",
    name: "Emerging: Ride-share Fraud Accounts",
    type: "Suspicious",
    description:
      "Fraud complaints referencing newly created ride-share accounts tied to a shared device fingerprint; low volume but accelerating.",
    confidence: 55,
    linkedCases: ["FIR-2026-1140"],
    entities: ["Unknown digital identity"],
    primaryDistrict: "Bengaluru Urban",
    trend: "Emerging",
    caseCount: 1,
    lastObserved: "2026-05-30",
  },
];

export function getPatternById(id) {
  return (
    patternLibraryData.find(
      (pattern) => pattern.id === id,
    ) ?? null
  );
}

export function suggestSimilarCases(pattern) {
  const linked = pattern.linkedCases ?? [];
  return linked.map((caseNumber, index) => ({
    caseNo: caseNumber,
    matchScore:
      pattern.confidence - index * 6,
    sharedEntities: pattern.entities?.slice(0, 2) ?? [],
  }));
}