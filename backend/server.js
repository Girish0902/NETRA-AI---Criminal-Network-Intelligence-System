import express from "express";
import cors from "cors";
import compression from "compression";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const PORT = Number(process.env.PORT || 5000);

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,https://netra-snowy.vercel.app"
).split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.use(compression());
app.use(express.json());

function readCsv(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const text = fs.readFileSync(filePath, "utf8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
}

function n(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function groupCount(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (key === undefined || key === null || key === "") continue;
    counts.set(String(key), (counts.get(String(key)) || 0) + 1);
  }
  return counts;
}

function topEntries(counts, limit = 10) {
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const db = {
  cases: readCsv("CaseMaster.csv"),
  districts: readCsv("District.csv"),
  units: readCsv("Unit.csv"),
  crimeHeads: readCsv("CrimeHead.csv"),
  crimeSubHeads: readCsv("CrimeSubHead.csv"),
  statuses: readCsv("CaseStatusMaster.csv"),
  gravity: readCsv("GravityOffence.csv"),
  accused: readCsv("Accused.csv"),
  victims: readCsv("Victim.csv"),
  complainants: readCsv("ComplainantDetails.csv"),
  arrests: readCsv("ArrestSurrender.csv"),
  chargesheets: readCsv("ChargesheetDetails.csv"),
  persons: readCsv("PersonMaster_EXT.csv"),
  moMaster: readCsv("ModusOperandiMaster_EXT.csv"),
  caseMo: readCsv("CaseModusOperandi_EXT.csv"),
  socio: readCsv("DistrictSocioEconomic_EXT.csv"),
  employees: readCsv("Employee.csv"),
  courts: readCsv("Court.csv")
};

const index = {
  districts: new Map(db.districts.map(x => [String(x.DistrictID), x])),
  units: new Map(db.units.map(x => [String(x.UnitID), x])),
  heads: new Map(db.crimeHeads.map(x => [String(x.CrimeHeadID), x])),
  subHeads: new Map(db.crimeSubHeads.map(x => [String(x.CrimeSubHeadID), x])),
  statuses: new Map(db.statuses.map(x => [String(x.CaseStatusID), x])),
  gravity: new Map(db.gravity.map(x => [String(x.GravityOffenceID), x])),
  persons: new Map(db.persons.map(x => [String(x.PersonMasterID), x])),
  mo: new Map(db.moMaster.map(x => [String(x.MOID), x])),
  socio: new Map(db.socio.map(x => [String(x.DistrictID), x]))
};

const enrichedCaseCache = db.cases.map(enrichCase);

const accusedByCaseCache = new Map();
for (const a of db.accused) {
  const caseId = String(a.CaseMasterID);
  if (!accusedByCaseCache.has(caseId)) accusedByCaseCache.set(caseId, []);
  accusedByCaseCache.get(caseId).push(a);
}

const resourcesCache = buildResourceTables();

let lastCaseMasterId = db.cases.reduce(
  (max, row) => Math.max(max, n(row.CaseMasterID)),
  0
);

function normalizeName(value) {
  return String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findMasterByName(rows, nameField, value) {
  const needle = normalizeName(value);
  if (!needle) return null;
  return (
    rows.find((row) => normalizeName(row[nameField]) === needle) || null
  );
}

function findMasterByPartialName(rows, nameField, value) {
  const needle = normalizeName(value);
  if (!needle) return null;
  return (
    rows.find((row) => {
      const candidate = normalizeName(row[nameField]);
      return candidate && (candidate.includes(needle) || needle.includes(candidate));
    }) || null
  );
}

function resolveGravityRow(value) {
  const exact = findMasterByName(db.gravity, "LookupValue", value);
  if (exact) return exact;

  const needle = normalizeName(value);
  if (needle && /high|severe|critical/.test(needle)) {
    return index.gravity.get("1") || db.gravity[0] || null;
  }

  if (needle && /medium|moderate/.test(needle)) {
    return index.gravity.get("2") || db.gravity[1] || null;
  }

  return null;
}

function caseNoTaken(candidate) {
  const needle = String(candidate || "").trim().toLowerCase();
  if (!needle) return true;

  return db.cases.some(
    (row) => normalizeName(row.CaseNo) === needle
  );
}

function nextCaseNo(candidate) {
  const requested = String(
    candidate === undefined || candidate === null ? "" : candidate
  )
    .trim();

  if (requested && !caseNoTaken(requested)) {
    return requested;
  }

  const match = requested.match(/^(.*?)(\d+)$/);

  if (match) {
    const prefix = match[1];
    const suffixText = match[2];
    const suffix = Number(suffixText);
    const modulus = 10 ** suffixText.length;

    for (let offset = 1; offset < modulus; offset += 1) {
      const nextSuffix = String((suffix + offset) % modulus).padStart(
        suffixText.length,
        "0"
      );
      const nextCandidate = `${prefix}${nextSuffix}`;

      if (!caseNoTaken(nextCandidate)) {
        return nextCandidate;
      }
    }
  }

  const base = requested || `NETRA-${new Date().getFullYear()}`;
  let attempt = 0;
  let fallbackCaseNo;

  do {
    attempt += 1;
    fallbackCaseNo = `${base}-${Date.now()}-${attempt}`;
  } while (caseNoTaken(fallbackCaseNo));

  return fallbackCaseNo;
}

function formatDateOnly(value) {
  const date = isoDate(value) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function caseDistrictId(c) {
  if (c.RegisteredDistrictID) {
    return String(c.RegisteredDistrictID);
  }
  return String(index.units.get(String(c.PoliceStationID))?.DistrictID || "");
}

function enrichCase(c) {
  const districtId = caseDistrictId(c);
  return {
    ...c,
    districtId,
    districtName: c.districtName || index.districts.get(districtId)?.DistrictName || "Unknown",
    policeStationName: c.policeStationName || index.units.get(String(c.PoliceStationID))?.UnitName || "Unknown",
    crimeHeadName: c.crimeHeadName || index.heads.get(String(c.CrimeMajorHeadID))?.CrimeGroupName || "Unknown",
    crimeSubHeadName:
      c.crimeSubHeadName || index.subHeads.get(String(c.CrimeMinorHeadID))?.CrimeHeadName || "Unknown",
    statusName: c.statusName || index.statuses.get(String(c.CaseStatusID))?.CaseStatusName || "Unknown",
    gravityName: c.gravityName || index.gravity.get(String(c.GravityOffenceID))?.LookupValue || "Unknown"
  };
}

function filterCases(req) {
  let rows = db.cases;
  const { districtId, crimeHeadId, statusId, from, to } = req.query;

  if (districtId) rows = rows.filter(c => caseDistrictId(c) === String(districtId));
  if (crimeHeadId) rows = rows.filter(c => String(c.CrimeMajorHeadID) === String(crimeHeadId));
  if (statusId) rows = rows.filter(c => String(c.CaseStatusID) === String(statusId));

  const fromDate = isoDate(from);
  const toDate = isoDate(to);
  if (fromDate) rows = rows.filter(c => (isoDate(c.CrimeRegisteredDate)?.getTime() || 0) >= fromDate.getTime());
  if (toDate) rows = rows.filter(c => (isoDate(c.CrimeRegisteredDate)?.getTime() || 0) <= toDate.getTime());

  return rows;
}

function buildResourceTables() {
  const csvFiles = fs
    .readdirSync(DATA_DIR)
    .filter((fileName) =>
      fileName.toLowerCase().endsWith(".csv"),
    )
    .sort((first, second) =>
      first.localeCompare(second),
    );

  return csvFiles.map((fileName) => {
    const rows = readCsv(fileName);

    const columns =
      rows.length > 0
        ? [
            ...new Set(
              rows.flatMap((row) =>
                Object.keys(row),
              ),
            ),
          ]
        : [];

    const nonEmptyCounts = {};

    columns.forEach((column) => {
      nonEmptyCounts[column] = rows.filter(
        (row) =>
          row[column] !== undefined &&
          row[column] !== null &&
          String(row[column]).trim() !== "",
      ).length;
    });

    return {
      id: fileName.replace(/\.csv$/i, ""),
      fileName,
      tableName: fileName.replace(/\.csv$/i, ""),
      recordCount: rows.length,
      columnCount: columns.length,
      columns,
      nonEmptyCounts,
    };
  });
}

function clampQueryNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min === undefined ? number : min, Math.min(max === undefined ? number : max, number));
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "NETRA AI local CSV API is running",
    caseCount: db.cases.length,
    districtCount: db.districts.length
  });
});

