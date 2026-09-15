/**
 * Who may do what in the admin console — ONE table, read by the server (which
 * enforces it on every request) and by the console (which only hides what the
 * server would refuse). docs/ARCHITECTURE.md → "The admin console".
 *
 * Three roles, least privilege first:
 * - admin      — works the queue: calls, notes, problem reports. Decisions need a
 *                supervisor's sign-off (maker-checker): an Admin sends a request.
 * - supervisor — decides (approve/decline), signs off Admins' requests, resolves
 *                safety reports, assigns work, sees the waitlist and exports.
 * - super      — everything, plus the team itself and the full audit log.
 *
 * Pure module: no imports, safe for the browser and for Node (src/server imports
 * it as '../shared/adminRoles.js').
 */
export const ADMIN_ROLES = ['super', 'supervisor', 'admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === 'string' && (ADMIN_ROLES as readonly string[]).includes(v);
}

export type Permission =
  | 'applications.work'
  | 'applications.decide'
  | 'work.assign'
  | 'reports.work'
  | 'reports.resolveSafety'
  | 'requests.create'
  | 'requests.review'
  | 'waitlist.view'
  | 'data.export'
  | 'audit.team'
  | 'audit.all'
  | 'team.manage';

const ADMIN: readonly Permission[] = ['applications.work', 'reports.work', 'requests.create'];
const SUPERVISOR: readonly Permission[] = [
  ...ADMIN,
  'applications.decide',
  'work.assign',
  'reports.resolveSafety',
  'requests.review',
  'waitlist.view',
  'data.export',
  'audit.team',
];
const SUPER: readonly Permission[] = [...SUPERVISOR, 'audit.all', 'team.manage'];

export const GRANTS: Readonly<Record<AdminRole, readonly Permission[]>> = {
  admin: ADMIN,
  supervisor: SUPERVISOR,
  super: SUPER,
};

export function can(role: AdminRole, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}
