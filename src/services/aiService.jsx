export async function askCrimeAssistant(question) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    summary:
      "The requested crime records were analysed successfully. Three matching records were found in the current dataset.",
    sql: `
SELECT
    case_number,
    district_name,
    police_station_name,
    registration_date
FROM CaseMaster
WHERE district_name = 'Bengaluru'
ORDER BY registration_date DESC;
    `.trim(),
    count: 3,
    confidence: "High",
    basis:
      "Direct table aggregation against the loaded synthetic FIR records.",
    entities: [
      "Bengaluru Urban",
      "Indiranagar Police Station",
      "Koramangala Police Station",
      "Whitefield Police Station",
    ],
    citations: [
      "CaseMaster.district_name = 'Bengaluru Urban'",
      "FIR-2026-1041",
      "FIR-2026-1028",
      "FIR-2026-0997",
    ],
    rows: [
      {
        case_number: "FIR-2026-1041",
        district_name: "Bengaluru Urban",
        police_station_name: "Indiranagar",
        registration_date: "2026-07-18",
      },
      {
        case_number: "FIR-2026-1028",
        district_name: "Bengaluru Urban",
        police_station_name: "Koramangala",
        registration_date: "2026-07-16",
      },
      {
        case_number: "FIR-2026-0997",
        district_name: "Bengaluru Urban",
        police_station_name: "Whitefield",
        registration_date: "2026-07-12",
      },
    ],
    question,
  };
}