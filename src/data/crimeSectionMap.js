/**
 * Crime head -> commonly applicable legal sections.
 *
 * Citations are listed IPC-first, immediately followed by the equivalent
 * Bharatiya Nyaya Sanhita (BNS) provision that replaced the IPC from
 * 1 July 2024. Special statutes (NDPS, IT Act, CrPC/BNSS) are kept under
 * their own act names because BNS has no equivalent for them.
 *
 * Sources for the IPC -> BNS correspondences:
 * - Ministry of Home Affairs / UP Police IPC-BNS comparative table
 * - Bharatiya Nyaya Sanhita, 2023 (Act 45 of 2023) section list
 * - Bharatiya Nagarik Suraksha Sanhita, 2023 (Act 46 of 2023) section list
 */
export const crimeSectionMap = {
  "Vehicle theft": [
    "IPC 379",
    "BNS 303(2)",
    "IPC 411",
    "BNS 317(2)",
  ],

  "Cyber fraud": [
    "IPC 420",
    "BNS 318(4)",
    "IT Act 66C",
    "IT Act 66D",
  ],

  Assault: ["IPC 351", "BNS 131", "IPC 323", "BNS 115(2)"],

  Burglary: [
    "IPC 380",
    "BNS 305",
    "IPC 454",
    "BNS 331(3)",
    "IPC 457",
    "BNS 331(4)",
  ],

  "Chain snatching": [
    "IPC 379",
    "BNS 303(2)",
    "IPC 356",
    "BNS 304",
  ],

  "Narcotics possession": [
    "NDPS Act 1985 Sec 20",
    "NDPS Act 1985 Sec 21",
    "NDPS Act 1985 Sec 22",
  ],

  "Economic offence": [
    "IPC 420",
    "BNS 318(4)",
    "IPC 406",
    "BNS 316(2)",
    "IPC 467",
    "BNS 336(1)",
  ],

  "Public order disturbance": [
    "IPC 141",
    "BNS 189(1)",
    "IPC 147",
    "BNS 191(2)",
    "IPC 151",
    "BNS 189(5)",
  ],

  "Missing person": [
    "CrPC 174",
    "BNSS 206",
    "IPC 363",
    "BNS 137(3)",
  ],

  "Cheating / breach of trust": [
    "IPC 420",
    "BNS 318(4)",
    "IPC 406",
    "BNS 316(2)",
  ],
};

export function getSuggestedSections(crimeHead) {
  const suggestions = crimeSectionMap[crimeHead];

  return Array.isArray(suggestions) ? [...suggestions] : [];
}
