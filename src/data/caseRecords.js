export const caseRecords = [
  {
    id: "case-1041",
    caseNo: "FIR-2026-1041",
    crimeNo: "10443000620261041",
    registrationDate: "2026-04-14",
    district: "Bengaluru Urban",
    policeStation: "Indiranagar",
    crimeHead: "Vehicle Theft",
    sections: ["IPC 379", "IPC 411"],
    status: "Under Investigation",
    gravity: "High",
    summary:
      "A two-wheeler was reported stolen from a residential parking area during the night hours. Recovery efforts indicate serial theft activity across adjacent station limits.",
    accused: ["Ravi Kumar"],
    victims: ["Arjun Rao"],
    evidence: [
      {
        id: "ev-1041-01",
        name: "FIR_Indiranagar_1041.pdf",
        type: "FIR",
        size: "2.4 MB",
        uploadedBy: "Asst. SI Nalini Prasad",
        uploadedAt: "2026-04-15",
        status: "Processed",
        entities: ["Ravi Kumar", "Arjun Rao", "Indiranagar PS"],
      },
      {
        id: "ev-1041-02",
        name: "CCTV_index_week15.csv",
        type: "CCTV Log",
        size: "840 KB",
        uploadedBy: "Asst. SI Nalini Prasad",
        uploadedAt: "2026-04-17",
        status: "Processed",
        entities: ["Camera-ING-12", "22:10–23:40"],
      },
      {
        id: "ev-1041-03",
        name: "Complainant_statement.txt",
        type: "Statement",
        size: "96 KB",
        uploadedBy: "Constable Dinesh Gowda",
        uploadedAt: "2026-04-16",
        status: "Processing",
        entities: ["Arjun Rao"],
      },
    ],
    investigators: [
      { name: "Insp. Mahesh Rao", role: "Case Officer" },
      { name: "Asst. SI Nalini Prasad", role: "Investigator" },
    ],
    access: "granted",
    isOpen: true,
  },
  {
    id: "case-1028",
    caseNo: "FIR-2026-1028",
    crimeNo: "10443001120261028",
    registrationDate: "2026-04-02",
    district: "Bengaluru Urban",
    policeStation: "Koramangala",
    crimeHead: "Online Fraud",
    sections: ["IPC 420", "IT Act 66D"],
    status: "Chargesheet Filed",
    gravity: "High",
    summary:
      "Cyber fraud case involving phishing of banking credentials. Multiple complainants linked to the same phishing infrastructure.",
    accused: ["Sameer Khan", "Anil Das"],
    victims: ["Neha Sharma"],
    evidence: [
      {
        id: "ev-1028-01",
        name: "FIR_Koramangala_1028.pdf",
        type: "FIR",
        size: "3.1 MB",
        uploadedBy: "Insp. Mahesh Rao",
        uploadedAt: "2026-04-03",
        status: "Processed",
        entities: ["Sameer Khan", "Anil Das", "Neha Sharma"],
      },
    ],
    investigators: [
      { name: "Insp. Mahesh Rao", role: "Case Officer" },
    ],
    access: "granted",
    isOpen: false,
  },
  {
    id: "case-0997",
    caseNo: "FIR-2026-0997",
    crimeNo: "10443002020260997",
    registrationDate: "2026-03-21",
    district: "Bengaluru Urban",
    policeStation: "Whitefield",
    crimeHead: "Identity Theft",
    sections: ["IT Act 66C"],
    status: "Under Investigation",
    gravity: "Medium",
    summary:
      "Identity theft reported through synthetic account creation. Device fingerprint shared with other accounts under review.",
    accused: ["Sameer Khan"],
    victims: ["Priya Nair"],
    evidence: [],
    investigators: [
      { name: "Insp. Mahesh Rao", role: "Case Officer" },
    ],
    access: "requested",
    isOpen: true,
  },
  {
    id: "case-0881",
    caseNo: "FIR-2026-0881",
    crimeNo: "10457000420260881",
    registrationDate: "2026-03-05",
    district: "Mysuru",
    policeStation: "Nazarbad",
    crimeHead: "House Break-In",
    sections: ["IPC 457", "IPC 380"],
    status: "Under Investigation",
    gravity: "High",
    summary:
      "House break-in with patterns indicating cross-district travelling crew involvement.",
    accused: ["Ravi Kumar", "Manoj S"],
    victims: ["Vijay Patel"],
    evidence: [
      {
        id: "ev-0881-01",
        name: "FIR_Nazarbad_0881.pdf",
        type: "FIR",
        size: "1.9 MB",
        uploadedBy: "Asst. SI Kavya Hegde",
        uploadedAt: "2026-03-06",
        status: "Processed",
        entities: ["Ravi Kumar", "Manoj S"],
      },
    ],
    investigators: [
      { name: "Insp. Kiran Shetty", role: "Case Officer" },
    ],
    access: "granted",
    isOpen: true,
  },
];