app.get("/api/lookups", (_req, res) => {
  res.json({
    districts: db.districts,
    crimeHeads: db.crimeHeads,
    crimeSubHeads: db.crimeSubHeads,
    statuses: db.statuses,
    gravity: db.gravity
  });
});

app.get("/api/dashboard", (req, res) => {
  const cases = filterCases(req);
  const districtCounts = groupCount(cases, caseDistrictId);
  const statusCounts = groupCount(cases, c => c.CaseStatusID);
  const headCounts = groupCount(cases, c => c.CrimeMajorHeadID);

  const arrests = new Set(db.arrests.map(a => String(a.CaseMasterID)));
  const chargesheets = new Set(db.chargesheets.map(a => String(a.CaseMasterID)));

  const recentCases = [...cases]
    .sort((a, b) => (isoDate(b.CrimeRegisteredDate)?.getTime() || 0) - (isoDate(a.CrimeRegisteredDate)?.getTime() || 0))
    .slice(0, 8)
    .map(enrichCase);


const activeInvestigations = cases.filter(
  c => String(c.CaseStatusID) === "1"
).length;

const heinousOffences = cases.filter(
  c => String(c.GravityOffenceID) === "1"
).length;

res.json({
  kpis: {
    totalCases: cases.length,

    activeInvestigations,

    heinousOffences,

    severeCases: heinousOffences,

    arrestLinkedCases: cases.filter(
      c => arrests.has(String(c.CaseMasterID))
    ).length,

    chargesheetedCases: cases.filter(
      c => chargesheets.has(String(c.CaseMasterID))
    ).length,

    districtsCovered: new Set(
      cases.map(caseDistrictId).filter(Boolean)
    ).size
  },

  casesByStatus: topEntries(statusCounts, 10).map(x => ({
    statusId: x.id,
    statusName: index.statuses.get(x.id)?.CaseStatusName || "Unknown",
    count: x.count
  })),

  topCrimeTypes: topEntries(headCounts, 8).map(x => ({
    crimeHeadId: x.id,
    crimeHeadName: index.heads.get(x.id)?.CrimeGroupName || "Unknown",
    count: x.count
  })),

  topDistricts: topEntries(districtCounts, 10).map(x => ({
    districtId: x.id,
    districtName: index.districts.get(x.id)?.DistrictName || "Unknown",
    count: x.count
  })),

  recentCases
});
});

