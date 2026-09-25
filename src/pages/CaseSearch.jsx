import { Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import { addAuditLog } from "../utils/auditLogger";
import { caseRecords } from "../data/caseRecords";

import PageHeader from "../components/common/PageHeader";
import { api } from "../services/api";
import { useI18n } from "../i18n";

function CaseSearch() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [query, setQuery] = useState(
    searchParams.get("q") || "",
  );

  const [district, setDistrict] =
    useState("All");

  const [status, setStatus] =
    useState("All");

  const [cases, setCases] = useState([]);
  const [districts, setDistricts] =
    useState([]);
  const [statuses, setStatuses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadLookups() {
      try {
        const [
          lookupsResponse,
          districtsResponse,
        ] = await Promise.all([
          api.lookups(),
          api.districts(),
        ]);

        if (!active) return;

        const lookupData =
          lookupsResponse?.data ??
          lookupsResponse ??
          {};

        const districtSource =
          districtsResponse?.districts ??
          districtsResponse?.data?.districts ??
          districtsResponse?.data ??
          districtsResponse ??
          [];

        const statusSource =
          lookupData?.statuses ??
          lookupData?.caseStatuses ??
          lookupData?.CaseStatusMaster ??
          [];

        setDistricts(
          normalizeDistricts(districtSource),
        );

        setStatuses(
          normalizeStatuses(statusSource),
        );
      } catch (lookupError) {
        console.error(
          "Unable to load search filters:",
          lookupError,
        );
      }
    }

    loadLookups();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const timeoutId = setTimeout(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response = await api.search(
            query.trim(),
          );

          if (!active) return;

          const source =
            response?.cases ??
            response?.results ??
            response?.data?.cases ??
            response?.data?.results ??
            response?.data ??
            response ??
            [];

          const normalizedCases =
            normalizeCases(source);
          const displayCases = mergeCases(
            normalizedCases,
            normalizeLocalCases(
              caseRecords.filter(
                (record) => record.createdAt,
              ),
              query,
            ),
          );

          setCases(displayCases);

          if (query.trim()) {
            addAuditLog({
             action: "Searched FIR records",
             resource: query.trim(),
             category: "Case Search",
             status: "Success",
             details: `${displayCases.length} matching records returned`,
              });
          }

          setDistricts((current) =>
            mergeFilterOptions(
              current,
              displayCases
                .map((crime) => crime.district)
                .filter(Boolean),
            ),
          );

          setStatuses((current) =>
            mergeFilterOptions(
              current,
              displayCases
                .map((crime) => crime.status)
                .filter(Boolean),
            ),
          );
        } catch (searchError) {
          console.error(
            "Case search failed:",
            searchError,
          );

          if (!active) return;

          setCases(
            normalizeLocalCases(
              caseRecords,
              query,
            ),
          );

          setError(
            searchError?.message ??
              "Unable to load case records.",
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      },
      300,
    );

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const results = useMemo(() => {
    return cases.filter((crime) => {
      const matchesDistrict =
        district === "All" ||
        crime.district === district;

      const matchesStatus =
        status === "All" ||
        crime.status === status;

      return (
        matchesDistrict &&
        matchesStatus
      );
    });
  }, [cases, district, status]);

  const handleQueryChange = (event) => {
    const value = event.target.value;

    setQuery(value);

    const nextParams =
      new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, {
      replace: true,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Search}
        title={t("pages.caseSearch.title")}
        description={t("pages.caseSearch.description")}
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-3 rounded-2xl border border-edge bg-surface p-4 md:grid-cols-[1fr_220px_220px]">
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder="Search Crime No, Case No, accused, offence..."
            className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />

          <select
            value={district}
            onChange={(event) =>
              setDistrict(event.target.value)
            }
            className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="All">
              All districts
            </option>

            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="All">
              All statuses
            </option>

            {statuses.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-edge">
          <table className="min-w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {[
                  "Case No",
                  "Date",
                  "District",
                  "Police Station",
                  "Crime",
                  "Status",
                  "Gravity",
                ].map((title) => (
                  <th
                    key={title}
                    className="whitespace-nowrap px-4 py-4 text-left text-slate-300"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 bg-surface">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-40 px-4 py-8 text-center text-ink-secondary"
                  >
                    Loading FIR records from
                    the dataset...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-40 px-4 py-8 text-center text-ink-secondary"
                  >
                    No case records found.
                  </td>
                </tr>
              ) : (
                results.map((crime) => (
                  <tr
                    key={crime.id}
                    className="hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-[0.8125rem] font-medium text-primary-hover">
                      <Link
                        to={`/cases/${encodeURIComponent(
                          crime.caseNo,
                        )}`}
                        className="transition hover:text-primary"
                      >
                        {crime.caseNo}
                      </Link>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-mono text-[0.8125rem] text-slate-300">
                      {formatDate(crime.date)}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {crime.district}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {crime.policeStation}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {crime.crime}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {crime.status}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getGravityClass(
                          crime.gravityId,
                          crime.gravity,
                        )}`}
                      >
                        {crime.gravity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          results.length > 0 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs leading-5 text-ink-secondary">
                Showing{" "}
                {results.length.toLocaleString(
                  "en-IN",
                )}{" "}
                matching FIR records from the
                loaded synthetic dataset.
                District, police station, crime,
                status and gravity values are
                resolved from their corresponding
                master tables.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

function mergeFilterOptions(
  currentOptions,
  additionalOptions,
) {
  return [
    ...new Set(
      [...currentOptions, ...additionalOptions]
        .map((option) => String(option).trim())
        .filter(Boolean),
    ),
  ].sort((first, second) =>
    first.localeCompare(second),
  );
}

function normalizeLocalCases(records, query) {
  const normalizedQuery = query.trim().toLowerCase();

  const matchingRecords = normalizedQuery
    ? records.filter((record) =>
        [
          record.caseNo,
          record.crimeNo,
          record.registrationDate,
          record.district,
          record.policeStation,
          record.crimeHead,
          record.status,
          record.gravity,
          record.summary,
          ...(Array.isArray(record.accused)
            ? record.accused
            : []),
          ...(Array.isArray(record.victims)
            ? record.victims
            : []),
          ...(Array.isArray(record.sections)
            ? record.sections
            : []),
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      )
    : records;

  return normalizeCases(matchingRecords);
}

function mergeCases(remoteCases, localCases) {
  const casesByNumber = new Map();

  for (const crime of remoteCases) {
    casesByNumber.set(
      String(crime.caseNo).toUpperCase(),
      crime,
    );
  }

  for (const crime of localCases) {
    casesByNumber.set(
      String(crime.caseNo).toUpperCase(),
      crime,
    );
  }

  return [...casesByNumber.values()];
}

function normalizeCases(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((crime, index) => ({
    id: String(
      crime.caseId ??
        crime.CaseMasterID ??
        crime.id ??
        `case-${index}`,
    ),

    crimeNo:
      crime.crimeNo ??
      crime.CrimeNo ??
      "Not available",

    caseNo:
      crime.caseNo ??
      crime.CaseNo ??
      crime.crimeNo ??
      crime.CrimeNo ??
      "Not available",

    date:
      crime.date ??
      crime.CrimeRegisteredDate ??
      crime.registrationDate ??
      null,

    district:
      crime.districtName ??
      crime.DistrictName ??
      crime.district ??
      "Unknown",

    policeStation:
      crime.policeStationName ??
      crime.UnitName ??
      crime.policeStation ??
      "Unknown",

    crime:
      crime.crimeSubHeadName ??
      crime.CrimeSubHeadName ??
      crime.crimeHeadName ??
      crime.CrimeGroupName ??
      crime.crime ??
      crime.crimeHead ??
      "Unknown",

    status:
      crime.statusName ??
      crime.CaseStatusName ??
      crime.status ??
      "Unknown",

    gravity:
      crime.gravityName ??
      crime.GravityName ??
      crime.LookupValue ??
      crime.gravity ??
      "Unknown",

    gravityId:
      crime.gravityOffenceId ??
      crime.GravityOffenceID ??
      null,
  }));
}

function normalizeDistricts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(
          (district) =>
            district.DistrictName ??
            district.districtName ??
            district.name ??
            "",
        )
        .map((name) =>
          String(name).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((first, second) =>
    first.localeCompare(second),
  );
}

function normalizeStatuses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(
          (item) =>
            item.CaseStatusName ??
            item.statusName ??
            item.name ??
            item.LookupValue ??
            "",
        )
        .map((name) =>
          String(name).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((first, second) =>
    first.localeCompare(second),
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getGravityClass(
  gravityId,
  gravityName,
) {
  if (
    String(gravityId ?? "") === "1"
  ) {
    return "bg-red-500/15 text-red-400";
  }

  const normalized = String(
    gravityName ?? "",
  ).toLowerCase();

  if (
    normalized.includes("heinous") ||
    normalized.includes("high") ||
    normalized.includes("severe")
  ) {
    return "bg-red-500/15 text-red-400";
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("moderate")
  ) {
    return "bg-amber-500/15 text-amber-400";
  }

  return "bg-primary/15 text-primary-hover";
}

export default CaseSearch;