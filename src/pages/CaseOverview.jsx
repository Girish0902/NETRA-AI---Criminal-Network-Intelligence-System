import {
  ArrowRight,
  BookOpen,
  Files,
  GitBranch,
  KeyRound,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Panel from "../components/ui/Panel";
import StatCard from "../components/ui/StatCard";
import MonoLabel from "../components/ui/MonoLabel";
import { getCaseByNumber, resolveCaseId } from "../data/caseRecords";
import { getPatternById } from "../data/patternLibrary";

function CaseOverview() {
  const params = useParams();
  const caseId = resolveCaseId(params.id);
  const record = getCaseByNumber(params.id);

  if (!caseId || !record) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas">
        <PageHeader
          icon={BookOpen}
          title="Case not found"
          description="The requested FIR record could not be located in the demonstration dataset."
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmptyState
            icon={ShieldAlert}
            title="No such case record"
            message={`Nothing matched "${params.id ?? ""}". Verify the FIR or case number and try again.`}
            action={
              <Link
                to="/cases"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Back to case search
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const suggestedPattern = getPatternById("pattern-101");

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={BookOpen}
        title="Case Overview"
        description="Consolidated case intelligence for a single FIR record"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/investigation/${encodeURIComponent(
                record.caseNo,
              )}`}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              <GitBranch size={17} />
              Open investigation workspace
            </Link>

            <Link
              to={`/cases?q=${encodeURIComponent(
                record.caseNo,
              )}`}
              className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              Back to search
            </Link>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {record.access === "requested" && (
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
                Your access request for this case is
                awaiting approval from the case
                administrator. Sensitive evidence and the
                investigation workspace are restricted
                until access is granted.
              </p>
            </div>
          </div>
        )}

        <Panel bodyClassName="p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <MonoLabel className="text-primary-hover">
                  {record.caseNo}
                </MonoLabel>

                <Badge>
                  {record.status}
                </Badge>

                <Badge severity="high">
                  {record.gravity} gravity
                </Badge>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-ink">
                {record.crimeHead}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary">
                {record.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                <span>
                  District:{" "}
                  <span className="text-ink-secondary">
                    {record.district}
                  </span>
                </span>

                <span>
                  Police station:{" "}
                  <span className="text-ink-secondary">
                    {record.policeStation}
                  </span>
                </span>

                <span>
                  Registered:{" "}
                  <span className="font-mono text-ink-secondary">
                    {record.registrationDate}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Evidence files"
              value={record.evidence.length}
              description="Processed or awaiting parsing"
              icon={Files}
            />

            <StatCard
              title="Named accused"
              value={record.accused.length}
              description="Linking this FIR"
              icon={Users}
              iconTone="danger"
            />

            <StatCard
              title="Victims"
              value={record.victims.length}
              description="Associated records"
              icon={UserRound}
            />

            <StatCard
              title="Investigators"
              value={record.investigators.length}
              description="Assigned to the case"
              icon={ShieldAlert}
              iconTone="warning"
            />
          </div>
        </Panel>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <Panel
            title="Accused and victims"
            className="xl:col-span-1"
          >
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Accused
                </p>

                <div className="flex flex-wrap gap-2">
                  {record.accused.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-danger/30 bg-danger/5 px-3 py-1 text-sm text-red-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Victims
                </p>

                <div className="flex flex-wrap gap-2">
                  {record.victims.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-success/30 bg-success/5 px-3 py-1 text-sm text-emerald-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Legal sections
                </p>

                <div className="flex flex-wrap gap-2">
                  {record.sections.map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-edge bg-surface-raised px-3 py-1 font-mono text-xs text-ink-secondary"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Evidence"
            subtitle="Documents attached to this case"
            className="xl:col-span-2"
            action={
              <Link
                to={`/investigation/${encodeURIComponent(
                  record.caseNo,
                )}/upload`}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Upload evidence
              </Link>
            }
          >
            {record.evidence.length === 0 ? (
              <EmptyState
                icon={Files}
                title="No evidence files yet"
                message="Upload supporting documents such as FIRs, witness statements, CCTV indexes or seizure lists."
              />
            ) : (
              <ul className="space-y-3">
                {record.evidence.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-edge bg-canvas p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/evidence/${item.id}`}
                          className="truncate font-medium text-ink transition hover:text-primary"
                        >
                          {item.name}
                        </Link>

                        <Badge>{item.type}</Badge>

                        <Badge
                          severity={
                            item.status ===
                            "Processed"
                              ? "success"
                              : "warning"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-ink-muted">
                        Uploaded by {item.uploadedBy} on{" "}
                        <span className="font-mono">
                          {item.uploadedAt}
                        </span>{" "}
                        Â· {item.size}
                      </p>
                    </div>

                    <Link
                      to={`/evidence/${item.id}`}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
                    >
                      View document
                      <ArrowRight size={15} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Panel
            title="Assigned investigators"
            bodyClassName="p-5 pt-4"
          >
            <ul className="space-y-3">
              {record.investigators.map(
                (investigator) => (
                  <li
                    key={`${investigator.name}-${investigator.role}`}
                    className="flex items-center justify-between rounded-xl border border-edge bg-canvas px-4 py-3"
                  >
                    <span className="text-sm font-medium text-ink">
                      {investigator.name}
                    </span>

                    <Badge tone="primary">
                      {investigator.role}
                    </Badge>
                  </li>
                ),
              )}
            </ul>
          </Panel>

          <Panel
            title="Suggest similar cases"
            subtitle="Fed by the Pattern Intelligence Library"
          >
            <p className="text-sm leading-6 text-ink-secondary">
              Matching {suggestedPattern.name.toLowerCase()}{" "}
              pattern (confidence{" "}
              <span className="text-ink">
                {suggestedPattern.confidence}%
              </span>
              ) identifies related FIR records that may
              share accused or modus operandi with this
              case.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedPattern.linkedCases.map(
                (caseNumber) => (
                  <Link
                    key={caseNumber}
                    to={`/cases/${encodeURIComponent(
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

            <Link
              to="/pattern-library"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-hover transition hover:text-primary"
            >
              Open pattern intelligence library
              <ArrowRight size={15} />
            </Link>
          </Panel>
        </div>
      </main>
    </div>
  );
}

export default CaseOverview;