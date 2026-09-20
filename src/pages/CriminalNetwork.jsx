import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CytoscapeComponent from "react-cytoscapejs";

import {
  Crosshair,
  Download,
  Link2,
  Maximize2,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useI18n } from "../i18n";

/* -------------------------------------------------------------------------- */
/*  Palette (kept in sync with the Tailwind tokens used across the dashboard)  */
/* -------------------------------------------------------------------------- */

const COLOR = {
  hub: "#ef4444",
  hubRing: "#fca5a5",
  connected: "#f59e0b",
  connectedRing: "#fcd34d",
  peripheral: "#38bdf8",
  peripheralRing: "#7dd3fc",
  isolated: "#6b6b68",
  isolatedRing: "#3f3f46",
  edge: "#232326",
  edgeActive: "#fb923c",
  label: "#a3a3a0",
  labelOutline: "#131315",
  ring: "#f5f5f4",
};

const TIER_META = {
  hub: {
    label: "Hub",
    dot: "bg-critical",
    text: "text-critical-soft",
    tint: "bg-critical/10",
    help: "Appears with many different co-accused",
  },
  connected: {
    label: "Connected",
    dot: "bg-watch",
    text: "text-watch-soft",
    tint: "bg-watch/10",
    help: "Linked to several other persons",
  },
  peripheral: {
    label: "Peripheral",
    dot: "bg-primary",
    text: "text-primary-hover",
    tint: "bg-primary/10",
    help: "One or two shared-FIR links",
  },
  isolated: {
    label: "Unlinked",
    dot: "bg-slate-500",
    text: "text-ink-secondary",
    tint: "bg-slate-500/10",
    help: "No co-accused in the current dataset",
  },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

function CriminalNetwork() {
  const { t } = useI18n();

  const cyRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const [showUnlinked, setShowUnlinked] = useState(false);
  const [minLinks, setMinLinks] = useState(1);
  const [focusMode, setFocusMode] = useState(false);

  const [layoutTick, setLayoutTick] = useState(0);

  const { data, loading, error } = useApi(() => api.network(), []);



  /* ---------------------------------------------------------------- */
  /*  Normalise the API payload into a real graph                      */
  /* ---------------------------------------------------------------- */

  const graph = useMemo(() => {
    const rawNodes = data?.nodes ?? data?.data?.nodes ?? [];
    const rawEdges = data?.edges ?? data?.data?.edges ?? [];

    const nodes = new Map();

    if (Array.isArray(rawNodes)) {
      rawNodes.forEach((node, index) => {
        const id = String(
          node.id ?? node.personId ?? node.PersonMasterID ?? `person-${index}`,
        );

        const label =
          node.label ?? node.name ?? node.personName ?? "Unknown person";

        if (!id) return;

        nodes.set(id, {
          id,
          label,
          district: node.district ?? node.districtName ?? null,
          cases: toNumber(node.caseCount ?? node.cases ?? node.firCount),
          links: 0,
          weight: 0,
          neighbours: new Set(),
        });
      });
    }

    // Merge duplicate pairs so Aâ€“B never renders twice.
    const merged = new Map();

    if (Array.isArray(rawEdges)) {
      rawEdges.forEach((edge) => {
        const source = String(edge.source ?? edge.sourceId ?? "");
        const target = String(edge.target ?? edge.targetId ?? "");

        if (!source || !target || source === target) return;
        if (!nodes.has(source) || !nodes.has(target)) return;

        const key = [source, target].sort().join("::");
        const weight = Math.max(
          1,
          toNumber(edge.weight ?? edge.count ?? edge.sharedCases) || 1,
        );

        const existing = merged.get(key);

        if (existing) {
          existing.weight += weight;
        } else {
          merged.set(key, { source, target, weight });
        }
      });
    }

    merged.forEach((edge) => {
      const source = nodes.get(edge.source);
      const target = nodes.get(edge.target);

      source.neighbours.add(edge.target);
      target.neighbours.add(edge.source);

      source.weight += edge.weight;
      target.weight += edge.weight;
    });

    nodes.forEach((node) => {
      node.links = node.neighbours.size;
    });

    const degrees = [...nodes.values()]
      .map((node) => node.links)
      .filter((value) => value > 0);

    const maxLinks = degrees.length ? Math.max(...degrees) : 0;
    const maxWeight = merged.size
      ? Math.max(...[...merged.values()].map((edge) => edge.weight))
      : 1;

    // Thresholds adapt to the dataset â€” a fixed "6 links = high" rule
    // produced zero hubs on a graph whose busiest person had 4.
    const hubFloor = Math.max(3, Math.ceil(maxLinks * 0.7));
    const connectedFloor = Math.max(2, Math.ceil(maxLinks * 0.4));

    nodes.forEach((node) => {
      node.tier = classify(node.links, hubFloor, connectedFloor);
    });

    return {
      nodes,
      edges: [...merged.values()],
      maxLinks,
      maxWeight,
      hubFloor,
      connectedFloor,
    };
  }, [data]);

  const nodeList = useMemo(() => [...graph.nodes.values()], [graph]);

  const stats = useMemo(() => {
    const count = (tier) =>
      nodeList.filter((node) => node.tier === tier).length;

    const ranked = [...nodeList]
      .filter((node) => node.links > 0)
      .sort((a, b) => b.links - a.links || b.weight - a.weight);

    return {
      hub: count("hub"),
      connected: count("connected"),
      peripheral: count("peripheral"),
      isolated: count("isolated"),
      total: nodeList.length,
      relationships: graph.edges.length,
      clusters: countComponents(graph.nodes),
      top: ranked.slice(0, 5),
    };
  }, [nodeList, graph]);

  /* ---------------------------------------------------------------- */
  /*  Filtering                                                        */
  /* ---------------------------------------------------------------- */

  const visibleIds = useMemo(() => {
    const keep = new Set();

    nodeList.forEach((node) => {
      if (node.links === 0) {
        if (showUnlinked && minLinks === 0) keep.add(node.id);
        return;
      }

      if (node.links >= minLinks) keep.add(node.id);
    });

    if (focusMode && selectedId && graph.nodes.has(selectedId)) {
      const focus = graph.nodes.get(selectedId);
      const scoped = new Set([selectedId, ...focus.neighbours]);

      focus.neighbours.forEach((id) => {
        graph.nodes.get(id)?.neighbours.forEach((second) => scoped.add(second));
      });

      return new Set([...keep].filter((id) => scoped.has(id)));
    }

    return keep;
  }, [nodeList, graph, showUnlinked, minLinks, focusMode, selectedId]);

  const elements = useMemo(() => {
    const nodes = [...visibleIds]
      .map((id) => graph.nodes.get(id))
      .filter(Boolean)
      .map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          links: node.links,
          weight: node.weight,
          tier: node.tier,
        },
        classes: node.tier,
      }));

    const edges = graph.edges
      .filter(
        (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
      )
      .map((edge) => ({
        data: {
          id: `edge-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          weight: edge.weight,
          relation:
            edge.weight === 1 ? "1 shared FIR" : `${edge.weight} shared FIRs`,
        },
      }));

    return [...nodes, ...edges];
  }, [visibleIds, graph]);

  const selectedNode = selectedId ? graph.nodes.get(selectedId) : null;

  const selectedNeighbours = useMemo(() => {
    if (!selectedNode) return [];

    return [...selectedNode.neighbours]
      .map((id) => graph.nodes.get(id))
      .filter(Boolean)
      .sort((a, b) => b.links - a.links);
  }, [selectedNode, graph]);

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];

    return nodeList
      .filter((node) => node.label.toLowerCase().includes(query))
      .sort((a, b) => b.links - a.links)
      .slice(0, 6);
  }, [search, nodeList]);

  /* ---------------------------------------------------------------- */
  /*  Cytoscape stylesheet                                             */
  /* ---------------------------------------------------------------- */

  const stylesheet = useMemo(() => {
    const maxLinks = Math.max(graph.maxLinks, 1);
    const maxWeight = Math.max(graph.maxWeight, 2);

    return [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "background-color": COLOR.peripheral,
          "border-color": COLOR.peripheralRing,
          "border-width": 2,
          "border-opacity": 0.9,
          width: `mapData(links, 0, ${maxLinks}, 20, 58)`,
          height: `mapData(links, 0, ${maxLinks}, 20, 58)`,
          color: COLOR.label,
          "font-size": 11,
          "font-weight": 500,
          "text-valign": "bottom",
          "text-margin-y": 7,
          "text-wrap": "ellipsis",
          "text-max-width": 110,
          "text-outline-color": COLOR.labelOutline,
          "text-outline-width": 2.5,
          "min-zoomed-font-size": 11,
          "transition-property":
            "background-color, border-color, opacity, width, height",
          "transition-duration": "160ms",
        },
      },
      {
        selector: "node.hub",
        style: {
          "background-color": COLOR.hub,
          "border-color": COLOR.hubRing,
          "border-width": 3,
          "font-size": 13,
          "font-weight": 700,
          "min-zoomed-font-size": 0,
          "z-index": 20,
        },
      },
      {
        selector: "node.connected",
        style: {
          "background-color": COLOR.connected,
          "border-color": COLOR.connectedRing,
          "border-width": 3,
          "min-zoomed-font-size": 8,
          "z-index": 15,
        },
      },
      {
        selector: "node.isolated",
        style: {
          "background-color": COLOR.isolated,
          "border-color": COLOR.isolatedRing,
          width: 14,
          height: 14,
          opacity: 0.5,
          "min-zoomed-font-size": 16,
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          width: `mapData(weight, 1, ${maxWeight}, 1, 5)`,
          "line-color": COLOR.edge,
          opacity: 0.7,
          "target-arrow-shape": "none",
          "transition-property": "line-color, opacity, width",
          "transition-duration": "160ms",
        },
      },
      {
        selector: ".dimmed",
        style: {
          opacity: 0.07,
          "text-opacity": 0,
          events: "no",
        },
      },
      {
        selector: "node.focus",
        style: {
          "border-color": COLOR.ring,
          "border-width": 4,
          "min-zoomed-font-size": 0,
          "font-weight": 700,
          "z-index": 40,
        },
      },
      {
        selector: "node.adjacent",
        style: {
          "border-color": COLOR.edgeActive,
          "border-width": 3,
          "min-zoomed-font-size": 0,
          "z-index": 30,
        },
      },
      {
        selector: "edge.active",
        style: {
          "line-color": COLOR.edgeActive,
          opacity: 1,
          width: `mapData(weight, 1, ${maxWeight}, 2, 6)`,
          label: "data(relation)",
          color: "#fb923c",
          "font-size": 9,
          "text-outline-color": COLOR.labelOutline,
          "text-outline-width": 2.5,
          "min-zoomed-font-size": 0,
          "z-index": 25,
        },
      },
    ];
  }, [graph.maxLinks, graph.maxWeight]);

  const layoutOptions = useMemo(() => ({
    name: "cose",
    animate: false,
    componentSpacing: 140,
    nodeRepulsion: 14000,
    nodeOverlap: 28,
    idealEdgeLength: 100,
    edgeElasticity: 110,
    gravity: 0.35,
    numIter: 1200,
    randomize: true,
    padding: 40,
  }), []);

  /* ---------------------------------------------------------------- */
  /*  Graph interaction                                                */
  /* ---------------------------------------------------------------- */

  const paintHighlight = useCallback((cy, id) => {
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass("dimmed focus adjacent active");

      if (!id) return;

      const node = cy.getElementById(id);
      if (!node || node.empty()) return;

      const hood = node.closedNeighborhood();

      cy.elements().difference(hood).addClass("dimmed");
      node.addClass("focus");
      node.connectedEdges().addClass("active");
      node.neighborhood("node").addClass("adjacent");
    });
  }, []);

  const handleCy = useCallback(
    (cy) => {
      if (cyRef.current === cy) return;
      cyRef.current = cy;

      cy.minZoom(0.15);
      cy.maxZoom(3.5);

      cy.on("tap", "node", (event) => {
        setSelectedId(event.target.id());
        setSearchMessage("");
        setSearchOpen(false);
      });

      cy.on("tap", (event) => {
        if (event.target === cy) {
          setSelectedId(null);
          setFocusMode(false);
        }
      });

      cy.on("mouseover", "node", (event) => {
        setHoveredId(event.target.id());
        cy.container().style.cursor = "pointer";
      });

      cy.on("mouseout", "node", () => {
        setHoveredId(null);
        cy.container().style.cursor = "default";
      });
    },
    [],
  );

  // Re-run layout whenever the visible graph or engine changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || elements.length === 0) return;

    let layout = null;

    try {
      layout = cy.layout(layoutOptions);
      layout.run();
    } catch {
      void layout;
    }

    const timer = setTimeout(() => {
      try {
        cy.fit(undefined, 48);
      } catch {
        void 0;
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      try {
        layout?.stop();
      } catch {
        void layout;
      }
    };
  }, [elements, layoutOptions, layoutTick]);

  useEffect(() => {
    paintHighlight(cyRef.current, selectedId);
  }, [selectedId, elements, paintHighlight]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setSelectedId(null);
        setFocusMode(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focusOn = useCallback(
    (id) => {
      setSelectedId(id);
      setSearchMessage("");
      setSearchOpen(false);

      const cy = cyRef.current;
      if (!cy) return;

      const node = cy.getElementById(id);
      if (!node || node.empty()) return;

      cy.animate(
        { center: { eles: node }, zoom: Math.max(cy.zoom(), 1.1) },
        { duration: 400 },
      );
    },
    [],
  );

  const handleSearch = () => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setSearchMessage("Enter an accused-person name to locate them.");
      return;
    }

    const match =
      nodeList.find((node) => node.label.toLowerCase() === query) ??
      nodeList.find((node) => node.label.toLowerCase().includes(query));

    if (!match) {
      setSelectedId(null);
      setSearchMessage("No accused person matches that name in this dataset.");
      return;
    }

    if (!visibleIds.has(match.id)) {
      if (match.links === 0) {
        setShowUnlinked(true);
        setMinLinks(0);
      } else if (match.links < minLinks) {
        setMinLinks(match.links);
      }
    }

    focusOn(match.id);
  };

  const zoomBy = (factor) => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.animate(
      { zoom: clamp(cy.zoom() * factor, cy.minZoom(), cy.maxZoom()) },
      { duration: 180 },
    );
  };

  const exportPng = () => {
    const cy = cyRef.current;
    if (!cy) return;

    const link = document.createElement("a");
    link.href = cy.png({ full: true, scale: 2, bg: "#131315" });
    link.download = `netra-network-${Date.now()}.png`;
    link.click();
  };

  const hoveredNode = hoveredId ? graph.nodes.get(hoveredId) : null;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Network}
        title={t("pages.network.title")}
        description={t("pages.network.description")}
        action={
          <div className="relative flex gap-2">
            <div className="relative">
              <input
                value={search}
                disabled={loading}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchMessage("");
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search accused person..."
                className="w-64 rounded-xl border border-edge bg-canvas/70 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary disabled:opacity-50"
              />

              {searchOpen && suggestions.length > 0 && (
                <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-edge bg-surface shadow-card">
                  {suggestions.map((node) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSearch(node.label);
                          focusOn(node.id);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-raised"
                      >
                        <span className="truncate">{node.label}</span>
                        <span className="shrink-0 text-xs text-ink-muted">
                          {node.links} links
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSearch}
              className="rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-white shadow-glow-primary transition hover:from-primary-hover hover:to-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={18} />
            </button>
          </div>
        }
      />

      <main className="grid min-h-0 flex-1 gap-5 overflow-hidden p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------------ graph ------------------------------ */}
        <section className="relative flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-3">
            <div className="flex items-center gap-1 rounded-lg border border-edge bg-canvas/60 p-1">
              <ToolButton label="Zoom in" onClick={() => zoomBy(1.3)}>
                <ZoomIn size={16} />
              </ToolButton>

              <ToolButton label="Zoom out" onClick={() => zoomBy(1 / 1.3)}>
                <ZoomOut size={16} />
              </ToolButton>

              <ToolButton
                label="Fit to screen"
                onClick={() => cyRef.current?.fit(undefined, 48)}
              >
                <Maximize2 size={16} />
              </ToolButton>

              <ToolButton
                label="Re-run layout"
                onClick={() => setLayoutTick((tick) => tick + 1)}
              >
                <RefreshCw size={16} />
              </ToolButton>

              <ToolButton label="Export PNG" onClick={exportPng}>
                <Download size={16} />
              </ToolButton>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-edge bg-canvas/60 px-3 py-1.5">
              <span className="text-xs text-ink-muted">Min links</span>

              <select
                value={minLinks}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setMinLinks(value);
                  if (value > 0) setShowUnlinked(false);
                }}
                className="bg-transparent text-xs font-semibold text-ink outline-none"
              >
                <option value={0}>All</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-canvas/60 px-3 py-1.5 text-xs text-ink-secondary">
              <input
                type="checkbox"
                checked={showUnlinked}
                onChange={(event) => {
                  setShowUnlinked(event.target.checked);
                  if (event.target.checked) setMinLinks(0);
                }}
                className="size-3.5 accent-primary"
              />
              Show unlinked ({formatNumber(stats.isolated)})
            </label>

            <button
              type="button"
              disabled={!selectedId}
              onClick={() => setFocusMode((value) => !value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                focusMode
                  ? "border-primary/50 bg-primary/15 text-primary-hover"
                  : "border-edge bg-canvas/60 text-ink-secondary hover:text-ink"
              }`}
            >
              <Crosshair size={14} />
              Focus cluster
            </button>

            <span className="ml-auto text-xs text-ink-muted">
              {formatNumber(elements.filter((el) => !el.data.source).length)} of{" "}
              {formatNumber(stats.total)} persons shown
            </span>
          </div>

          {/* canvas */}
          <div
            className="relative min-h-0 flex-1"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(249,115,22,0.08), transparent 60%), radial-gradient(circle at 12% 88%, rgba(163,163,160,0.05), transparent 45%), #131315",
            }}
          >
            {loading ? (
              <CanvasMessage>
                <span className="inline-flex items-center gap-3">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  Building the co-accused relationship graph...
                </span>
              </CanvasMessage>
            ) : error ? (
              <CanvasMessage>
                <span className="block font-semibold text-critical-soft">
                  Unable to load the criminal network
                </span>
                <span className="mt-2 block text-sm text-ink-secondary">
                  {String(error)}
                </span>
              </CanvasMessage>
            ) : elements.length === 0 ? (
              <CanvasMessage>
                No persons match the current filters. Lower the minimum link
                count to widen the view.
              </CanvasMessage>
            ) : (
              <>
                <CytoscapeComponent
                  elements={elements}
                  stylesheet={stylesheet}
                  cy={handleCy}
                  layout={layoutOptions}
                  wheelSensitivity={0.2}
                  style={{ width: "100%", height: "100%" }}
                />

                {hoveredNode && hoveredId !== selectedId && (
                  <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-edge bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
                    <p className="text-sm font-semibold text-ink">
                      {hoveredNode.label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatNumber(hoveredNode.links)} co-accused Â·{" "}
                      {formatNumber(hoveredNode.weight)} shared FIRs
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ------------------------------ side panel ------------------------------ */}
        <aside className="space-y-4 overflow-y-auto pr-1">
          <Card>
            <CardTitle>Network overview</CardTitle>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric
                label="Persons"
                value={formatNumber(stats.total)}
                icon={Users}
              />
              <Metric
                label="Relationships"
                value={formatNumber(stats.relationships)}
                icon={Link2}
              />
            </div>

            <div className="mt-5 space-y-3">
              <Legend tier="hub" count={stats.hub} />
              <Legend tier="connected" count={stats.connected} />
              <Legend tier="peripheral" count={stats.peripheral} />
              <Legend tier="isolated" count={stats.isolated} />
            </div>

            <p className="mt-4 border-t border-edge pt-3 text-xs leading-5 text-ink-muted">
              {formatNumber(stats.clusters)} connected clusters. Node size
              reflects the number of distinct co-accused; tier thresholds adapt
              to this dataset (hub at {graph.hubFloor}+ links).
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Selected entity</CardTitle>

              {selectedNode && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setFocusMode(false);
                  }}
                  className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-raised hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchMessage && (
              <p className="mt-4 rounded-xl bg-watch/10 px-3 py-2 text-sm leading-6 text-watch-soft">
                {searchMessage}
              </p>
            )}

            {selectedNode ? (
              <div className="mt-4">
                <p className="text-base font-semibold leading-tight text-ink">
                  {selectedNode.label}
                </p>

                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    TIER_META[selectedNode.tier].tint
                  } ${TIER_META[selectedNode.tier].text}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      TIER_META[selectedNode.tier].dot
                    }`}
                  />
                  {TIER_META[selectedNode.tier].label}
                </span>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric
                    label="Co-accused"
                    value={formatNumber(selectedNode.links)}
                  />
                  <Metric
                    label="Shared FIRs"
                    value={formatNumber(selectedNode.weight)}
                  />
                </div>

                {selectedNeighbours.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Linked persons
                    </p>

                    <ul className="mt-2 space-y-1">
                      {selectedNeighbours.map((node) => (
                        <li key={node.id}>
                          <button
                            type="button"
                            onClick={() => focusOn(node.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-secondary transition hover:bg-surface-raised hover:text-ink"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${
                                  TIER_META[node.tier].dot
                                }`}
                              />
                              <span className="truncate">{node.label}</span>
                            </span>

                            <span className="shrink-0 text-xs text-ink-muted">
                              {node.links}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              !searchMessage && (
                <p className="mt-4 text-sm leading-6 text-ink-secondary">
                  Select any node to inspect its co-accused links, or use
                  &ldquo;Focus cluster&rdquo; to isolate its immediate network.
                </p>
              )
            )}
          </Card>

          {stats.top.length > 0 && (
            <Card>
              <CardTitle>Most connected</CardTitle>

              <ol className="mt-3 space-y-1">
                {stats.top.map((node, index) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => focusOn(node.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-surface-raised ${
                        node.id === selectedId ? "bg-surface-raised" : ""
                      }`}
                    >
                      <span className="w-4 shrink-0 text-xs font-bold text-ink-muted">
                        {index + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {node.label}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {formatNumber(node.links)} co-accused Â·{" "}
                          {formatNumber(node.weight)} shared FIRs
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <section className="rounded-2xl border border-edge bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-ink-secondary"
              />

              <p className="text-xs leading-5 text-ink-secondary">
                Nodes are accused records grouped by person. An edge means two
                persons appear in the same FIR. Connectivity tiers are an
                analytical navigation aid â€” not a risk score and not evidence of
                criminal association.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function Card({ children }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
      {children}
    </section>
  );
}

function CardTitle({ children }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
      {children}
    </h2>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-surface-raised px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-muted">
        {Icon && <Icon size={12} />}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function Legend({ tier, count }) {
  const meta = TIER_META[tier];

  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 size-3 shrink-0 rounded-full ${meta.dot}`} />

      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-secondary">
          {meta.label}{" "}
          <span className="text-ink-muted">({formatNumber(count)})</span>
        </p>
        <p className="text-xs text-ink-muted">{meta.help}</p>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-ink-secondary transition hover:bg-surface-raised hover:text-ink"
    >
      {children}
    </button>
  );
}

function CanvasMessage({ children }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="max-w-sm text-center text-sm leading-6 text-ink-secondary">
        {children}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function classify(links, hubFloor, connectedFloor) {
  if (links === 0) return "isolated";
  if (links >= hubFloor) return "hub";
  if (links >= connectedFloor) return "connected";
  return "peripheral";
}

function countComponents(nodes) {
  const seen = new Set();
  let components = 0;

  nodes.forEach((node, id) => {
    if (seen.has(id) || node.links === 0) return;

    components += 1;

    const queue = [id];
    seen.add(id);

    while (queue.length) {
      const current = nodes.get(queue.pop());

      current?.neighbours.forEach((next) => {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      });
    }
  });

  return components;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("en-IN");
}

export default CriminalNetwork;