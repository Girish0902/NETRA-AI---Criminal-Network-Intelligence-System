const ADMIN_ROLES = new Set([
  "administrator",
  "admin",
  "crime intelligence analyst",
]);

export function isAdminRole(role) {
  return ADMIN_ROLES.has(
    String(role ?? "").trim().toLowerCase(),
  );
}

export function roleLabel(role) {
  return isAdminRole(role)
    ? "Administrator"
    : "Investigator";
}