app.get("/api/crime-trends", (req, res) => {
  const cases = filterCases(req);
  const buckets = new Map();

  for (const c of cases) {
    const d = isoDate(c.CrimeRegisteredDate);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const monthlyTrend = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const crimeTypeCounts = groupCount(cases, c => c.CrimeMajorHeadID);
  res.json({
    monthlyTrend,
    crimeTypes: topEntries(crimeTypeCounts, 12).map(x => ({
      crimeHeadId: x.id,
      crimeHeadName: index.heads.get(x.id)?.CrimeGroupName || "Unknown",
      count: x.count
    }))
  });
});

app.get("/api/hotspots", (req, res) => {
  const cases = filterCases(req)
    .filter(c => c.latitude && c.longitude && Number.isFinite(Number(c.latitude)) && Number.isFinite(Number(c.longitude)))
    .map(enrichCase);

  const points = cases.map(c => ({
  caseId: c.CaseMasterID,
  crimeNo: c.CrimeNo,
  latitude: n(c.latitude),
  longitude: n(c.longitude),
  districtId: c.districtId,
  districtName: c.districtName,
  crimeHeadId: c.CrimeMajorHeadID,
  crimeHeadName: c.crimeHeadName,
  gravityOffenceId: c.GravityOffenceID,
  gravityName: c.gravityName,
  date: c.CrimeRegisteredDate
}));

  const districtCounts = groupCount(cases, c => c.districtId);
  const clusters = topEntries(districtCounts, 31).map(x => {
    const districtCases = points.filter(p => p.districtId === x.id);
    const lat = districtCases.reduce((s, p) => s + p.latitude, 0) / districtCases.length;
    const lng = districtCases.reduce((s, p) => s + p.longitude, 0) / districtCases.length;
    return {
      districtId: x.id,
      districtName: index.districts.get(x.id)?.DistrictName || "Unknown",
      count: x.count,
      latitude: lat,
      longitude: lng,
      risk: x.count >= 100 ? "high" : x.count >= 70 ? "medium" : "low"
    };
  });

  res.json({ points, clusters });
});

app.get("/api/repeat-offenders", (req, res) => {
  const minCases = clampQueryNumber(req.query.minCases, 2, 2);
  const byPerson = new Map();

  for (const a of db.accused) {
    const personId = String(a.PersonMasterID || a.PersonID || "");
    if (!personId) continue;
    if (!byPerson.has(personId)) byPerson.set(personId, []);
    byPerson.get(personId).push(a);
  }

  const offenders = [...byPerson.entries()]
    .filter(([, rows]) => new Set(rows.map(r => r.CaseMasterID)).size >= minCases)
    .map(([personId, rows]) => {
      const caseIds = [...new Set(rows.map(r => String(r.CaseMasterID)))];
      const person = index.persons.get(personId);
      const relatedCases = db.cases.filter(c => caseIds.includes(String(c.CaseMasterID))).map(enrichCase);
      return {
        personId,
        name: person?.PersonName || rows[0]?.AccusedName || "Unknown",
        age: person?.AgeYear || rows[0]?.AgeYear || "",
        caseCount: caseIds.length,
        districts: [...new Set(relatedCases.map(c => c.districtName))],
        crimeTypes: [...new Set(relatedCases.map(c => c.crimeHeadName))],
        preferredMO: index.mo.get(String(person?.PreferredMOID))?.MOName || "Unknown",
        lastKnownCaseDate: relatedCases
          .map(c => c.CrimeRegisteredDate)
          .filter(Boolean)
          .sort()
          .at(-1)
      };
    })
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, 100);

  res.json({ offenders });
});

