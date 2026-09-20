import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import {
  MapPinned,
  ShieldAlert,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { useI18n } from "../i18n";

import "leaflet.markercluster/dist/MarkerCluster.css";

const KARNATAKA_BOUNDS = [
  [11.6, 73.95],
  [18.35, 78.0],
];

const KARNATAKA_CENTER = [15.15, 75.7];

const CLUSTER_LOW = "#22c55e";
const CLUSTER_MEDIUM = "#f59e0b";
const CLUSTER_HIGH = "#ef4444";

const POINT_ICON = L.divIcon({
  html: '<div class="netra-map-point"></div>',
  className: "netra-map-point-wrap",
  iconSize: L.point(12, 12),
  iconAnchor: L.point(6, 6),
});

const POINT_ICON_HEINOUS = L.divIcon({
  html: '<div class="netra-map-point netra-map-point--heinous"></div>',
  className: "netra-map-point-wrap",
  iconSize: L.point(14, 14),
  iconAnchor: L.point(7, 7),
});

function FitKarnataka({ points }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(KARNATAKA_BOUNDS, {
      padding: [24, 24],
      maxZoom: 8,
    });
  }, [map]);

  useEffect(() => {
    if (!points.length) {
      return;
    }

    const bounds = L.latLngBounds(
      points.map((point) => [
        point.latitude,
        point.longitude,
      ]),
    );

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 9,
    });
  }, [map, points]);

  return null;
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const colour = getClusterColour(count);
  const size =
    count >= 150 ? 52 : count >= 70 ? 44 : 36;

  const html = [
    '<div class="netra-map-cluster" ',
    `style="--cluster-colour:${colour};width:${size}px;height:${size}px">`,
    `<span>${count}</span>`,
    "</div>",
  ].join("");

  return L.divIcon({
    html,
    className: "netra-map-cluster-wrap",
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
    popupAnchor: L.point(0, -size / 2),
  });
}

