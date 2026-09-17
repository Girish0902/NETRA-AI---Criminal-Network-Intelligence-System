import {
  Bot,
  FileSearch,
  Files,
  GitBranch,
  KeyRound,
  Network,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CytoscapeComponent from "react-cytoscapejs";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import MonoLabel from "../components/ui/MonoLabel";
import { getCaseByNumber } from "../data/caseRecords";
import { patternLibraryData } from "../data/patternLibrary";

function buildGraph(caseRecord) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  const caseId = caseRecord.caseNo;

  nodes.push({
    data: {
      id: caseId,
      label: caseRecord.caseNo,
      type: "case",
    },
  });

  caseRecord.accused.forEach((name, index) => {
    const id = `accused-${index}`;
    nodes.push({
      data: {
        id,
        label: name,
        type: "accused",
        risk: "high",
      },
    });
    edges.push({
      data: {
        id: `edge-${caseId}-${id}`,
        source: caseId,
        target: id,
        relation: "accused in",
      },
    });
  });

  caseRecord.victims.forEach((name, index) => {
    const id = `victim-${index}`;
    nodes.push({
      data: { id, label: name, type: "victim" },
    });
    edges.push({
      data: {
        id: `edge-${caseId}-${id}`,
        source: caseId,
        target: id,
        relation: "victim of",
      },
    });
  });

  const districtId = `district-${caseRecord.district}`;
  nodes.push({
    data: {
      id: districtId,
      label: caseRecord.district,
      type: "district",
    },
  });
  edges.push({
    data: {
      id: `edge-${caseId}-${districtId}`,
      source: caseId,
      target: districtId,
      relation: "registered in",
    },
  });

  const caseGraph = patternLibraryData
    .filter(
      (pattern) =>
        (pattern.linkedCases ?? []).includes(
          caseRecord.caseNo,
        ),
    )
    .flatMap((pattern) => pattern.linkedCases ?? [])
    .filter((caseNumber) => caseNumber !== caseRecord.caseNo);

  caseGraph.forEach((caseNumber) => {
    if (seen.has(caseNumber)) {
      return;
    }
    seen.add(caseNumber);

    nodes.push({
      data: { id: caseNumber, label: caseNumber, type: "case" },
    });
    edges.push({
      data: {
        id: `edge-similar-${caseRecord.caseNo}-${caseNumber}`,
        source: caseRecord.caseNo,
        target: caseNumber,
        relation: "linked pattern",
      },
    });
  });

  return [{ nodes, edges }];
}