function caseNumberExists(caseNo) {
  const normalized = String(caseNo).trim().toUpperCase();

  return caseRecords.some(
    (record) =>
      String(record.caseNo).toUpperCase() ===
      normalized,
  );
}

function createUniqueCaseNo(candidate) {
  const requestedCaseNo =
    String(candidate || "").trim() ||
    `NETRA-${Date.now()}`;

  if (!caseNumberExists(requestedCaseNo)) {
    return requestedCaseNo;
  }

  const match = requestedCaseNo.match(
    /^(.*?)(\d+)$/,
  );

  if (match) {
    const prefix = match[1];
    const suffixText = match[2];
    const suffix = Number(suffixText);
    const modulus = 10 ** suffixText.length;

    for (
      let offset = 1;
      offset < modulus;
      offset += 1
    ) {
      const nextSuffix = String(
        (suffix + offset) % modulus,
      ).padStart(suffixText.length, "0");
      const nextCaseNo =
        `${prefix}${nextSuffix}`;

      if (!caseNumberExists(nextCaseNo)) {
        return nextCaseNo;
      }
    }
  }

  let attempt = 0;
  let fallbackCaseNo;

  do {
    attempt += 1;
    fallbackCaseNo =
      `${requestedCaseNo}-${Date.now()}-${attempt}`;
  } while (caseNumberExists(fallbackCaseNo));

  return fallbackCaseNo;
}

function cloneRecordItems(items) {
  return Array.isArray(items)
    ? items.map((item) =>
        item && typeof item === "object"
          ? { ...item }
          : item,
      )
    : [];
}

export function createCase(record = {}) {
  const caseNo = createUniqueCaseNo(record.caseNo);

  const createdRecord = {
    id:
      record.id ??
      `case-${caseNo
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
    ...record,
    caseNo,
    crimeNo: record.crimeNo ?? caseNo,
    registrationDate:
      record.registrationDate ??
      new Date().toISOString().slice(0, 10),
    district: record.district ?? "Unknown",
    policeStation:
      record.policeStation ?? "Unknown",
    crimeHead: record.crimeHead ?? "Unknown",
    gravity: record.gravity ?? "Unknown",
    status: record.status ?? "Unknown",
    summary: record.summary ?? "",
    sections: cloneRecordItems(record.sections),
    accused: cloneRecordItems(record.accused),
    victims: cloneRecordItems(record.victims),
    investigators: cloneRecordItems(
      record.investigators,
    ),
    evidence: cloneRecordItems(record.evidence),
    access: record.access ?? "granted",
    createdBy:
      record.createdBy &&
      typeof record.createdBy === "object"
        ? { ...record.createdBy }
        : record.createdBy ?? null,
    createdAt:
      record.createdAt ??
      new Date().toISOString(),
    isOpen: record.isOpen ?? true,
  };

  // The local API is read-only, so new records last for this session only.
  caseRecords.unshift(createdRecord);

  return createdRecord;
}

export function getCaseByNumber(caseNo) {
  if (!caseNo) {
    return null;
  }

  const normalized = String(caseNo).toUpperCase();

  return (
    caseRecords.find(
      (record) =>
        record.caseNo.toUpperCase() ===
        normalized,
    ) ?? null
  );
}

export function evidenceByCaseId(caseId) {
  const record = caseRecords.find(
    (item) => item.id === caseId,
  );

  return record?.evidence ?? [];
}

export function resolveCaseId(caseNoOrId) {
  const byNumber = getCaseByNumber(caseNoOrId);

  if (byNumber) {
    return byNumber.id;
  }

  const byId = caseRecords.find(
    (record) => record.id === caseNoOrId,
  );

  return byId?.id ?? null;
}