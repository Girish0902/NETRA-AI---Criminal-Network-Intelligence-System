const AUDIT_STORAGE_KEY = "NETRA-audit-logs";
const AUDIT_EVENT_NAME = "NETRA-audit-log-change";

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function getCurrentUser() {
  try {
    const savedUser = JSON.parse(
      localStorage.getItem("NETRA-user") || "{}",
    );

    return {
      name:
        savedUser.name ??
        savedUser.displayName ??
        savedUser.username ??
        savedUser.email ??
        "KP-User",

      role:
        savedUser.role ??
        savedUser.designation ??
        "Investigator",
    };
  } catch {
    return {
      name: "KP-User",
      role: "Investigator",
    };
  }
}

export function getAuditLogs() {
  try {
    const storedLogs = JSON.parse(
      localStorage.getItem(AUDIT_STORAGE_KEY) || "[]",
    );

    return Array.isArray(storedLogs)
      ? storedLogs
      : [];
  } catch {
    return [];
  }
}

export function addAuditLog({
  action,
  resource,
  status = "Success",
  category = "Other",
  details = "",
  user,
  role,
}) {
  const currentUser = getCurrentUser();

  const newLog = {
    id: createId(),

    user:
      user ??
      currentUser.name,

    role:
      role ??
      currentUser.role,

    action:
      action || "Performed application action",

    resource:
      resource || "NETRA AI",

    category:
      category || "Other",

    status:
      status === "Denied"
        ? "Denied"
        : status === "Failed"
          ? "Failed"
          : "Success",

    details,

    timestamp: new Date().toISOString(),
  };

  const currentLogs = getAuditLogs();

  const updatedLogs = [
    newLog,
    ...currentLogs,
  ].slice(0, 1000);

  localStorage.setItem(
    AUDIT_STORAGE_KEY,
    JSON.stringify(updatedLogs),
  );

  window.dispatchEvent(
    new CustomEvent(AUDIT_EVENT_NAME, {
      detail: newLog,
    }),
  );

  return newLog;
}

export function clearAuditLogs() {
  localStorage.removeItem(AUDIT_STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent(AUDIT_EVENT_NAME),
  );
}

export function subscribeToAuditLogs(callback) {
  const handleChange = () => {
    callback(getAuditLogs());
  };

  window.addEventListener(
    AUDIT_EVENT_NAME,
    handleChange,
  );

  window.addEventListener(
    "storage",
    handleChange,
  );

  return () => {
    window.removeEventListener(
      AUDIT_EVENT_NAME,
      handleChange,
    );

    window.removeEventListener(
      "storage",
      handleChange,
    );
  };
}