app.get("/api/network", (req, res) => {
  const maxCases = clampQueryNumber(req.query.maxCases, 150, 20, 500);
  const accusedByCase = new Map();

  for (const a of db.accused) {
    const caseId = String(a.CaseMasterID);
    if (!accusedByCase.has(caseId)) accusedByCase.set(caseId, []);
    accusedByCase.get(caseId).push(a);
  }

  const nodes = new Map();
  const edgeCounts = new Map();

  for (const [, accusedRows] of [...accusedByCase.entries()].slice(0, maxCases)) {
    const people = accusedRows
      .map(a => ({
        id: String(a.PersonMasterID || a.PersonID || `accused-${a.AccusedMasterID}`),
        label: index.persons.get(String(a.PersonMasterID))?.PersonName || a.AccusedName || "Unknown"
      }))
      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

    for (const p of people) nodes.set(p.id, p);

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const pair = [people[i].id, people[j].id].sort();
        const key = pair.join("|");
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    }
  }

  const degree = new Map();
  const edges = [...edgeCounts.entries()].map(([key, weight]) => {
    const [source, target] = key.split("|");
    degree.set(source, (degree.get(source) || 0) + weight);
    degree.set(target, (degree.get(target) || 0) + weight);
    return { source, target, weight };
  });

  const nodeList = [...nodes.values()].map(node => ({
    ...node,
    degree: degree.get(node.id) || 0,
    risk: (degree.get(node.id) || 0) >= 6 ? "high" : (degree.get(node.id) || 0) >= 3 ? "medium" : "low"
  }));

  res.json({ nodes: nodeList, edges });
});

