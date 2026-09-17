import {
  FileUp,
  FileText,
  Files,
  ScanSearch,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import MonoLabel from "../components/ui/MonoLabel";
import { getCaseByNumber } from "../data/caseRecords";
import { addAuditLog } from "../utils/auditLogger";

const SUPPORTED_TYPES = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "csv",
];

const UPLOAD_STAGES = [
  "File parsing",
  "OCR / ICR extraction",
  "Cleaning & normalisation",
  "Entity extraction",
];

function EvidenceUpload() {
  const params = useParams();
  const caseRecord = getCaseByNumber(params.caseId);

  const [dragActive, setDragActive] =
    useState(false);
  const [selectedFiles, setSelectedFiles] =
    useState([]);
  const [processingMap, setProcessingMap] =
    useState({});
  const [uploadedItems, setUploadedItems] =
    useState([]);

  const uploadProgress = useMemo(() => {
    const values = Object.values(
      processingMap,
    ).filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return 0;
    }

    return Math.round(
      values.reduce((sum, value) => sum + value, 0) /
        values.length,
    );
  }, [processingMap]);

  if (!caseRecord) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas">
        <PageHeader
          icon={UploadCloud}
          title="Evidence Upload"
          description="Attach case documents for parsing and entity extraction"
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmptyState
            icon={Files}
            title="Case not found"
            message={`The evidence target case "${params.caseId ?? ""}" does not exist in the demonstration dataset.`}
          />
        </main>
      </div>
    );
  }

  const handleFiles = (files) => {
    const fileList = Array.from(files ?? []);

    const accepted = fileList.map((file) => ({
      id: `upload-${Date.now()}-${file.name}`,
      name: file.name,
      size: formatBytes(file.size),
      type: inferType(file.name),
    }));

    setSelectedFiles((current) => [
      ...current,
      ...accepted,
    ]);
  };

  const runPipeline = () => {
    if (selectedFiles.length === 0) {
      return;
    }

    const next = { ...processingMap };

    selectedFiles.forEach((file) => {
      next[file.id] = 0;
    });

    setProcessingMap(next);

    selectedFiles.forEach((file) => {
      animateProgress(file.id, 0);
    });
  };

  const animateProgress = (fileId, current) => {
    if (current >= 100) {
      const completedFile = selectedFiles.find(
        (file) => file.id === fileId,
      );

      if (completedFile) {
        setUploadedItems((items) => [
          ...items,
          {
            ...completedFile,
            status: "Processed",
            entities:
              completedFile.type === "Statement"
                ? ["Witness statement"]
                : ["Linked person", "Location"],
          },
        ]);

        setSelectedFiles((currentFiles) =>
          currentFiles.filter(
            (file) => file.id !== fileId,
          ),
        );

        addAuditLog({
          action: "Uploaded case evidence",
          resource: completedFile.name,
          category: "Evidence",
          status: "Success",
        });
      }

      return;
    }

    setProcessingMap((map) => ({
      ...map,
      [fileId]: current,
    }));

    window.setTimeout(() => {
      animateProgress(fileId, current + 20);
    }, 180);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={UploadCloud}
        title="Evidence Upload"
        description={`Upload case documents for ${caseRecord.caseNo}`}
        action={
          <Link
            to={`/investigation/${encodeURIComponent(
              caseRecord.caseNo,
            )}`}
            className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
          >
            Back to investigation workspace
          </Link>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() =>
                setDragActive(false)
              }
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFiles(event.dataTransfer.files);
              }}
              className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
                dragActive
                  ? "border-primary bg-primary/10"
                  : "border-edge bg-surface hover:border-primary/50"
              }`}
            >
              <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <FileUp
                  size={30}
                  className="text-primary-hover"
                />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-ink">
                Drop documents here
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
                Drag and drop FIRs, statements, seizure
                lists, CCTV indexes or other case
                documents. Files pass through parsing,
                OCR/ICR, cleaning and entity extraction.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover">
                <FileText size={17} />
                Browse files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  className="hidden"
                  onChange={(event) =>
                    handleFiles(
                      event.target.files,
                    )
                  }
                />
              </label>

              <p className="mt-4 text-xs text-ink-muted">
                Supported:{" "}
                {SUPPORTED_TYPES.join(" Â· ")}
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <Panel
                title="Documents queued"
                subtitle="Awaiting processing pipeline"
                action={
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
                    {selectedFiles.length} pending
                  </span>
                }
              >
                <ul className="space-y-3">
                  {selectedFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-canvas px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          size={18}
                          className="shrink-0 text-primary-hover"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {file.name}
                          </p>

                          <p className="text-xs text-ink-muted">
                            {file.size} Â· {file.type}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles(
                            (current) =>
                              current.filter(
                                (item) =>
                                  item.id !==
                                  file.id,
                              ),
                          )
                        }
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-danger/10"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={runPipeline}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
                >
                  <ScanSearch size={17} />
                  Run processing pipeline
                </button>
              </Panel>
            )}

            {uploadedItems.length > 0 && (
              <Panel
                title="Processed evidence"
                subtitle="Documents attached to the case"
                action={
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {uploadedItems.length} ready
                  </span>
                }
              >
                <ul className="space-y-3">
                  {uploadedItems.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-edge bg-canvas px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
                            <ShieldCheck
                              size={16}
                              className="text-emerald-300"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {item.name}
                            </p>

                            <p className="text-xs text-ink-muted">
                              {item.size} Â· {
                                item.type
                              }
                            </p>
                          </div>
                        </div>

                        <Badge severity="success">
                          Processed
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.entities.map(
                          (entity) => (
                            <span
                              key={entity}
                              className="rounded-full border border-edge bg-surface-raised px-2.5 py-0.5 text-xs text-ink-secondary"
                            >
                              {entity}
                            </span>
                          ),
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <div className="space-y-5">
            <Panel
              title="Processing pipeline"
              subtitle="Technical Processing Pipeline"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">
                    Overall progress
                  </span>

                  <MonoLabel className="text-primary-hover">
                    {uploadProgress}%
                  </MonoLabel>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>

              <ol className="space-y-4">
                {UPLOAD_STAGES.map(
                  (stage, index) => {
                    const reached =
                      uploadProgress >=
                      ((index + 1) / UPLOAD_STAGES.length) *
                        100;

                    return (
                      <li
                        key={stage}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            reached
                              ? "bg-success/15 text-emerald-300"
                              : "bg-surface-raised text-ink-muted"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <span
                          className={
                            reached
                              ? "text-sm text-ink"
                              : "text-sm text-ink-muted"
                          }
                        >
                          {stage}
                        </span>
                      </li>
                    );
                  },
                )}
              </ol>
            </Panel>

            <div className="rounded-2xl border border-edge bg-surface p-5">
              <h3 className="text-sm font-semibold text-ink">
                Target case
              </h3>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    FIR
                  </span>
                  <MonoLabel className="text-primary-hover">
                    {caseRecord.caseNo}
                  </MonoLabel>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    District
                  </span>
                  <span className="text-ink-secondary">
                    {caseRecord.district}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    Station
                  </span>
                  <span className="text-ink-secondary">
                    {caseRecord.policeStation}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    Evidence on file
                  </span>
                  <span className="text-ink-secondary">
                    {caseRecord.evidence.length}
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

function inferType(name) {
  const extension = String(name ?? "")
    .split(".")
    .pop()
    ?.toLowerCase();

  const map = {
    pdf: "FIR / PDF",
    doc: "Document",
    docx: "Document",
    txt: "Statement",
    csv: "CCTV Log",
  };

  return (
    map[extension] ??
    "Evidence file"
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) {
    return "0 KB";
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export default EvidenceUpload;