// ─────────────────────────────────────────────────────────────────────
// Sous-admin permissions.
// The ADMIN always has everything. A SOUS_ADMIN only gets the functions
// the admin ticked for him (stored in User.permissions).
// ADMIN_ONLY functions can never be granted.
// ─────────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  { key: "technicians", label: "Technicians", hint: "Approve, decline, archive, verify, change plan" },
  { key: "support", label: "Support chat", hint: "Answer users in the support inbox" },
  { key: "complaints", label: "Complaints", hint: "Review chat complaints and moderate reported conversations" },
  { key: "users", label: "Users", hint: "See users, reset a face ID" },
  { key: "requests", label: "Requests", hint: "See all service requests" },
  { key: "categories", label: "Categories", hint: "Create / edit categories and images" },
  { key: "plans", label: "Plans", hint: "Edit subscription plans" },
  { key: "payments", label: "Payments", hint: "See payments" },
  { key: "revenue", label: "Revenue", hint: "See revenue and stats" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);

/** Pages that only the ADMIN can open (never grantable). */
export const ADMIN_ONLY_PREFIXES = [
  "/admin/create-account",
  "/admin/plan-config",
  "/admin/team",
  "/admin/activity",
  "/admin/messages",
  "/admin/support",
];

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEYS.includes(value);
}
