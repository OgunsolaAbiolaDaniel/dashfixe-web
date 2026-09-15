import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES, GRANTS, can, isAdminRole } from './adminRoles';

/** The console's permission table (rev 2.12): the lines that must never move. */
describe('admin roles', () => {
  it('keeps decisions from Admins, who ask a supervisor instead', () => {
    expect(can('admin', 'applications.decide')).toBe(false);
    expect(can('admin', 'requests.create')).toBe(true);
    expect(can('supervisor', 'applications.decide')).toBe(true);
    expect(can('supervisor', 'requests.review')).toBe(true);
    // Those who decide directly never need to ask.
    expect(can('supervisor', 'requests.create')).toBe(false);
    expect(can('super', 'requests.create')).toBe(false);
  });

  it('gives the team and the full audit log to the Super admin alone', () => {
    for (const role of ADMIN_ROLES) {
      expect(can(role, 'team.manage'), role).toBe(role === 'super');
      expect(can(role, 'audit.all'), role).toBe(role === 'super');
    }
    expect(can('supervisor', 'audit.team')).toBe(true);
    expect(can('admin', 'audit.team')).toBe(false);
  });

  it('keeps exports and the waitlist away from Admins', () => {
    expect(can('admin', 'data.export')).toBe(false);
    expect(can('admin', 'waitlist.view')).toBe(false);
    expect(can('supervisor', 'data.export')).toBe(true);
  });

  it('lets everyone work the queue, and grants each permission at most once', () => {
    for (const role of ADMIN_ROLES) {
      expect(can(role, 'applications.work')).toBe(true);
      expect(can(role, 'reports.work')).toBe(true);
      expect(new Set(GRANTS[role]).size).toBe(GRANTS[role].length);
    }
  });

  it('recognises only the three roles', () => {
    expect(ADMIN_ROLES.every(isAdminRole)).toBe(true);
    expect(isAdminRole('owner')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
