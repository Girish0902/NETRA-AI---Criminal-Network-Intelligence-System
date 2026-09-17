import {
  CheckCircle2,
  FileLock2,
  KeyRound,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import StatCard from "../components/ui/StatCard";
import MonoLabel from "../components/ui/MonoLabel";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/roles";
import { caseRecords } from "../data/caseRecords";
import { addAuditLog } from "../utils/auditLogger";

const STORAGE_KEY = "NETRA-access-requests";

const SEED_REQUESTS = [
  {
    id: "req-1001",
    caseNo: "FIR-2026-1041",
    requestor: "Investigator-104",
    requestorName: "Const. Dinesh Gowda",
    role: "Investigator",
    requestedAt: "2026-06-02 09:41",
    status: "pending",
    note:
      "Assigned to follow-up on CCTV timeline matching.",
  },
  {
    id: "req-1002",
    caseNo: "FIR-2026-1028",
    requestor: "Investigator-117",
    requestorName: "Sgt. Kavya Hegde",
    role: "Investigator",
    requestedAt: "2026-06-03 11:05",
    status: "pending",
    note:
      "Needs access to phishing account linkage records.",
  },
  {
    id: "req-1003",
    caseNo: "FIR-2026-0997",
    requestor: "Investigator-104",
    requestorName: "Const. Dinesh Gowda",
    role: "Investigator",
    requestedAt: "2026-06-04 14:27",
    status: "pending",
    note:
      "Identity theft case requires credential analysis.",
  },
];

function readRequests() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );

    if (Array.isArray(saved)) {
      return saved;
    }

    return SEED_REQUESTS;
  } catch {
    return SEED_REQUESTS;
  }
}

function AccessRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(
    readRequests,
  );

  const [selectedCase, setSelectedCase] =
    useState("FIR-2026-0997");
  const [requestNote, setRequestNote] =
    useState("");
  const [requestMessage, setRequestMessage] =
    useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(requests),
    );
  }, [requests]);

  const admin = isAdminRole(user?.role);

  const pendingRequests = requests.filter(
    (request) => request.status === "pending",
  );

  const approvedRequests = requests.filter(
    (request) => request.status === "approved",
  );

  const deniedRequests = requests.filter(
    (request) => request.status === "denied",
  );

  const resolveRequest = (requestId, decision) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: decision,
              decidedBy: user?.employeeId ?? "KP-ADMIN-001",
              decidedAt: new Date().toISOString(),
            }
          : request,
      ),
    );

    const request = requests.find(
      (item) => item.id === requestId,
    );

    addAuditLog({
      action:
        decision === "approved"
          ? "Approved case access request"
          : "Rejected case access request",
      resource: request?.caseNo ?? requestId,
      category: "Access",
      status: "Success",
    });
  };

  const submitRequest = () => {
    if (!selectedCase) {
      setRequestMessage(
        "Select a case to request access to.",
      );
      return;
    }

    const existing = requests.find(
      (request) =>
        request.caseNo === selectedCase &&
        request.status === "pending" &&
        request.requestor ===
          (user?.employeeId ?? "Investigator-104"),
    );

    if (existing) {
      setRequestMessage(
        "An access request for this case is already pending.",
      );
      return;
    }

    const nextRequest = {
      id: `req-${Date.now()}`,
      caseNo: selectedCase,
      requestor: user?.employeeId ?? "Investigator-104",
      requestorName: user?.name ?? "State Police",
      role: isAdminRole(user?.role)
        ? "Administrator"
        : "Investigator",
      requestedAt: new Date().toLocaleString("en-IN"),
      status: "pending",
      note:
        requestNote.trim() ||
        "Standard investigation access request.",
    };

    setRequests((current) => [
      nextRequest,
      ...current,
    ]);

    setRequestNote("");
    setRequestMessage(
      `Access request submitted for ${selectedCase}.`,
    );

    addAuditLog({
      action: "Requested case access",
      resource: selectedCase,
      category: "Access",
      status: "Pending",
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={KeyRound}
        title={
          admin
            ? "Case Access Requests"
            : "Request Case Access"
        }
        description={
          admin
            ? "Approve or reject investigator requests to view restricted case records"
            : "Study a case before requesting access for investigation work"
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Pending"
            value={pendingRequests.length}
            description="Awaiting decision"
            icon={KeyRound}
            iconTone="warning"
          />

          <StatCard
            title="Approved"
            value={approvedRequests.length}
            description="Access granted"
            icon={CheckCircle2}
            iconTone="success"
          />

          <StatCard
            title="Rejected"
            value={deniedRequests.length}
            description="Access declined"
            icon={XCircle}
            iconTone="danger"
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel
            title={admin ? "Approval queue" : "Request access"}
            subtitle={
              admin
                ? `Route: Unassigned → Request access → Access granted`
                : "Submitted requests are visible to the case administrator"
            }
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={FileLock2}
                title="No access requests"
                message="Requests submitted by investigators will appear here for approval."
              />
            ) : (
              <ul className="space-y-3">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="rounded-xl border border-edge bg-canvas p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            to={`/cases/${encodeURIComponent(
                              request.caseNo,
                            )}`}
                            className="font-semibold text-primary-hover transition hover:text-primary-hover"
                          >
                            <MonoLabel className="text-primary-hover">
                              {request.caseNo}
                            </MonoLabel>
                          </Link>

                          <Badge
                            severity={
                              request.status ===
                              "approved"
                                ? "success"
                                : request.status ===
                                    "denied"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {request.status ===
                            "pending"
                              ? "Pending"
                              : request.status ===
                                  "approved"
                                ? "Approved"
                                : "Rejected"}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm text-ink-secondary">
                          Requested by{" "}
                          <span className="text-ink">
                            {request.requestorName}
                          </span>{" "}
                          ({request.role}) on{" "}
                          <MonoLabel>
                            {request.requestedAt}
                          </MonoLabel>
                        </p>

                        <p className="mt-2 text-sm leading-6 text-ink-muted">
                          {request.note}
                        </p>

                        {request.status !==
                          "pending" && (
                          <p className="mt-2 text-xs text-ink-muted">
                            Decided by{" "}
                            <span className="font-mono">
                              {request.decidedBy}
                            </span>{" "}
                            at{" "}
                            <span className="font-mono">
                              {request.decidedAt}
                            </span>
                          </p>
                        )}
                      </div>

                      {admin &&
                        request.status ===
                          "pending" && (
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                resolveRequest(
                                  request.id,
                                  "approved",
                                )
                              }
                              className="flex items-center gap-2 rounded-xl bg-success/90 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-success"
                            >
                              <ShieldCheck
                                size={16}
                              />
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                resolveRequest(
                                  request.id,
                                  "denied",
                                )
                              }
                              className="flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:border-danger/40 hover:text-red-300"
                            >
                              <XCircle
                                size={16}
                              />
                              Reject
                            </button>
                          </div>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="space-y-5">
            {!admin && (
              <Panel
                title="New access request"
                subtitle="Select a restricted case"
              >
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Case
                </label>

                <select
                  value={selectedCase}
                  onChange={(event) => {
                    setSelectedCase(
                      event.target.value,
                    );
                    setRequestMessage("");
                  }}
                  className="mt-2 w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  {caseRecords.map((record) => (
                    <option
                      key={record.caseNo}
                      value={record.caseNo}
                    >
                      {record.caseNo} —{" "}
                      {record.crimeHead}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Justification
                </label>

                <textarea
                  value={requestNote}
                  onChange={(event) =>
                    setRequestNote(
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Why do you need access to this case?"
                  className="mt-2 w-full rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={submitRequest}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
                >
                  <UserPlus size={17} />
                  Submit access request
                </button>

                {requestMessage && (
                  <p className="mt-3 text-xs leading-5 text-amber-300">
                    {requestMessage}
                  </p>
                )}
              </Panel>
            )}

            <Panel title="Workflow reference">
              <ol className="space-y-3 text-sm">
                {[
                  ["1", "Study the existing case record"],
                  ["2", "Submit a case access request"],
                  ["3", "Admin reviews and approves or rejects"],
                  ["4", "Access granted → open the workspace"],
                ].map(([step, label]) => (
                  <li
                    key={step}
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-hover">
                      {step}
                    </span>

                    <span className="text-ink-secondary">
                      {label}
                    </span>
                  </li>
                ))}
              </ol>

              <Link
                to="/admin"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-hover transition hover:text-primary"
              >
                Open admin console
              </Link>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccessRequests;