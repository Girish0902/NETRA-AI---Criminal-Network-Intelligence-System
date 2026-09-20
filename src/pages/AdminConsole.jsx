import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  FolderX,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
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
import { useI18n } from "../i18n";

const INVESTIGATORS_KEY = "NETRA-admin-investigators";
const CASE_STATE_KEY = "NETRA-admin-case-state";
const USER_KEY = "NETRA-admin-users";

const SEED_INVESTIGATORS = [
  { id: "KP-INV-104", name: "Const. Dinesh Gowda", district: "Bengaluru Urban", status: "Active" },
  { id: "KP-INV-117", name: "Sgt. Kavya Hegde", district: "Mysuru", status: "Active" },
  { id: "KP-INV-208", name: "Insp. Kiran Shetty", district: "Mangaluru", status: "Active" },
  { id: "KP-INV-231", name: "Insp. Mahesh Rao", district: "Bengaluru Urban", status: "Active" },
];

const SEED_USERS = [
  { id: "KP-ADMIN-001", name: "State Police", role: "Administrator", status: "Active" },
  { id: "KP-INV-104", name: "Const. Dinesh Gowda", role: "Investigator", status: "Active" },
  { id: "KP-INV-117", name: "Sgt. Kavya Hegde", role: "Investigator", status: "Active" },
];