function HotspotMap() {
  const { t } = useI18n();
  const {
    data,
    loading,
    error,
  } = useApi(() => api.hotspots(), []);

  const [tilesFailed, setTilesFailed] = useState(false);
  const tileErrorCount = useRef(0);
  const tilesEverLoaded = useRef(false);

  const onTileLoad = useCallback(() => {
    tilesEverLoaded.current = true;
    tileErrorCount.current = 0;
    setTilesFailed(false);
  }, []);

  const onTilesDone = useCallback(() => {
    if (tilesEverLoaded.current) {
      tileErrorCount.current = 0;
      setTilesFailed(false);
    }
  }, []);

  const onTileError = useCallback(() => {
    tileErrorCount.current += 1;
    if (tileErrorCount.current >= 3) {
      setTilesFailed(true);
    }
  }, []);

  const tileLayerRef = useCallback(
    (layer) => {
      if (!layer) {
        return;
      }

      layer.on("tileerror", onTileError);
      layer.on("tileload", onTileLoad);
      layer.on("load", onTilesDone);
    },
    [onTileError, onTileLoad, onTilesDone],
  );

  const points = useMemo(() => {
    const source =
      data?.points ??
      data?.data?.points ??
      [];

    if (!Array.isArray(source)) {
      return [];
    }

    return source
      .map((point, index) => ({
        id:
          point.caseId ??
          point.CaseMasterID ??
          point.id ??
          `point-${index}`,

        crimeNo:
          point.crimeNo ??
          point.CrimeNo ??
          "Not available",

        latitude: toNumber(
          point.latitude ??
            point.Latitude,
        ),

        longitude: toNumber(
          point.longitude ??
            point.Longitude,
        ),

        districtId:
          point.districtId ??
          point.DistrictID ??
          "",

        districtName:
          point.districtName ??
          point.DistrictName ??
          "Unknown",

        crimeHeadName:
          point.crimeHeadName ??
          point.CrimeGroupName ??
          "Unknown",

        gravityOffenceId:
          point.gravityOffenceId ??
          point.GravityOffenceID ??
          null,

        gravityName:
          point.gravityName ??
          point.LookupValue ??
          "Unknown",

        date:
          point.date ??
          point.CrimeRegisteredDate ??
          null,
      }))
      .filter(
        (point) =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude),
      );
  }, [data]);

  const clusters = useMemo(() => {
    const source =
      data?.clusters ??
      data?.data?.clusters ??
      [];

    if (!Array.isArray(source)) {
      return [];
    }

    return source
      .map((cluster, index) => ({
        id:
          cluster.districtId ??
          cluster.DistrictID ??
          `cluster-${index}`,

        districtName:
          cluster.districtName ??
          cluster.DistrictName ??
          "Unknown",

        count: toNumber(
          cluster.count ??
            cluster.caseCount ??
            cluster.totalCases,
        ),

        latitude: toNumber(
          cluster.latitude ??
            cluster.Latitude,
        ),

        longitude: toNumber(
          cluster.longitude ??
            cluster.Longitude,
        ),

        risk: normalizeRisk(cluster.risk),
      }))
      .filter(
        (cluster) =>
          Number.isFinite(cluster.latitude) &&
          Number.isFinite(cluster.longitude),
      )
      .sort(
        (first, second) =>
          second.count - first.count,
      );
  }, [data]);

  const clusterOptions = useMemo(
    () => ({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 60,
      disableClusteringAtZoom: 13,
      zoomToBoundsOnClick: true,
      animate: true,
      iconCreateFunction: createClusterIcon,
    }),
    [],
  );

  const highRiskIncidents = useMemo(() => {
    return points.filter(isHeinousPoint).length;
  }, [points]);

  const mostAffected = clusters[0] ?? {
    districtName: "No data",
    count: 0,
    risk: "low",
  };

  useEffect(() => {
    if (loading || points.length === 0) {
      return;
    }

    const guard = setTimeout(() => {
      if (!tilesEverLoaded.current) {
        setTilesFailed(true);
      }
    }, 6000);

    return () => clearTimeout(guard);
  }, [loading, points.length]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={MapPinned}
        title={t("pages.hotspots.title")}
        description={t("pages.hotspots.description")}
      />

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="netra-hud relative min-h-[600px] overflow-hidden rounded-2xl border border-edge-bright shadow-card">
          <div
            className="absolute inset-0 z-[500]"
            aria-hidden="true"
            style={{ pointerEvents: "none" }}
          >
            <span className="netra-hud__corner netra-hud__corner--tl" />
            <span className="netra-hud__corner netra-hud__corner--br" />

            <div
              className="netra-hud__badges"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
              }}
            >
              <span className="netra-hud__pill">
                {formatNumber(points.length)} MAPPED
              </span>
            </div>

            <div className="netra-hud__badges netra-hud__badges--bottom">
              <span className="netra-hud__pill netra-hud__pill--status">
                <span className="netra-hud__pulse" />
                Live sync
              </span>

              <span className="netra-hud__pill">
                {formatNumber(clusters.length)} district{" "}
                {clusters.length === 1
                  ? "cluster"
                  : "clusters"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-full min-h-[600px] items-center justify-center bg-surface">
              <p className="text-sm text-ink-secondary">
                {t("common.loadingDataset")}
              </p>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[600px] items-center justify-center bg-surface p-6">
              <div className="text-center">
                <p className="font-semibold text-critical-soft">
                  Unable to load hotspot data
                </p>

                <p className="mt-2 text-sm text-ink-secondary">
                  {String(error)}
                </p>
              </div>
            </div>
          ) : points.length === 0 ? (
            <div className="flex h-full min-h-[600px] items-center justify-center bg-surface">
              <p className="text-sm text-ink-secondary">
                No mapped district records are available.
              </p>
            </div>
          ) : (
            <>
              <MapContainer
              center={KARNATAKA_CENTER}
              zoom={7}
              minZoom={6}
              maxZoom={16}
              className="netra-map h-full min-h-[600px] w-full"
              zoomControl={true}
            >
              <TileLayer
                ref={tileLayerRef}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                subdomains="abc"
                maxZoom={19}
              />

              <FitKarnataka points={points} />

              {clusters.map((cluster) => (
                <CircleMarker
                  key={`district-${cluster.id}`}
                  center={[
                    cluster.latitude,
                    cluster.longitude,
                  ]}
                  radius={calculateRadius(
                    cluster.count,
                    clusters,
                  )}
                  pathOptions={{
                    color: getRiskColour(
                      cluster.risk,
                    ),
                    fillColor: getRiskColour(
                      cluster.risk,
                    ),
                    fillOpacity: 0.22,
                    weight: 1.5,
                    dashArray: "4 4",
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={1}
                  >
                    <div className="min-w-44">
                      <strong>
                        {cluster.districtName}
                      </strong>

                      <p className="mt-1 text-xs">
                        Registered cases:{" "}
                        <strong>
                          {formatNumber(
                            cluster.count,
                          )}
                        </strong>
                      </p>

                      <p className="text-xs">
                        Risk: {formatRisk(cluster.risk)}
                      </p>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="min-w-52">
                      <strong>
                        {cluster.districtName}
                      </strong>

                      <p>
                        Registered cases:{" "}
                        {formatNumber(
                          cluster.count,
                        )}
                      </p>

                      <p>
                        Risk classification:{" "}
                        {formatRisk(cluster.risk)}
                      </p>

                      <p>
                        Share of mapped cases:{" "}
                        {calculateShare(
                          cluster.count,
                          points.length,
                        )}
                        %
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              <MarkerClusterGroup {...clusterOptions}>
                {points.map((point) => (
                  <Marker
                    key={point.id}
                    position={[
                      point.latitude,
                      point.longitude,
                    ]}
                    icon={
                      isHeinousPoint(point)
                        ? POINT_ICON_HEINOUS
                        : POINT_ICON
                    }
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -6]}
                      opacity={1}
                    >
                      <div className="min-w-44">
                        <strong>
                          {point.districtName}
                        </strong>

                        <p className="mt-1 text-xs">
                          {point.crimeNo}
                        </p>

                        <p className="text-xs">
                          {point.crimeHeadName}
                        </p>

                        <p className="text-xs">
                          {formatDate(point.date)}
                        </p>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="min-w-52">
                        <strong>
                          {point.districtName}
                        </strong>

                        <p>
                          {point.crimeNo}
                        </p>

                        <p>
                          {point.crimeHeadName}
                        </p>

                        <p>
                          {formatDate(point.date)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>

            {tilesFailed && (
              <div className="netra-map-tiles-fallback">
                <ShieldAlert size={24} />

                <p className="text-sm font-semibold text-ink">
                  Map tiles are temporarily unavailable
                </p>

                <p className="text-sm text-ink-secondary">
                  Please check your connection and try again.
                </p>
              </div>
            )}
              </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
              Hotspot Summary
            </h2>

            <div className="mt-5 space-y-3">
              {[
                [
                  "High-risk incidents",
                  loading
                    ? "..."
                    : formatNumber(
                        highRiskIncidents,
                      ),
                ],
                [
                  "Mapped incidents",
                  loading
                    ? "..."
                    : formatNumber(
                        points.length,
                      ),
                ],
                [
                  "Districts covered",
                  loading
                    ? "..."
                    : formatNumber(
                        clusters.length,
                      ),
                ],
                [
                  "Most affected",
                  loading
                    ? "..."
                    : mostAffected.districtName,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 rounded-xl bg-surface-raised px-4 py-3"
                >
                  <span className="text-sm text-ink-secondary">
                    {label}
                  </span>

                  <span className="text-right font-mono text-sm font-semibold text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-critical/30 bg-critical/10 p-5 shadow-card">
            <div className="flex gap-3">
              <ShieldAlert
                className="shrink-0 text-critical-soft"
                size={20}
              />

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-critical-soft">
                  Emerging hotspot
                </h3>

                {loading ? (
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    Analysing district concentrations...
                  </p>
                ) : clusters.length === 0 ? (
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    No hotspot concentration could be calculated.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {mostAffected.districtName} has
                    the highest concentration of
                    mapped incidents, with{" "}
                    {formatNumber(
                      mostAffected.count,
                    )}{" "}
                    registered cases in the current
                    dataset.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-4 shadow-card">
            <p className="text-xs leading-5 text-ink-muted">
              Incident markers are grouped by
              proximity; cluster circles show the
              number of cases and expand as you zoom.
              Dotted district outlines reflect case
              concentration by police district. The
              data is synthetic and does not
              represent real police incidents.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function isHeinousPoint(point) {
  if (
    point.gravityOffenceId !== null &&
    point.gravityOffenceId !== undefined &&
    point.gravityOffenceId !== ""
  ) {
    return (
      String(point.gravityOffenceId) === "1"
    );
  }

  const gravity = String(
    point.gravityName ?? "",
  ).toLowerCase();

  return (
    gravity.includes("heinous") ||
    gravity.includes("high") ||
    gravity.includes("severe")
  );
}

function normalizeRisk(value) {
  const risk = String(
    value ?? "",
  ).toLowerCase();

  if (risk === "high") {
    return "high";
  }

  if (risk === "medium") {
    return "medium";
  }

  return "low";
}

function getClusterColour(count) {
  if (count >= 100) {
    return CLUSTER_HIGH;
  }

  if (count >= 70) {
    return CLUSTER_MEDIUM;
  }

  return CLUSTER_LOW;
}

function getRiskColour(risk) {
  if (risk === "high") {
    return CLUSTER_HIGH;
  }

  if (risk === "medium") {
    return CLUSTER_MEDIUM;
  }

  return CLUSTER_LOW;
}

function formatRisk(risk) {
  return (
    risk.charAt(0).toUpperCase() +
    risk.slice(1)
  );
}

function calculateRadius(count, clusters) {
  if (!clusters.length) {
    return 10;
  }

  const maximum = Math.max(
    ...clusters.map((cluster) =>
      toNumber(cluster.count),
    ),
    1,
  );

  const minimum = Math.min(
    ...clusters.map((cluster) =>
      toNumber(cluster.count),
    ),
  );

  if (maximum === minimum) {
    return 16;
  }

  const normalized =
    (toNumber(count) - minimum) /
    (maximum - minimum);

  return 10 + normalized * 16;
}

function calculateShare(value, total) {
  if (!total) {
    return "0.0";
  }

  return (
    (toNumber(value) / total) *
    100
  ).toFixed(1);
}

function formatDate(value) {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  return toNumber(value).toLocaleString(
    "en-IN",
  );
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export default HotspotMap;