function InvestigationWorkspace() {
  const params = useParams();
  const caseRecord = getCaseByNumber(params.caseId);

  const [selectedEntity, setSelectedEntity] =
    useState(null);
  const [trail, setTrail] = useState([]);
  const [search, setSearch] = useState("");
  const [searchMessage, setSearchMessage] =
    useState("");

  const elements = useMemo(() => {
    if (!caseRecord) {
      return [];
    }

    return buildGraph(caseRecord);
  }, [caseRecord]);

  if (!caseRecord) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas">
        <PageHeader
          icon={GitBranch}
          title="Investigation Workspace"
          description="Case-scoped entity and evidence workspace"
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmptyState
            icon={FileSearch}
            title="Case unavailable"
            message={`No FIR record matched "${params.caseId ?? ""}". The workspace is scoped to a specific case.`}
            action={
              <Link
                to="/cases"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Find a case
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const handleCy = (cy) => {
    cy.off("tap", "node");
    cy.on("tap", "node", (event) => {
      const nodeData = event.target.data();
      setSelectedEntity(nodeData);
      setTrail((current) => [
        ...current.slice(-4),
        nodeData.label ?? nodeData.id,
      ]);
      setSearchMessage("");
    });
  };

  const handleSearch = () => {
    const term = search.trim().toLowerCase();

    if (!term) {
      setSearchMessage("Enter an entity name to search within this case.");
      return;
    }

    const match = elements.nodes.find((node) =>
      String(node.data.label ?? "")
        .toLowerCase()
        .includes(term),
    );

    if (match) {
      setSelectedEntity(match.data);
      setTrail((current) => [
        ...current.slice(-4),
        match.data.label,
      ]);
      setSearchMessage("");
    } else {
      setSearchMessage("No entity matched the search within this case context.");
    }
  };

  const entityList = elements.nodes
    .filter((node) => node.data.type !== "case")
    .map((node) => node.data);

  const relatedPatterns = patternLibraryData.filter(
    (pattern) =>
      (pattern.linkedCases ?? []).includes(
        caseRecord.caseNo,
      ),
  );

  const accessDenied = caseRecord.access === "requested";

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={GitBranch}
        title="Investigation Workspace"
        description={`Interactive entity analysis for ${caseRecord.caseNo}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/cases/${encodeURIComponent(
                caseRecord.caseNo,
              )}`}
              className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              Case overview
            </Link>

            <Link
              to={`/investigation/${encodeURIComponent(
                caseRecord.caseNo,
              )}/upload`}
              className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              <Files size={17} className="mr-1 inline" />
              Upload evidence
            </Link>

            <Link
              to="/assistant"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              <Bot size={17} />
              Open AI Copilot
            </Link>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {accessDenied && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-5 py-4">
            <KeyRound
              size={18}
              className="mt-0.5 shrink-0 text-amber-300"
            />

            <div>
              <p className="text-sm font-semibold text-amber-200">
                Access request pending
              </p>

              <p className="mt-1 text-sm leading-6 text-ink-secondary">
                The graph and evidence below are shown in a
                limited demonstration state until an
                administrator approves access to this case.
              </p>
            </div>
          </div>
        )}

        <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-edge bg-surface">
            <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4">
              <div>
                <h2 className="font-semibold text-ink">
                  Interactive graph canvas
                </h2>

                <p className="mt-0.5 text-sm text-ink-muted">
                  Tap a node to explore entities and
                  relationships within this case
                </p>
              </div>

              <Badge tone="primary">
                {elements.nodes.length} nodes Â·{" "}
                {elements.edges.length} edges
              </Badge>
            </div>

            {trail.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-canvas px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Multi-hop trail
                </span>

                {trail.map((step, index) => (
                  <span
                    key={`${step}-${index}`}
                    className="flex items-center gap-2 text-xs"
                  >
                    {index > 0 && (
                      <span className="text-ink-muted">
                        â†’
                      </span>
                    )}

                    <MonoLabel className="text-ink-secondary">
                      {step}
                    </MonoLabel>
                  </span>
                ))}
              </div>
            )}

            <div className="min-h-[520px]">
              <CytoscapeComponent
                elements={elements}
                stylesheet={investigationStylesheet}
                cy={handleCy}
                layout={{
                  name: "cose",
                  animate: true,
                  nodeRepulsion: 8000,
                  idealEdgeLength: 110,
                  edgeElasticity: 110,
                  gravity: 0.35,
                  componentSpacing: 80,
                }}
                style={{
                  width: "100%",
                  height: 520,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-edge bg-canvas px-5 py-3">
              <LegendSwatch
                color="#f97316"
                label="Case"
              />
              <LegendSwatch
                color="#ef4444"
                label="Accused"
              />
              <LegendSwatch
                color="#22c55e"
                label="Victim"
              />
              <LegendSwatch
                color="#f59e0b"
                label="District"
              />
            </div>
          </section>

          <div className="space-y-5">
            <Panel
              title="Entity search & relationships"
              action={
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
                  {elements.nodes.length - 1} entities
                </span>
              }
            >
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search entity in this case..."
                  className="min-w-0 flex-1 rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl bg-primary px-4 text-white transition hover:bg-primary-hover"
                  aria-label="Search entities"
                >
                  <Search size={18} />
                </button>
              </div>

              {searchMessage && (
                <p className="mt-3 text-xs leading-5 text-amber-300">
                  {searchMessage}
                </p>
              )}

              {selectedEntity && (
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-primary-hover">
                    Selected entity
                  </p>

                  <p className="mt-1 font-mono text-sm text-ink">
                    {selectedEntity.label}
                  </p>

                  <p className="text-xs capitalize text-ink-muted">
                    {selectedEntity.type}
                    {selectedEntity.risk
                      ? ` Â· ${selectedEntity.risk} risk`
                      : ""}
                  </p>
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {entityList.map((entity) => (
                  <li
                    key={entity.id}
                    className="rounded-xl border border-edge bg-canvas px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <EntityIcon type={entity.type} />

                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium text-ink"
                            title={entity.label}
                          >
                            {entity.label}
                          </p>

                          <p className="text-xs capitalize text-ink-muted">
                            {entity.type}
                          </p>
                        </div>
                      </div>

                      <Badge
                        severity={
                          entity.risk ?? "low"
                        }
                      >
                        {entity.risk ?? "Linked"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>

              {entityList.length === 0 && (
                <p className="mt-4 text-sm text-ink-muted">
                  No entities recorded for this case yet.
                </p>
              )}
            </Panel>

            <Panel
              title="Suggested similar cases"
              subtitle="From the Pattern Intelligence Library"
            >
              {relatedPatterns.length === 0 ? (
                <p className="text-sm leading-6 text-ink-muted">
                  No recurring patterns currently reference
                  this case.
                </p>
              ) : (
                relatedPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="mb-4 rounded-xl border border-edge bg-canvas p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">
                        {pattern.name}
                      </p>

                      <Badge severity={pattern.type}>
                        {pattern.confidence}%
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(pattern.linkedCases ?? []).map(
                        (caseNumber) => (
                          <Link
                            key={caseNumber}
                            to={`/investigation/${encodeURIComponent(
                              caseNumber,
                            )}`}
                            className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 transition hover:border-primary/50"
                          >
                            <MonoLabel className="text-primary-hover">
                              {caseNumber}
                            </MonoLabel>
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                ))
              )}

              <Link
                to="/pattern-library"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-hover transition hover:text-primary"
              >
                Browse pattern library
              </Link>
            </Panel>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-edge bg-surface px-4 py-3">
          <Network
            size={15}
            className="mt-0.5 shrink-0 text-ink-muted"
          />

          <p className="text-xs leading-5 text-ink-muted">
            The graph is scoped to this FIR record and its
            linked pattern instances. Use the AI Copilot to
            ask dataset-level questions, or upload evidence
            documents to associate extracted entities with
            this case.
          </p>
        </div>
      </main>
    </div>
  );
}

function LegendSwatch({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-xs text-ink-secondary">
      <span
        className="size-3 rounded-full border border-edge"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function EntityIcon({ type }) {
  if (type === "accused") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/10">
        <UserRound
          size={15}
          className="text-red-300"
        />
      </div>
    );
  }

  if (type === "victim") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
        <UserRound
          size={15}
          className="text-emerald-300"
        />
      </div>
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-warning/10">
      <Network
        size={15}
        className="text-amber-300"
      />
    </div>
  );
}

const investigationStylesheet = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      color: "#f5f5f4",
      "font-size": "10px",
      "text-wrap": "wrap",
      "text-max-width": "100px",
      "text-valign": "bottom",
      "text-margin-y": 10,
      width: 46,
      height: 46,
      "border-width": 2,
      "border-color": "#232326",
      "background-color": "#f97316",
    },
  },
  {
    selector: 'node[type="accused"]',
    style: {
      "background-color": "#ef4444",
      "border-color": "#fca5a5",
      "border-width": 4,
      width: 54,
      height: 54,
    },
  },
  {
    selector: 'node[type="victim"]',
    style: {
      "background-color": "#22c55e",
      "border-color": "#4ade80",
      "border-width": 3,
      width: 44,
      height: 44,
    },
  },
  {
    selector: 'node[type="district"]',
    style: {
      "background-color": "#f59e0b",
      "border-color": "#fcd34d",
      "border-width": 3,
      width: 40,
      height: 40,
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#232326",
      "target-arrow-color": "#232326",
      "target-arrow-shape": "none",
      "curve-style": "bezier",
      label: "data(relation)",
      color: "#a3a3a0",
      "font-size": "8px",
      "text-background-color": "#131315",
      "text-background-opacity": 1,
      "text-background-padding": 3,
    },
  },
  {
    selector: ":selected",
    style: {
      "border-color": "#f5f5f4",
      "border-width": 4,
    },
  },
];

export default InvestigationWorkspace;