function readJson(key, fallback) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || "null",
    );

    if (Array.isArray(saved)) {
      return saved;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function AdminConsole() {
  const { user } = useAuth();
  const { t } = useI18n();
  const admin = isAdminRole(user?.role);

  const [investigators, setInvestigators] =
    useState(() =>
      readJson(
        INVESTIGATORS_KEY,
        SEED_INVESTIGATORS,
      ),
    );

  const [caseState, setCaseState] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CASE_STATE_KEY) ||
          "null",
      );

      if (saved && typeof saved === "object") {
        return saved;
      }

      return Object.fromEntries(
        caseRecords.map((record) => [
          record.caseNo,
          Boolean(record.isOpen),
        ]),
      );
    } catch {
      return {};
    }
  });

  const [users, setUsers] = useState(() =>
    readJson(USER_KEY, SEED_USERS),
  );

  const [newOfficerName, setNewOfficerName] =
    useState("");
  const [newOfficerDistrict, setNewOfficerDistrict] =
    useState("");

  useEffect(() => {
    localStorage.setItem(
      INVESTIGATORS_KEY,
      JSON.stringify(investigators),
    );
  }, [investigators]);

  useEffect(() => {
    localStorage.setItem(
      CASE_STATE_KEY,
      JSON.stringify(caseState),
    );
  }, [caseState]);

  useEffect(() => {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(users),
    );
  }, [users]);

  if (!admin) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas">
        <PageHeader
          icon={ShieldCheck}
          title={t("pages.admin.title")}
          description={t("pages.admin.descriptionRestricted")}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmptyState
            icon={ShieldCheck}
            title="Administrator access required"
            message="The Admin Console is restricted. Sign in with an administrator account to manage investigators, case assignments and access approvals."
            action={
              <Link
                to={`/access-requests?from=${encodeURIComponent(
                  "/admin",
                )}`}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Request administrator access
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const openCases = caseRecords.filter(
    (record) => caseState[record.caseNo] !== false,
  ).length;

  const closedCases = caseRecords.length - openCases;

  const addInvestigator = () => {
    if (!newOfficerName.trim()) {
      return;
    }

    const next = {
      id: `KP-INV-${String(
        investigators.length + 300,
      )}`,
      name: newOfficerName.trim(),
      district:
        newOfficerDistrict.trim() ||
        "Unassigned",
      status: "Active",
    };

    setInvestigators((current) => [
      ...current,
      next,
    ]);

    setUsers((current) => [
      ...current,
      {
        id: next.id,
        name: next.name,
        role: "Investigator",
        status: "Active",
      },
    ]);

    setNewOfficerName("");
    setNewOfficerDistrict("");

    addAuditLog({
      action: "Added investigator to force",
      resource: next.name,
      category: "Admin",
      status: "Success",
    });
  };

  const removeInvestigator = (
    investigatorId,
  ) => {
    setInvestigators((current) =>
      current.filter(
        (item) => item.id !== investigatorId,
      ),
    );

    setUsers((current) =>
      current.filter(
        (item) => item.id !== investigatorId,
      ),
    );

    addAuditLog({
      action: "Removed investigator",
      resource: investigatorId,
      category: "Admin",
      status: "Success",
    });
  };

  const toggleCase = (caseNo) => {
    setCaseState((current) => ({
      ...current,
      [caseNo]: !(current[caseNo] !== false),
    }));

    addAuditLog({
      action:
        caseState[caseNo] !== false
          ? "Closed case for investigation"
          : "Reopened case for investigation",
      resource: caseNo,
      category: "Admin",
      status: "Success",
    });
  };

  const activeCases = caseRecords;

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={ShieldCheck}
        title={t("pages.admin.title")}
        description={t("pages.admin.description")}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/audit"
              className="flex items-center gap-2 rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              <ClipboardList size={17} />
              View audit logs
            </Link>

            <Link
              to="/access-requests"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              <CheckCircle2 size={17} />
              Access request queue
            </Link>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active investigators"
            value={investigators.length}
            description="Assigned to case teams"
            icon={Users}
          />

          <StatCard
            title="Open cases"
            value={openCases}
            description="Available for investigation"
            icon={FolderOpen}
            iconTone="success"
          />

          <StatCard
            title="Closed cases"
            value={closedCases}
            description="Investigation concluded"
            icon={FolderX}
          />

          <StatCard
            title="Platform users"
            value={users.length}
            description="Across all roles"
            icon={UserCheck}
            iconTone="warning"
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <Panel
            title="Investigators"
            subtitle="Add or remove investigators on the force"
            action={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-hover">
                {investigators.length} members
              </span>
            }
          >
            <div className="flex gap-2">
              <input
                value={newOfficerName}
                onChange={(event) =>
                  setNewOfficerName(
                    event.target.value,
                  )
                }
                placeholder="Officer name"
                className="min-w-0 flex-1 rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />

              <input
                value={newOfficerDistrict}
                onChange={(event) =>
                  setNewOfficerDistrict(
                    event.target.value,
                  )
                }
                placeholder="District"
                className="min-w-0 flex-1 rounded-xl border border-edge bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />

              <button
                type="button"
                onClick={addInvestigator}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                <UserPlus size={16} />
                Add
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {investigators.map((officer) => (
                <li
                  key={officer.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-canvas px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">
                        {officer.name}
                      </span>

                      <Badge severity="success">
                        {officer.status}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-xs text-ink-muted">
                      <MonoLabel>
                        {officer.id}
                      </MonoLabel>{" "}
                      · {officer.district}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeInvestigator(
                        officer.id,
                      )
                    }
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-edge px-3 py-2 text-xs font-medium text-ink-secondary transition hover:border-danger/40 hover:text-red-300"
                  >
                    <UserMinus size={15} />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Case lifecycle"
            subtitle="Open or close cases for investigation"
          >
            <ul className="space-y-2">
              {activeCases.map((record) => {
                const isOpen =
                  caseState[record.caseNo] !== false;

                return (
                  <li
                    key={record.caseNo}
                    className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-canvas px-4 py-3"
                  >
                    <div className="min-w-0">
                      <MonoLabel className="text-primary-hover">
                        {record.caseNo}
                      </MonoLabel>

                      <span className="ml-3 text-sm text-ink-secondary">
                        {record.crimeHead}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <Badge
                        severity={
                          isOpen
                            ? "success"
                            : "neutral"
                        }
                      >
                        {isOpen
                          ? "Open"
                          : "Closed"}
                      </Badge>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCase(
                            record.caseNo,
                          )
                        }
                        className="rounded-xl border border-edge px-3 py-2 text-xs font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
                      >
                        {isOpen
                          ? "Close case"
                          : "Reopen"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Platform users"
          subtitle="Roles across the NETRA AI deployment"
          className="mt-6"
        >
          <ul className="space-y-2">
            {users.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-edge bg-canvas px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Users
                    size={17}
                    className="shrink-0 text-ink-muted"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {account.name}
                    </p>

                    <p className="text-xs text-ink-muted">
                      <MonoLabel>
                        {account.id}
                      </MonoLabel>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    tone={
                      account.role ===
                      "Administrator"
                        ? "primary"
                        : "neutral"
                    }
                  >
                    {account.role}
                  </Badge>

                  <Badge severity="success">
                    {account.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </main>
    </div>
  );
}

export default AdminConsole;