app.get("/api/predictive", (req, res) => {
  const cases = filterCases(req);
  const byDistrict = new Map();

  for (const c of cases) {
    const districtId = caseDistrictId(c);
    const d = isoDate(c.CrimeRegisteredDate);
    if (!districtId || !d) continue;
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byDistrict.has(districtId)) byDistrict.set(districtId, new Map());
    const m = byDistrict.get(districtId);
    m.set(month, (m.get(month) || 0) + 1);
  }

const rawPredictions = [...byDistrict.entries()]
  .map(([districtId, months]) => {
    const values = [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    const recent = values.slice(-3);
    const previous = values.slice(-6, -3);

    const forecast = Math.round(
      recent.reduce((sum, value) => sum + value, 0) /
        Math.max(1, recent.length)
    );

    const previousAvg =
      previous.reduce((sum, value) => sum + value, 0) /
      Math.max(1, previous.length);

    const changePercent = previousAvg
      ? Math.round(((forecast - previousAvg) / previousAvg) * 100)
      : 0;

    return {
      districtId,
      districtName:
        index.districts.get(districtId)?.DistrictName || "Unknown",
      predictedNextMonth: forecast,
      changePercent,
    };
  })
  .sort(
    (a, b) =>
      b.predictedNextMonth - a.predictedNextMonth
  );

const predictedValues = rawPredictions
  .map((item) => item.predictedNextMonth)
  .filter(Number.isFinite)
  .sort((a, b) => a - b);

const highThreshold =
  predictedValues[
    Math.floor(predictedValues.length * 0.75)
  ] ?? 0;

const mediumThreshold =
  predictedValues[
    Math.floor(predictedValues.length * 0.5)
  ] ?? 0;

const predictions = rawPredictions.map((item) => ({
  ...item,

  risk:
    item.predictedNextMonth >= highThreshold &&
    item.predictedNextMonth > 0
      ? "high"
      : item.predictedNextMonth >= mediumThreshold &&
          item.predictedNextMonth > 0
        ? "medium"
        : "low",
}));

  res.json({
    model: "Three-month moving-average demonstration model",
    predictions
  });
});

app.get("/api/districts", (_req, res) => {
  const counts = groupCount(db.cases, caseDistrictId);
  const districts = db.districts.map(d => {
    const socio = index.socio.get(String(d.DistrictID));
    return {
      ...d,
      caseCount: counts.get(String(d.DistrictID)) || 0,
      socioeconomic: socio || null
    };
  }).sort((a, b) => b.caseCount - a.caseCount);

  res.json({ districts });
});

app.get("/api/district-analytics/:districtId", (req, res) => {
  const districtId = String(req.params.districtId);
  const district = index.districts.get(districtId);
  if (!district) return res.status(404).json({ message: "District not found" });

  const cases = db.cases.filter(c => caseDistrictId(c) === districtId);
  const headCounts = groupCount(cases, c => c.CrimeMajorHeadID);
  const statusCounts = groupCount(cases, c => c.CaseStatusID);

  res.json({
    district,
    socioeconomic: index.socio.get(districtId) || null,
    kpis: {
      totalCases: cases.length,
      severeCases: cases.filter(c => String(c.GravityOffenceID) === "1").length,
      policeStations: new Set(
        db.units.filter(u => String(u.DistrictID) === districtId).map(u => u.UnitID)
      ).size,
      officers: db.employees.filter(e => String(e.DistrictID) === districtId).length
    },
    crimeTypes: topEntries(headCounts, 10).map(x => ({
      name: index.heads.get(x.id)?.CrimeGroupName || "Unknown",
      count: x.count
    })),
    statuses: topEntries(statusCounts, 10).map(x => ({
      name: index.statuses.get(x.id)?.CaseStatusName || "Unknown",
      count: x.count
    })),
    recentCases: [...cases]
      .sort((a, b) => (isoDate(b.CrimeRegisteredDate)?.getTime() || 0) - (isoDate(a.CrimeRegisteredDate)?.getTime() || 0))
      .slice(0, 20)
      .map(enrichCase)
  });
});

