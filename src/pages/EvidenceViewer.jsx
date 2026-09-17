import {
  ArrowLeft,
  Download,
  FileScan,
  Highlighter,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import MonoLabel from "../components/ui/MonoLabel";

const DOCUMENT_CONTENT = {
  "ev-1041-01": {
    title: "FIR Indiranagar 1041",
    type: "FIR",
    uploadedBy: "Asst. SI Nalini Prasad",
    uploadedAt: "2026-04-15",
    size: "2.4 MB",
    body: [
      {
        kind: "heading",
        text: "First Information Report â€” Crime No. 10443000620261041",
      },
      { kind: "meta", text: "Date of registration: 14-04-2026, 23:14 hrs" },
      {
        kind: "meta",
        text: "Police station: Indiranagar, Bengaluru Urban",
      },
      {
        kind: "para",
        text: "Complainant Shri Arjun Rao reported that his two-wheeler parked at the residential lot was found missing on the morning of 14-04-2026. A preliminary inquiry indicates that the theft occurred between 22:10 hrs and 23:40 hrs.",
      },
      {
        kind: "entity",
        text: "Accused person identified from CCTV matching: Ravi Kumar.",
      },
      {
        kind: "para",
        text: "Scene of occurrence was inspected and photographs taken. Vehicle description and insurance particulars attached as annexure.",
      },
    ],
    entities: [
      { label: "Ravi Kumar", type: "Accused", span: "Accused person identified from CCTV" },
      { label: "Arjun Rao", type: "Victim", span: "Complainant Shri Arjun Rao" },
      { label: "Indiranagar PS", type: "Location", span: "Indiranagar, Bengaluru Urban" },
      { label: "IPC 379", type: "Legal", span: "vehicle theft" },
    ],
  },
  "ev-1041-02": {
    title: "CCTV Index Week 15",
    type: "CCTV Log",
    uploadedBy: "Asst. SI Nalini Prasad",
    uploadedAt: "2026-04-17",
    size: "840 KB",
    body: [
      {
        kind: "heading",
        text: "CCTV INDEX â€” ING STATION LIMIT, WEEK 15",
      },
      { kind: "meta", text: "Camera numbering per station asset register" },
      {
        kind: "table",
        rows: [
          ["Camera-ING-12", "Lot exit gate", "22:10â€“23:40", "Person of interest"],
          ["Camera-ING-14", "Main road junction", "22:15â€“23:35", "Vehicle matching"],
          ["Camera-ING-07", "Service road", "22:22", "Kick-start movement"],
        ],
      },
      {
        kind: "entity",
        text: "Frame index links camera observations to FIR-2026-1041 timeline.",
      },
    ],
    entities: [
      { label: "Camera-ING-12", type: "Device", span: "Camera-ING-12" },
      { label: "22:10â€“23:40", type: "Time", span: "22:10â€“23:40" },
      { label: "Person of interest", type: "Entity", span: "Person of interest" },
    ],
  },
  "ev-1041-03": {
    title: "Complainant Statement",
    type: "Statement",
    uploadedBy: "Constable Dinesh Gowda",
    uploadedAt: "2026-04-16",
    size: "96 KB",
    body: [
      {
        kind: "heading",
        text: "Section 161 CrPC Statement â€” Recorded 15-04-2026",
      },
      {
        kind: "para",
        text: "The complainant stated that the vehicle was last seen at approximately 22:00 hrs when returning from the gymnasium. The flat-mate confirmed the vehicle was not present when leaving for work at 06:30 hrs.",
      },
      {
        kind: "entity",
        text: "References to Ravi Kumar as a known local resident with prior two-wheeler theft records.",
      },
      {
        kind: "para",
        text: "Statement read over to the complainant and verified. Signatures recorded before witnesses.",
      },
    ],
    entities: [
      { label: "Ravi Kumar", type: "Accused", span: "known local resident" },
      { label: "Arjun Rao", type: "Victim", span: "The complainant stated" },
      { label: "22:00 hrs", type: "Time", span: "at approximately 22:00 hrs" },
    ],
  },
};

function EvidenceViewer() {
  const params = useParams();
  const documentId = params.documentId ?? "";
  const document = DOCUMENT_CONTENT[documentId] ?? null;

  const [selectedEntity, setSelectedEntity] =
    useState(null);

  const hoveredEntity = useMemo(
    () =>
      selectedEntity
        ? document?.entities?.find(
            (entity) => entity.label === selectedEntity,
          ) ?? null
        : null,
    [selectedEntity, document],
  );

  if (!document) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas">
        <PageHeader
          icon={FileScan}
          title="Evidence Viewer"
          description="Document inspection with extracted-entity overlays"
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmptyState
            icon={ShieldAlert}
            title="Document not found"
            message={`The evidence document "${documentId}" is not available in the demonstration set.`}
            action={
              <Link
                to="/cases"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Browse cases
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={FileScan}
        title={document.title}
        description={`Evidence document with extracted entity overlays`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/cases"
              className="flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              <ArrowLeft size={16} />
              Cases
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Panel
            title="Document viewer"
            subtitle={`${document.type} Â· uploaded by ${document.uploadedBy} Â· ${document.size}`}
            action={
              <Badge severity="success">
                Parsed & indexed
              </Badge>
            }
            bodyClassName="p-6"
          >
            <div className="rounded-xl border border-edge bg-canvas p-8">
              {document.body.map((block, index) =>
                block.kind === "table" ? (
                  <div
                    key={index}
                    className="mb-5 overflow-x-auto rounded-lg border border-edge"
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-raised text-ink-secondary">
                        <tr>
                          <th className="px-3 py-2">
                            Camera
                          </th>
                          <th className="px-3 py-2">
                            Location
                          </th>
                          <th className="px-3 py-2">
                            Window
                          </th>
                          <th className="px-3 py-2">
                            Observation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map(
                          (row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-t border-edge"
                            >
                              {row.map(
                                (
                                  cell,
                                  cellIndex,
                                ) => (
                                  <td
                                    key={cellIndex}
                                    className={
                                      cellIndex ===
                                      0
                                        ? "px-3 py-2 font-mono text-primary-hover"
                                        : "px-3 py-2 text-ink-secondary"
                                    }
                                  >
                                    {cell}
                                  </td>
                                ),
                              )}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : block.kind === "meta" ? (
                  <p
                    key={index}
                    className="mb-5 font-mono text-xs text-ink-muted"
                  >
                    {block.text}
                  </p>
                ) : block.kind === "heading" ? (
                  <h3
                    key={index}
                    className="mb-5 text-base font-semibold text-ink"
                  >
                    {block.text}
                  </h3>
                ) : block.kind === "entity" ? (
                  <p
                    key={index}
                    className="mb-5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-hover"
                  >
                    <Highlighter
                      size={14}
                      className="mr-2 inline text-primary-hover"
                    />
                    {block.text}
                  </p>
                ) : (
                  <p
                    key={index}
                    className="mb-5 text-sm leading-7 text-slate-300"
                  >
                    {block.text}
                  </p>
                ),
              )}
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel
              title="Extracted entities"
              subtitle="Overlay index from OCR + normalisation"
              action={
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
                  {document.entities.length}
                </span>
              }
            >
              <ul className="space-y-2">
                {document.entities.map((entity) => (
                  <li
                    key={entity.label}
                    className="cursor-pointer rounded-xl border border-edge bg-canvas px-4 py-3 transition hover:border-primary/50"
                    onClick={() =>
                      setSelectedEntity(
                        entity.label,
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-ink">
                        {entity.label}
                      </span>

                      <Badge severity={entity.type}>
                        {entity.type}
                      </Badge>
                    </div>

                    <p className="mt-1 truncate text-xs text-ink-muted">
                      {entity.span}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            {hoveredEntity && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
                  Selected entity
                </p>

                <p className="mt-2 font-mono text-lg text-ink">
                  {hoveredEntity.label}
                </p>

                <p className="mt-1 text-sm text-ink-secondary">
                  Classified as {hoveredEntity.type}.
                </p>

                <p className="mt-3 rounded-lg border border-edge bg-canvas px-3 py-2 text-xs leading-5 text-ink-muted">
                  Source span: "{hoveredEntity.span}"
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-edge bg-surface p-5">
              <h3 className="text-sm font-semibold text-ink">
                Provenance
              </h3>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    Evidence ID
                  </span>
                  <MonoLabel className="text-primary-hover">
                    {documentId}
                  </MonoLabel>
                </div>

                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    Uploaded
                  </span>
                  <MonoLabel className="text-ink-secondary">
                    {document.uploadedAt}
                  </MonoLabel>
                </div>

                <div className="flex justify-between">
                  <span className="text-ink-muted">
                    Size
                  </span>
                  <span className="text-ink-secondary">
                    {document.size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EvidenceViewer;