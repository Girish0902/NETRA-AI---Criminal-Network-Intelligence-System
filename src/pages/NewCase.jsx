import {
  FilePlus2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import MonoLabel from "../components/ui/MonoLabel";
import Panel from "../components/ui/Panel";
import { useAuth } from "../context/AuthContext";
import { createCase } from "../data/caseRecords";
import { getSuggestedSections } from "../data/crimeSectionMap";
import { api } from "../services/api";
import { addAuditLog } from "../utils/auditLogger";

const DISTRICTS = [
  { code: "BLR", name: "Bengaluru Urban" },
  { code: "MYS", name: "Mysuru" },
  { code: "MNG", name: "Mangaluru" },
  { code: "BLG", name: "Belagavi" },
  { code: "HBL", name: "Hubballi-Dharwad" },
  { code: "KLB", name: "Kalaburagi" },
];

const POLICE_STATIONS = {
  BLR: [
    "Indiranagar",
    "Whitefield",
    "Koramangala",
    "Jayanagar",
    "Yeshwanthpur",
  ],
  MYS: ["Devaraja", "Vijayanagar", "Krishnaraja"],
  MNG: ["Mangaluru North", "Mangaluru South", "Ullal"],
  BLG: ["Belagavi Rural", "Camp Police Station"],
  HBL: ["Vidyanagar", "Old Hubballi"],
  KLB: ["Station Bazaar", "Brahmapur"],
};

const CRIME_HEADS = [
  "Vehicle theft",
  "Cyber fraud",
  "Assault",
  "Burglary",
  "Chain snatching",
  "Narcotics possession",
  "Economic offence",
  "Public order disturbance",
  "Missing person",
  "Cheating / breach of trust",
];

const GRAVITY_OPTIONS = ["High", "Medium", "Low"];

const STATUS_OPTIONS = [
  "Under Investigation",
  "Chargesheet Filed",
  "Arrest Made",
  "Closed",
  "Undetected",
];

function pad(number, length) {
  return String(number).padStart(length, "0");
}

function generateCaseNo(districtCode) {
  const districtIndex =
    DISTRICTS.findIndex(
      (district) => district.code === districtCode,
    ) + 1 || 1;
  const year = new Date().getFullYear();
  const sequence = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `${pad(districtIndex, 3)}${pad(44, 3)}${year}${pad(sequence, 4)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function sameSections(current, suggested) {
  if (current.length !== suggested.length) {
    return false;
  }

  return current.every(
    (section, index) => section === suggested[index],
  );
}

async function registerCase(record) {
  try {
    const response = await api.createCase(record);

    const persistedCaseNo =
      response?.caseNo ??
      response?.case?.CaseNo ??
      record.caseNo;
    const persistedCrimeNo =
      response?.crimeNo ??
      response?.case?.CrimeNo ??
      record.crimeNo ??
      persistedCaseNo;

    return createCase({
      ...record,
      caseNo: persistedCaseNo,
      crimeNo: persistedCrimeNo,
    });
  } catch (apiError) {
    console.error(
      "Case API unavailable, registering in the local session store only:",
      apiError,
    );

    return createCase(record);
  }
}

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  tone = "default",
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeValue = (index) => {
    onChange(
      values.filter((_, valueIndex) => valueIndex !== index),
    );
  };

  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/5 text-red-200"
      : tone === "success"
        ? "border-success/30 bg-success/5 text-emerald-200"
        : "border-edge bg-surface-raised text-ink-secondary";

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />

        <button
          type="button"
          onClick={addValue}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-edge px-3 py-2.5 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${toneClass}`}
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="text-ink-muted transition hover:text-ink"
                aria-label={`Remove ${value}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NewCase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [districtCode, setDistrictCode] = useState(
    DISTRICTS[0].code,
  );
  const [policeStation, setPoliceStation] = useState(
    POLICE_STATIONS[DISTRICTS[0].code][0],
  );
  const [crimeHead, setCrimeHead] = useState(
    CRIME_HEADS[0],
  );
  const [gravity, setGravity] = useState(
    GRAVITY_OPTIONS[0],
  );
  const [status, setStatus] = useState(
    STATUS_OPTIONS[0],
  );
  const [registrationDate, setRegistrationDate] = useState(
    todayISO(),
  );
  const [summary, setSummary] = useState("");
  const [sections, setSections] = useState([]);
  const [sectionsTouched, setSectionsTouched] =
    useState(false);
  const [suggestedSections, setSuggestedSections] =
    useState(() => getSuggestedSections(CRIME_HEADS[0]));
  const [accused, setAccused] = useState([]);
  const [victims, setVictims] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const lastCrimeHeadRef = useRef(null);

  useEffect(() => {
    const suggestions = getSuggestedSections(crimeHead);

    setSuggestedSections(suggestions);

    if (lastCrimeHeadRef.current === crimeHead) {
      return;
    }

    lastCrimeHeadRef.current = crimeHead;

    if (sectionsTouched) {
      return;
    }

    setSections(suggestions);
  }, [crimeHead, sectionsTouched]);

  const showSectionSuggestion =
    sectionsTouched &&
    suggestedSections.length > 0 &&
    !sameSections(sections, suggestedSections);

  const caseNo = useMemo(
    () => generateCaseNo(districtCode),
    [districtCode],
  );

  const districtName =
    DISTRICTS.find(
      (district) => district.code === districtCode,
    )?.name ?? "Unknown";
  const stationOptions =
    POLICE_STATIONS[districtCode] ?? [];
  const registeringOfficer = {
    name:
      user?.name ??
      user?.fullName ??
      user?.displayName ??
      "State Police",
    id:
      user?.employeeId ??
      user?.badgeId ??
      user?.id ??
      "KP-ADMIN-001",
    role:
      user?.role ??
      "Investigating Officer",
  };

  const handleDistrictChange = (event) => {
    const nextCode = event.target.value;

    setDistrictCode(nextCode);
    setPoliceStation(
      POLICE_STATIONS[nextCode]?.[0] ?? "",
    );
  };

  const handleSectionsChange = (
    nextSections,
  ) => {
    setSections(nextSections);
    setSectionsTouched(true);
  };

  const applySuggestedSections = () => {
    setSections(suggestedSections);
    setSectionsTouched(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!crimeHead || !policeStation || !registrationDate) {
      setErrorMessage(
        "Crime head, police station and registration date are required.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const registeredRecord = {
        caseNo,
        crimeHead,
        district: districtName,
        policeStation,
        registrationDate,
        gravity,
        status,
        summary:
          summary.trim() ||
          `${crimeHead} reported at ${policeStation} police station.`,
        sections,
        accused,
        victims,
        investigators: [
          {
            name: registeringOfficer.name,
            role: registeringOfficer.role,
          },
        ],
        evidence: [],
        access: "granted",
        createdBy: {
          name: registeringOfficer.name,
          id: registeringOfficer.id,
          role: registeringOfficer.role,
        },
        createdAt: new Date().toISOString(),
      };

      const createdRecord = await registerCase(
        registeredRecord,
      );
      const createdCaseNo =
        createdRecord?.caseNo ?? caseNo;

      addAuditLog({
        action: "Created new case",
        resource: createdCaseNo,
        category: "Case Creation",
        status: "Success",
        details: `${crimeHead} registered at ${policeStation}, ${districtName} by ${registeringOfficer.name} (${registeringOfficer.id})`,
      });

      navigate(
        `/cases/${encodeURIComponent(createdCaseNo)}`,
      );
    } catch (submitError) {
      console.error("Case creation failed:", submitError);

      setErrorMessage(
        submitError?.message ??
          "Unable to create the case. Please try again.",
      );

      addAuditLog({
        action: "Case creation failed",
        resource: caseNo,
        category: "Case Creation",
        status: "Failed",
        details: String(
          submitError?.message ?? submitError,
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={FilePlus2}
        title="Register New Case"
        description="Create a new FIR record and assign it into the case management pipeline"
        action={
          <button
            type="button"
            onClick={() => navigate("/cases")}
            className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
          >
            Back to case search
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 xl:grid-cols-3"
        >
          <div className="space-y-5 xl:col-span-2">
            <Panel
              title="Case identification"
              bodyClassName="p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Case / FIR number
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5">
                    <MonoLabel className="text-primary-hover">
                      {caseNo}
                    </MonoLabel>
                  </div>

                  <p className="mt-1.5 text-xs text-ink-muted">
                    Auto-generated · unique · district + station + year coded
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Registration date
                  </label>

                  <input
                    type="date"
                    required
                    value={registrationDate}
                    onChange={(event) =>
                      setRegistrationDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    District
                  </label>

                  <select
                    value={districtCode}
                    onChange={handleDistrictChange}
                    className="w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  >
                    {DISTRICTS.map((district) => (
                      <option
                        key={district.code}
                        value={district.code}
                      >
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Police station
                  </label>

                  <select
                    value={policeStation}
                    onChange={(event) =>
                      setPoliceStation(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  >
                    {stationOptions.map((station) => (
                      <option key={station} value={station}>
                        {station}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Crime head
                  </label>

                  <select
                    value={crimeHead}
                    onChange={(event) =>
                      setCrimeHead(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  >
                    {CRIME_HEADS.map((head) => (
                      <option key={head} value={head}>
                        {head}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Gravity of offence
                  </label>

                  <select
                    value={gravity}
                    onChange={(event) =>
                      setGravity(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  >
                    {GRAVITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Case status
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setStatus(option)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                          status === option
                            ? "border-primary bg-primary/15 text-primary-hover"
                            : "border-edge bg-surface-raised text-ink-secondary hover:border-primary/30"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Case summary
                </label>

                <textarea
                  rows={4}
                  value={summary}
                  onChange={(event) =>
                    setSummary(event.target.value)
                  }
                  placeholder="Brief narrative of the incident, date/time of occurrence, and preliminary findings..."
                  className="w-full resize-none rounded-xl border border-edge bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
            </Panel>

            <Panel
              title="Accused, victims & legal sections"
              bodyClassName="p-6"
            >
              <div className="space-y-5">
                <TagInput
                  label="Accused"
                  placeholder="Enter accused name and press Add"
                  values={accused}
                  onChange={setAccused}
                  tone="danger"
                />

                <TagInput
                  label="Victims"
                  placeholder="Enter victim name and press Add"
                  values={victims}
                  onChange={setVictims}
                  tone="success"
                />

                <TagInput
                  label="Legal sections"
                  placeholder="e.g. IPC 379, BNS 303(2)"
                  values={sections}
                  onChange={handleSectionsChange}
                />

                {showSectionSuggestion && (
                  <button
                    type="button"
                    onClick={applySuggestedSections}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-left text-xs text-ink-secondary transition hover:border-primary/50 hover:text-ink"
                  >
                    <Sparkles
                      size={14}
                      className="shrink-0 text-primary-hover"
                    />

                    <span>
                      Suggested:{" "}
                      <span className="font-mono text-primary-hover">
                        {suggestedSections.join(
                          ", ",
                        )}
                      </span>{" "}
                      — click to apply
                    </span>
                  </button>
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel
              title="Registering officer"
              bodyClassName="p-6"
            >
              <div className="flex items-center gap-3 rounded-xl border border-edge bg-canvas p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary-hover">
                  <ShieldCheck size={19} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {registeringOfficer.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {registeringOfficer.role}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-muted">
                  Officer ID
                </span>
                <MonoLabel className="text-ink-secondary">
                  {registeringOfficer.id}
                </MonoLabel>
              </div>

              <p className="mt-4 text-xs leading-5 text-ink-muted">
                This case will be filed under your credentials and logged in
                the audit trail. You are automatically added as the primary
                investigator.
              </p>
            </Panel>

            <Panel title="Preview" bodyClassName="p-6">
              <dl className="space-y-3 text-sm">
                <Row label="Case No" value={caseNo} mono />
                <Row label="District" value={districtName} />
                <Row label="Station" value={policeStation} />
                <Row label="Crime head" value={crimeHead} />
                <Row label="Gravity" value={gravity} />
                <Row label="Status" value={status} />
                <Row
                  label="Legal sections"
                  value={
                    sections.length > 0
                      ? `${sections.length} added`
                      : "None"
                  }
                />
                <Row
                  label="Registered"
                  value={registrationDate || "Not set"}
                  mono
                />
              </dl>
            </Panel>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FilePlus2 size={17} />
              {submitting
                ? "Registering case..."
                : "Register case"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`truncate text-right ${
          mono
            ? "font-mono text-xs text-ink-secondary"
            : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default NewCase;