app.get("/api/reports", (req, res) => {
  const cases = filterCases(req).map(enrichCase);
  const format = String(req.query.format || "json").toLowerCase();

  if (format === "csv") {
    if (!cases.length) {
      return res.status(404).json({ error: "No records found" });
    }

    const headers = Object.keys(cases[0]);
    const escapeCell = (value) => {
      const str = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csvLines = [
      headers.map(escapeCell).join(","),
      ...cases.map((row) =>
        headers.map((h) => escapeCell(row[h])).join(",")
      )
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    return res.send("\uFEFF" + csvLines.join("\n"));
  }

  return res.json({
    generatedAt: new Date().toISOString(),
    total: cases.length,
    rows: cases
  });
});

app.get("/api/alerts", (_req, res) => {
  const districtCounts = topEntries(groupCount(db.cases, caseDistrictId), 8);
  const repeatPersons = topEntries(groupCount(db.accused, a => a.PersonMasterID || a.PersonID), 10)
    .filter(x => x.count >= 3);

  const highestDistrictCount =
  districtCounts[0]?.count || 0;

const highestRepeatCount =
  repeatPersons[0]?.count || 0;

const alerts = [
  ...districtCounts.slice(0, 5).map((x, i) => {
    const relativeShare =
      highestDistrictCount > 0
        ? x.count / highestDistrictCount
        : 0;

    const severity =
      i === 0 && relativeShare >= 0.9
        ? "critical"
        : relativeShare >= 0.6
          ? "high"
          : "medium";

    return {
      id: `district-${x.id}`,
      severity,

      title: `High case concentration in ${
        index.districts.get(x.id)?.DistrictName ||
        "district"
      }`,

      description: `${x.count} registered cases are present in the current dataset.`,

      type: "hotspot",

      districtName:
        index.districts.get(x.id)?.DistrictName ||
        "Unknown",

      caseCount: x.count
    };
  }),

  ...repeatPersons.slice(0, 5).map((x, i) => {
    const relativeShare =
      highestRepeatCount > 0
        ? x.count / highestRepeatCount
        : 0;

    const severity =
      i === 0 && relativeShare >= 0.9
        ? "critical"
        : relativeShare >= 0.6
          ? "high"
          : "medium";

    return {
      id: `person-${x.id}`,
      severity,

      title: "Repeat-offender pattern detected",

      description: `${
        index.persons.get(x.id)?.PersonName ||
        "A person"
      } is linked to ${x.count} accused records.`,

      type: "offender",

      caseCount: x.count
    };
  })
];

  res.json({ alerts });
});

app.get("/api/cases", (req, res) => {
  const { limit } = req.query;
  const maxRows = clampQueryNumber(limit, 100, 1, 5000);
  const cases = filterCases(req).map(enrichCase);

  res.json({
    total: cases.length,
    cases: cases.slice(0, maxRows)
  });
});

app.post("/api/cases", (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const payload = body.case && typeof body.case === "object" ? body.case : body;

  const crimeHead = String(payload.crimeHead || "").trim();
  const districtName = String(payload.district || "").trim();
  const policeStationName = String(payload.policeStation || "").trim();
  const statusName = String(payload.status || "").trim();
  const gravityName = String(payload.gravity || "").trim();
  const registrationDate = payload.registrationDate;

  if (!crimeHead || !districtName || !policeStationName || !registrationDate) {
    return res.status(400).json({
      message:
        "crimeHead, district, policeStation and registrationDate are required to register a case."
    });
  }

  const district = findMasterByName(db.districts, "DistrictName", districtName);
  const status = findMasterByName(db.statuses, "CaseStatusName", statusName);
  const gravity = resolveGravityRow(gravityName);
  const subHead =
    findMasterByName(db.crimeSubHeads, "CrimeHeadName", crimeHead) ||
    findMasterByPartialName(db.crimeSubHeads, "CrimeHeadName", crimeHead);
  const crimeGroup = subHead
    ? index.heads.get(String(subHead.CrimeHeadID))
    : findMasterByName(db.crimeHeads, "CrimeGroupName", crimeHead);

  const caseNo = nextCaseNo(payload.caseNo);
  lastCaseMasterId += 1;

  const caseRow = {
    CaseMasterID: lastCaseMasterId,
    CrimeNo: String(payload.crimeNo || caseNo).trim(),
    CaseNo: caseNo,
    CrimeRegisteredDate: formatDateOnly(registrationDate),
    PolicePersonID: String(
      (payload.createdBy && payload.createdBy.id) || ""
    ),
    PoliceStationID: "",
    RegisteredDistrictID: district ? String(district.DistrictID) : "",
    CaseCategoryID: "",
    GravityOffenceID: gravity ? String(gravity.GravityOffenceID) : "",
    CrimeMajorHeadID: crimeGroup ? String(crimeGroup.CrimeHeadID) : "",
    CrimeMinorHeadID: subHead ? String(subHead.CrimeSubHeadID) : "",
    CaseStatusID: status ? String(status.CaseStatusID) : "",
    CourtID: "",
    IncidentFromDate: "",
    IncidentToDate: "",
    InfoReceivedPSDate: "",
    latitude: "",
    longitude: "",
    BriefFacts: String(payload.summary || ""),
    districtName: district ? district.DistrictName : districtName,
    policeStationName,
    crimeHeadName: crimeGroup ? crimeGroup.CrimeGroupName : crimeHead,
    crimeSubHeadName: subHead ? subHead.CrimeHeadName : crimeHead,
    statusName: status ? status.CaseStatusName : statusName,
    gravityName
  };

  db.cases.unshift(caseRow);
  enrichedCaseCache.unshift(enrichCase(caseRow));

  const createdCase = enrichCase(caseRow);

  res.status(201).json({
    created: true,
    caseNo: createdCase.CaseNo,
    crimeNo: createdCase.CrimeNo,
    case: createdCase
  });
});

app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();

  const cases = enrichedCaseCache.filter((caseItem) => {
    if (!q) {
      return true;
    }

    const accusedNames = (accusedByCaseCache.get(String(caseItem.CaseMasterID)) || [])
      .map((accused) => {
        const personId = String(
          accused.PersonMasterID ||
            accused.PersonID ||
            ""
        );

        return (
          index.persons.get(personId)?.PersonName ||
          accused.AccusedName ||
          ""
        );
      });

    const searchableValues = [
      caseItem.CaseMasterID,
      caseItem.CrimeNo,
      caseItem.CaseNo,
      caseItem.BriefFacts,
      caseItem.CrimeRegisteredDate,

      caseItem.districtName,
      caseItem.policeStationName,

      caseItem.crimeHeadName,
      caseItem.crimeSubHeadName,

      caseItem.statusName,
      caseItem.gravityName,

      ...accusedNames,
    ];

    return searchableValues.some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const people = q
    ? db.persons
        .filter((person) =>
          [
            person.PersonName,
            person.PersonMasterID,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(q)
          )
        )
        .slice(0, 50)
    : [];

  const districts = q
    ? db.districts
        .filter((district) =>
          String(district.DistrictName || "")
            .toLowerCase()
            .includes(q)
        )
        .slice(0, 31)
    : [];

  res.json({
    total: cases.length,
    cases,
    people,
    districts,
  });
});

app.post("/api/assistant", (req, res) => {
  const question = String((req.body && req.body.question) || "").trim();
  const lower = question.toLowerCase();
  const districtCounts = topEntries(groupCount(db.cases, caseDistrictId), 5);
  const crimeCounts = topEntries(groupCount(db.cases, c => c.CrimeMajorHeadID), 5);

  let answer = "Ask about total cases, top districts, major crime types, repeat offenders, or hotspot risk.";

  if (lower.includes("total") && lower.includes("case")) {
    answer = `The dataset contains ${db.cases.length} registered cases.`;
  } else if (lower.includes("district") || lower.includes("hotspot")) {
    answer = `The highest case concentration is in ${
      index.districts.get(districtCounts[0]?.id)?.DistrictName || "the leading district"
    } with ${districtCounts[0]?.count || 0} cases.`;
  } else if (lower.includes("crime") || lower.includes("type")) {
    answer = `The leading crime category is ${
      index.heads.get(crimeCounts[0]?.id)?.CrimeGroupName || "Unknown"
    } with ${crimeCounts[0]?.count || 0} cases.`;
  } else if (lower.includes("repeat") || lower.includes("offender")) {
    const repeats = [...groupCount(db.accused, a => a.PersonMasterID || a.PersonID).values()]
      .filter(count => count >= 2).length;
    answer = `${repeats} people are linked to at least two accused records in this demonstration dataset.`;
  }

  res.json({
    answer,
    note: "This endpoint is dataset-grounded and rule-based. Connect Gemini later without changing the frontend contract."
  });
});

app.get("/api/resources", (_req, res) => {
  try {
    const tables = resourcesCache;

    const totalRecords = tables.reduce(
      (sum, table) => sum + table.recordCount,
      0,
    );

    const totalColumns = tables.reduce(
      (sum, table) => sum + table.columnCount,
      0,
    );

    res.json({
      generatedAt: new Date().toISOString(),

      dataset: {
        name: "Karnataka FIR Synthetic Dataset",
        dataDirectory: "backend/data",
        tableCount: tables.length,
        totalRecords,
        totalColumns,
      },

      tables,
    });
  } catch (error) {
    console.error("Resources endpoint error:", error);

    res.status(500).json({
      message: "Unable to inspect dataset resources",
      error: error.message,
    });
  }
});

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || (err.type === "entity.parse.failed" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? "Internal server error" : "Bad request" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on ${PORT}`);
});


