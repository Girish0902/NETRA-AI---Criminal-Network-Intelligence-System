import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {
  Bot,
  FileCheck2,
  Info,
  Map,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";

import { addAuditLog } from "../utils/auditLogger";
import { api } from "../services/api";
import { useI18n } from "../i18n";

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isCodeColumn(column) {
  return /case|crime|fir|number|no\.|id/i.test(
    String(column ?? ""),
  );
}

function getDashboardData(response) {
  return response?.data ?? response ?? {};
}

function getTrendData(response) {
  return response?.data ?? response ?? {};
}

function getDistricts(response) {
  const source =
    response?.districts ??
    response?.data?.districts ??
    response?.data ??
    response ??
    [];

  return getArray(source);
}

function getOffenders(response) {
  const source =
    response?.offenders ??
    response?.repeatOffenders ??
    response?.data?.offenders ??
    response?.data ??
    response ??
    [];

  return getArray(source);
}

function AICrimeAssistant() {
  const { t } = useI18n();

  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);

  const [datasetContext, setDatasetContext] = useState({
    dashboard: {},
    trends: {},
    districts: [],
    offenders: [],
  });

  const [messages, setMessages] = useState([
    {
      id: createId(),
      role: "assistant",
      content:
        "Loading the NETRA AI synthetic FIR dataset and preparing crime-intelligence tools...",
      time: getCurrentTime(),
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadDatasetContext() {
      setContextLoading(true);

      try {
        const [
          dashboardResponse,
          trendsResponse,
          districtsResponse,
          offendersResponse,
        ] = await Promise.all([
          api.dashboard(),
          api.crimeTrends(),
          api.districts(),
          api.repeatOffenders(),
        ]);

        if (!active) return;

        const dashboard =
          getDashboardData(dashboardResponse);

        const trends =
          getTrendData(trendsResponse);

        const districts =
          getDistricts(districtsResponse);

        const offenders =
          getOffenders(offendersResponse);

        setDatasetContext({
          dashboard,
          trends,
          districts,
          offenders,
        });

        const totalCases = getNumber(
          dashboard?.kpis?.totalCases ??
            dashboard?.totalCases,
        );

        const districtCount =
          getNumber(
            dashboard?.kpis?.districtsCovered,
          ) || districts.length;

        setMessages([
          {
            id: createId(),
            role: "assistant",
            content:
              `Hello! I am NETRA AI, your dataset-grounded crime intelligence assistant.\n\n` +
              `The current synthetic FIR dataset contains ${totalCases.toLocaleString(
                "en-IN",
              )} registered cases across ${districtCount.toLocaleString(
                "en-IN",
              )} districts.\n\n` +
              "I can analyse case totals, crime categories, district concentration, trends and repeat-offender patterns using the loaded CSV records.\n\nWhat would you like to investigate today?",
            time: getCurrentTime(),
          },
        ]);
      } catch (error) {
        console.error(
          "Failed to load assistant context:",
          error,
        );

        if (!active) return;

        setMessages([
          {
            id: createId(),
            role: "assistant",
            content:
              "I could not load the FIR dataset context. Confirm that the backend is running at http://localhost:5000 and try again.",
            time: getCurrentTime(),
          },
        ]);
      } finally {
        if (active) {
          setContextLoading(false);
        }
      }
    }

    loadDatasetContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const topDistricts = useMemo(() => {
    const dashboardRows = getArray(
      datasetContext.dashboard?.topDistricts,
    );

    if (dashboardRows.length > 0) {
      return [...dashboardRows].sort(
        (first, second) =>
          getNumber(second.count) -
          getNumber(first.count),
      );
    }

    return [...datasetContext.districts]
      .map((district) => ({
        districtId:
          district.DistrictID ??
          district.districtId ??
          district.id,

        districtName:
          district.DistrictName ??
          district.districtName ??
          district.name ??
          "Unknown",

        count: getNumber(
          district.caseCount ??
            district.count ??
            district.totalCases,
        ),
      }))
      .sort(
        (first, second) =>
          second.count - first.count,
      );
  }, [datasetContext]);

  const crimeTypes = useMemo(() => {
    const source =
      getArray(
        datasetContext.dashboard?.topCrimeTypes,
      ).length > 0
        ? getArray(
            datasetContext.dashboard
              ?.topCrimeTypes,
          )
        : getArray(
            datasetContext.trends?.crimeTypes,
          );

    return [...source].sort(
      (first, second) =>
        getNumber(second.count) -
        getNumber(first.count),
    );
  }, [datasetContext]);

  const monthlyTrend = useMemo(() => {
    const source = getArray(
      datasetContext.trends?.monthlyTrend ??
        datasetContext.dashboard?.monthlyTrend,
    );

    return source
      .map((item) => ({
        month:
          item.month ??
          item.period ??
          item.date ??
          "Unknown",

        cases: getNumber(
          item.count ??
            item.cases ??
            item.value,
        ),
      }))
      .sort((first, second) =>
        String(first.month).localeCompare(
          String(second.month),
        ),
      );
  }, [datasetContext]);

  const presetData = useMemo(() => {
    const leadingDistrict =
      topDistricts[0]?.districtName ??
      "the highest-volume district";

    const leadingCrime =
      crimeTypes[0]?.crimeHeadName ??
      crimeTypes[0]?.name ??
      "the leading crime category";

    return [
      {
        text:
          "Show the districts with the highest number of registered cases",
        icon: ShieldAlert,
        iconClass:
          "bg-red-500/15 text-red-400",
      },
      {
        text: `Find repeat offenders linked to ${leadingDistrict}`,
        icon: UsersRound,
        iconClass:
          "bg-purple-500/15 text-purple-400",
      },
      {
        text: `Analyse ${leadingCrime} across districts`,
        icon: Map,
        iconClass:
          "bg-primary/15 text-primary-hover",
      },
      {
        text:
          "Compare the latest three months of registered cases",
        icon: TrendingUp,
        iconClass:
          "bg-emerald-500/15 text-emerald-400",
      },
    ];
  }, [topDistricts, crimeTypes]);

  function findDistrictInQuestion(text) {
    const normalized = text.toLowerCase();

    const match = datasetContext.districts.find(
      (district) => {
        const name =
          district.DistrictName ??
          district.districtName ??
          district.name;

        return (
          name &&
          normalized.includes(
            String(name).toLowerCase(),
          )
        );
      },
    );

    return (
      match?.DistrictName ??
      match?.districtName ??
      match?.name ??
      null
    );
  }

  function findCrimeTypeInQuestion(text) {
    const normalized = text.toLowerCase();

    const match = crimeTypes.find((crime) => {
      const name =
        crime.crimeHeadName ??
        crime.name ??
        crime.category;

      return (
        name &&
        normalized.includes(
          String(name).toLowerCase(),
        )
      );
    });

    return (
      match?.crimeHeadName ??
      match?.name ??
      match?.category ??
      null
    );
  }

  function buildLocalDatasetAnswer(text) {
    const normalized = text.toLowerCase();

    const dashboard = datasetContext.dashboard;
    const kpis = dashboard?.kpis ?? {};

    const totalCases = getNumber(
      kpis.totalCases ??
        dashboard?.totalCases,
    );

    const activeInvestigations = getNumber(
      kpis.activeInvestigations,
    );

    const heinousOffences = getNumber(
      kpis.heinousOffences ??
        kpis.severeCases,
    );

    if (
      normalized.includes("total") &&
      normalized.includes("case")
    ) {
      return {
        content:
          `The current synthetic FIR dataset contains ${totalCases.toLocaleString(
            "en-IN",
          )} registered cases.`,
        rows: [
          {
            metric: "Total registered cases",
            value: totalCases.toLocaleString(
              "en-IN",
            ),
          },
        ],
        confidence: "High",
        basis:
          "Direct COUNT(*) aggregation over CaseMaster records.",
        entities: ["FIR records"],
        citations: ["CaseMaster.CaseID"],
      };
    }

    if (
      normalized.includes("active") ||
      normalized.includes(
        "under investigation",
      )
    ) {
      const percentage = totalCases
        ? (
            (activeInvestigations /
              totalCases) *
            100
          ).toFixed(1)
        : "0.0";

      return {
        content:
          `${activeInvestigations.toLocaleString(
            "en-IN",
          )} cases are under active investigation, representing ${percentage}% of all registered cases in the dataset.`,
        rows: [
          {
            metric: "Active investigations",
            value:
              activeInvestigations.toLocaleString(
                "en-IN",
              ),
          },
          {
            metric: "Share of total cases",
            value: `${percentage}%`,
          },
        ],
        confidence: "High",
        basis: `Derived from case-status filters (${activeInvestigations.toLocaleString(
          "en-IN",
        )} active of ${totalCases.toLocaleString(
          "en-IN",
        )} total).`,
        entities: ["Under-investigation cases"],
        citations: ["CaseMaster.CaseStatus", "UnitMaster"],
      };
    }

    if (
      normalized.includes("heinous") ||
      normalized.includes("severe") ||
      normalized.includes("gravity")
    ) {
      const percentage = totalCases
        ? (
            (heinousOffences /
              totalCases) *
            100
          ).toFixed(1)
        : "0.0";

      return {
        content:
          `${heinousOffences.toLocaleString(
            "en-IN",
          )} cases are classified as heinous offences, representing ${percentage}% of the dataset.`,
        rows: [
          {
            metric: "Heinous offences",
            value:
              heinousOffences.toLocaleString(
                "en-IN",
              ),
          },
          {
            metric: "Share of total cases",
            value: `${percentage}%`,
          },
        ],
        confidence: "High",
        basis:
          "Severity classification derived from FIR offence sections.",
        entities: ["Heinous offence cases"],
        citations: [
          "CaseMaster.OffenceSection",
          "Section 307 IPC",
        ],
      };
    }

    if (
      normalized.includes("district") ||
      normalized.includes("hotspot") ||
      normalized.includes(
        "highest number",
      ) ||
      normalized.includes(
        "highest case",
      )
    ) {
      const rows = topDistricts
        .slice(0, 10)
        .map((district, index) => ({
          rank: index + 1,

          district:
            district.districtName ??
            district.DistrictName ??
            district.name ??
            "Unknown",

          registered_cases: getNumber(
            district.count ??
              district.caseCount,
          ).toLocaleString("en-IN"),
        }));

      const leading = rows[0];

      return {
        content: leading
          ? `${leading.district} has the highest case volume with ${leading.registered_cases} registered cases. The table shows the leading districts calculated directly from CaseMaster and Unit district relationships.`
          : "No district-level records are currently available.",
        rows,
        confidence: "High",
        basis:
          "GROUP BY district_name over CaseMaster joined to UnitMaster.",
        entities: rows
          .slice(0, 3)
          .map((district) => district.district),
        citations: [
          "UnitMaster.DistrictName",
          "CaseMaster.DistrictID",
        ],
      };
    }

    if (
      normalized.includes("repeat") ||
      normalized.includes("offender")
    ) {
      const districtName =
        findDistrictInQuestion(text);

      let matchingOffenders =
        datasetContext.offenders;

      if (districtName) {
        matchingOffenders =
          matchingOffenders.filter(
            (offender) =>
              getArray(
                offender.districts,
              ).some(
                (district) =>
                  String(
                    typeof district ===
                      "string"
                      ? district
                      : district.districtName ??
                          district.name,
                  ).toLowerCase() ===
                  districtName.toLowerCase(),
              ),
          );
      }

      matchingOffenders = [
        ...matchingOffenders,
      ].sort(
        (first, second) =>
          getNumber(second.caseCount) -
          getNumber(first.caseCount),
      );

      const rows = matchingOffenders
        .slice(0, 20)
        .map((offender, index) => ({
          rank: index + 1,

          person:
            offender.name ??
            offender.personName ??
            "Unknown",

          linked_cases: getNumber(
            offender.caseCount ??
              offender.totalCases,
          ),

          districts: getArray(
            offender.districts,
          )
            .map((district) =>
              typeof district === "string"
                ? district
                : district.districtName ??
                  district.name,
            )
            .filter(Boolean)
            .join(", "),

          crime_types: getArray(
            offender.crimeTypes,
          )
            .map((crime) =>
              typeof crime === "string"
                ? crime
                : crime.name,
            )
            .filter(Boolean)
            .join(", "),
        }));

      const locationText = districtName
        ? ` linked to ${districtName}`
        : "";

      return {
        content:
          `${matchingOffenders.length.toLocaleString(
            "en-IN",
          )} repeat offenders${locationText} were found using PersonMasterID links across distinct accused-case records. The table shows the highest case-linked persons.`,
        rows,
        confidence: districtName
          ? "High"
          : "Medium",
        basis: districtName
          ? `Accused-entity grouping across ${districtName} records.`
          : "Accused-entity grouping; confidence limited where person records share names.",
        entities: rows
          .slice(0, 5)
          .map((offender) => offender.person),
        citations: [
          "PersonMaster.PersonMasterID",
          "Accused.CaseNumber",
          "CaseMaster.CaseStatus",
        ]
          .concat(
            districtName
              ? [`UnitMaster.DistrictName = ${districtName}`]
              : [],
          ),
      };
    }

    if (
      normalized.includes("crime") ||
      normalized.includes("category") ||
      normalized.includes("type")
    ) {
      const requestedCrime =
        findCrimeTypeInQuestion(text);

      const rows = crimeTypes.map(
        (crime, index) => ({
          rank: index + 1,

          crime_category:
            crime.crimeHeadName ??
            crime.name ??
            crime.category ??
            "Unknown",

          registered_cases: getNumber(
            crime.count ??
              crime.value ??
              crime.totalCases,
          ).toLocaleString("en-IN"),
        }),
      );

      if (requestedCrime) {
        const selected = rows.find(
          (row) =>
            row.crime_category.toLowerCase() ===
            requestedCrime.toLowerCase(),
        );

        return {
          content: selected
            ? `${selected.crime_category} contains ${selected.registered_cases} registered cases in the current dataset.`
            : `No matching records were found for ${requestedCrime}.`,
          rows: selected ? [selected] : [],
          confidence: "High",
          basis: "GROUP BY OffenceCategory over CaseMaster.",
          entities: selected
            ? [selected.crime_category]
            : [requestedCrime],
          citations: [
            "CaseMaster.CrimeHead",
            "OffenceCategory.CategoryName",
          ],
        };
      }

      const leading = rows[0];

      return {
        content: leading
          ? `${leading.crime_category} is the largest crime category with ${leading.registered_cases} registered cases.`
          : "No crime-category data is currently available.",
        rows,
        confidence: "High",
        basis:
          "Ranking computed from grouped case counts per category.",
        entities: rows
          .slice(0, 3)
          .map((crime) => crime.crime_category),
        citations: [
          "CaseMaster.CrimeHead",
          "OffenceCategory.CategoryName",
        ],
      };
    }

    if (
      normalized.includes("trend") ||
      normalized.includes("month") ||
      normalized.includes("over time") ||
      normalized.includes("latest")
    ) {
      const requestedThreeMonths =
        normalized.includes("three") ||
        normalized.includes("3 month");

      const rows = requestedThreeMonths
        ? monthlyTrend.slice(-3)
        : monthlyTrend.slice(-12);

      const first = rows[0];
      const last = rows.at(-1);

      let content =
        "Monthly case trend calculated from CrimeRegisteredDate.";

      if (first && last) {
        const difference =
          last.cases - first.cases;

        const direction =
          difference > 0
            ? "increased"
            : difference < 0
              ? "decreased"
              : "remained unchanged";

        content =
          `Registered cases ${direction} from ${first.cases.toLocaleString(
            "en-IN",
          )} in ${first.month} to ${last.cases.toLocaleString(
            "en-IN",
          )} in ${last.month}.`;
      }

      return {
        content,
        rows: rows.map((item) => ({
          month: item.month,
          registered_cases:
            item.cases.toLocaleString("en-IN"),
        })),
        confidence: "Medium",
        basis: `Time-series aggregation over ${rows.length} monthly slices of CrimeRegisteredDate.`,
        entities: rows
          .map((item) => item.month)
          .slice(-3),
        citations: ["CaseMaster.CrimeRegisteredDate"],
      };
    }

    return null;
  }

  async function handleSend(selectedQuestion) {
    const finalQuestion =
      typeof selectedQuestion === "string"
        ? selectedQuestion.trim()
        : question.trim();

    if (
      !finalQuestion ||
      isLoading ||
      contextLoading
    ) {
      return;
    }

    const userMessage = {
      id: createId(),
      role: "user",
      content: finalQuestion,
      time: getCurrentTime(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setQuestion("");
    setIsLoading(true);

    try {
      const localResult =
        buildLocalDatasetAnswer(finalQuestion);

      let assistantResult = localResult;

      if (!assistantResult) {
        const backendResult =
          await api.assistant(finalQuestion);

        assistantResult = {
          content:
            backendResult?.answer ??
            backendResult?.summary ??
            "No matching dataset analysis was returned.",

          rows:
            backendResult?.rows ??
            backendResult?.data ??
            [],

          confidence:
            backendResult?.confidence ?? "Medium",

          entities: getArray(
            backendResult?.entities,
          ),

          citations: getArray(
            backendResult?.citations,
          ),

          basis:
            backendResult?.basis ??
            backendResult?.note ??
            "Response generated from the local synthetic FIR dataset.",
        };
      }

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        content: assistantResult.content,
        rows: getArray(assistantResult.rows),
        confidence:
          assistantResult.confidence ?? "Medium",
        entities: getArray(
          assistantResult.entities,
        ),
        citations: getArray(
          assistantResult.citations,
        ),
        basis:
          assistantResult.basis ??
          "Dataset-grounded result generated from the local synthetic CSV records.",
        note:
          assistantResult.note ??
          "Dataset-grounded result generated from the local synthetic CSV records.",
        time: getCurrentTime(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      addAuditLog({
        action: "Generated AI query",
        resource: finalQuestion,
        category: "AI Query",
        status: "Success",
      });
    } catch (error) {
      console.error(
        "Assistant request failed:",
        error,
      );

      addAuditLog({
        action: "Generated AI query",
         resource: finalQuestion,
        category: "AI Query",
       status: "Failed",
    details:
       error?.message ??
       "Assistant request failed",
     });

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content:
            error?.message ??
            "I could not process that dataset query. Confirm that the backend is running and try again.",
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSend(question);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <header className="relative shrink-0 overflow-hidden border-b border-edge bg-surface px-6 py-5 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent" />

        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Sparkles
                className="text-secondary"
                size={24}
              />

              <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                {t("pages.assistant.title")}
              </h1>

              <span className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-medium text-violet-300">
                {t("pages.assistant.badge")}
              </span>
            </div>

            <p className="mt-2 text-sm text-ink-secondary">
              {t("pages.assistant.description")}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-5">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-card xl:flex">
            <div className="shrink-0 border-b border-edge px-5 py-5">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-violet-400"
                />

                <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
                  Investigation Presets
                </h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {presetData.map(
                  ({
                    text,
                    icon: Icon,
                    iconClass,
                  }) => (
                    <button
                      key={text}
                      type="button"
                      disabled={
                        isLoading ||
                        contextLoading
                      }
                      onClick={() =>
                        handleSend(text)
                      }
                      className="group flex w-full items-center gap-4 rounded-2xl border border-edge bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-secondary/50 hover:bg-surface-raised hover:shadow-glow-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                      >
                        <Icon size={20} />
                      </div>

                      <span className="text-sm font-medium leading-6 text-ink-secondary transition group-hover:text-ink">
                        {text}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-edge p-4">
              <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                <div className="flex items-start gap-3">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-violet-400"
                  />

                  <p className="text-xs leading-5 text-slate-300">
                    <span className="font-semibold text-violet-300">
                      Synthetic Dataset Intelligence
                    </span>

                    <br />

                    Results are calculated from the
                    loaded NETRA AI CSV dataset. No
                    real police records or personal
                    data are used.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-edge bg-surface">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-7">
              <div className="mx-auto flex max-w-5xl flex-col gap-7">
                {messages.map((message) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-secondary/50 bg-secondary/10 text-violet-300">
                          <Bot size={21} />
                        </div>
                      )}

                      <div
                        className={`min-w-0 ${
                          isUser
                            ? "max-w-[82%] md:max-w-[65%]"
                            : "max-w-[88%] md:max-w-[78%]"
                        }`}
                      >
                        <div
                          className={`mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300 ${
                            isUser
                              ? "justify-end"
                              : ""
                          }`}
                        >
                          <span>
                            {isUser
                              ? "Investigator"
                              : "NETRA AI"}
                          </span>

                          <span className="text-ink-muted">
                            â€¢
                          </span>

                          <span>
                            {message.time}
                          </span>
                        </div>

                        <div
                          className={`rounded-2xl border px-5 py-4 ${
                            isUser
                              ? "rounded-tr-md border-primary bg-primary text-white"
                              : "rounded-tl-md border-secondary/25 bg-surface-raised text-ink"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-7">
                            {message.content}
                          </p>

                          {message.rows?.length >
                            0 && (
                            <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-edge">
                              <table className="min-w-full text-xs">
                                <thead className="bg-surface">
                                  <tr>
                                    {Object.keys(
                                      message.rows[0],
                                    ).map(
                                      (column) => (
                                        <th
                                          key={
                                            column
                                          }
                                          className="whitespace-nowrap px-4 py-3 text-left font-semibold text-ink"
                                        >
                                          {column
                                            .replace(
                                              /_/g,
                                              " ",
                                            )
                                            .replace(
                                              /\b\w/g,
                                              (
                                                character,
                                              ) =>
                                                character.toUpperCase(),
                                            )}
                                        </th>
                                      ),
                                    )}
                                  </tr>
                                </thead>

                                <tbody>
                                  {message.rows.map(
                                    (
                                      row,
                                      rowIndex,
                                    ) => (
                                      <tr
                                        key={`${message.id}-${rowIndex}`}
                                        className="border-t border-edge"
                                      >
                                        {Object.keys(
                                          message
                                            .rows[0],
                                        ).map(
                                          (
                                            column,
                                          ) => (
                                            <td
                                              key={
                                                column
                                              }
                                              className={`max-w-72 whitespace-normal px-4 py-3 text-ink-secondary ${
                                                isCodeColumn(
                                                  column,
                                                )
                                                  ? "font-mono text-[0.8125rem] text-primary-hover"
                                                  : ""
                                              }`}
                                            >
                                              {row[
                                                column
                                              ] ??
                                                "â€”"}
                                            </td>
                                          ),
                                        )}
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {message.confidence && (
                            <div className="mt-4 border-t border-edge pt-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${
                                    message.confidence ===
                                    "High"
                                      ? "border border-resolved/40 bg-resolved/10 text-resolved-soft"
                                      : message.confidence ===
                                          "Medium"
                                        ? "border border-watch/40 bg-watch/10 text-watch-soft"
                                        : "border border-critical/40 bg-critical/10 text-critical-soft"
                                  }`}
                                >
                                  <FileCheck2 size={13} />

                                  {message.confidence}{" "}
                                  confidence
                                </span>

                                {message.entities?.length >
                                  0 && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {message.entities
                                      .filter(Boolean)
                                      .slice(0, 5)
                                      .map(
                                        (entity) => (
                                          <span
                                            key={
                                              entity
                                            }
                                            className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 font-mono text-[0.6875rem] text-violet-300"
                                          >
                                            <UserRound
                                              size={
                                                11
                                              }
                                            />
                                            {entity}
                                          </span>
                                        ),
                                      )}
                                  </div>
                                )}
                              </div>

                              {message.citations?.length >
                                0 && (
                                <div className="mt-3">
                                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-muted">
                                    Supporting evidence
                                  </p>

                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {message.citations
                                      .filter(Boolean)
                                      .map(
                                        (
                                          citation,
                                        ) =>
                                          /^FIR-/i.test(
                                            citation,
                                          ) ? (
                                            <Link
                                              key={
                                                citation
                                              }
                                              to={`/cases/${citation}`}
                                              className="rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[0.6875rem] text-ink-secondary transition hover:border-primary hover:text-ink"
                                            >
                                              {citation}
                                            </Link>
                                          ) : (
                                            <span
                                              key={
                                                citation
                                              }
                                              className="rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[0.6875rem] text-ink-secondary"
                                            >
                                              {citation}
                                            </span>
                                          ),
                                      )}
                                  </div>
                                </div>
                              )}

                              {message.basis && (
                                <p className="mt-3 text-xs leading-5 text-ink-secondary">
                                  <span className="font-semibold text-slate-300">
                                    Basis:{" "}
                                  </span>
                                  {message.basis}
                                </p>
                              )}
                            </div>
                          )}

                          {message.note && (
                            <div className="mt-4 border-t border-slate-600 pt-3">
                              <p className="text-xs leading-5 text-ink-secondary">
                                {message.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="mt-7 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <UserRound size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="mt-7 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-secondary/50 bg-secondary/10 text-violet-300">
                      <Bot size={21} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <span>NETRA AI</span>

                        <span className="text-ink-muted">
                          â€¢
                        </span>

                        <span>
                          Analysing
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-secondary/25 bg-surface-raised px-5 py-4">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />

                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />

                        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />

                        <span className="ml-2 text-sm text-ink-secondary">
                          Analysing CSV dataset...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t border-edge bg-surface p-4">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-5xl items-center gap-3"
              >
                <input
                  type="text"
                  value={question}
                  disabled={
                    isLoading ||
                    contextLoading
                  }
                  onChange={(event) =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  placeholder={
                    contextLoading
                      ? "Loading FIR dataset..."
                      : "Ask NETRA AI about cases, offenders, crime trends or districts..."
                  }
                  className="h-13 min-w-0 flex-1 rounded-xl border border-edge bg-canvas/70 px-5 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={
                    !question.trim() ||
                    isLoading ||
                    contextLoading
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-glow-primary transition hover:from-primary-hover hover:to-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={19} />
                </button>
              </form>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AICrimeAssistant;