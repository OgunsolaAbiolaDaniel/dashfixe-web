import type { AdminRole } from '../shared/adminRoles';
import type { StringKey } from '../i18n/strings';

/**
 * The admin console's data shapes (rev 2.13) — mirrors of what /api/admin/*
 * returns — and the helpers the work screens share: durations against targets,
 * CSV export, audit labels.
 */
export type ApplicationStatus = 'received' | 'called' | 'approved' | 'declined';
export const APPLICATION_STATUSES: ApplicationStatus[] = ['received', 'called', 'approved', 'declined'];

export type ConsoleApplication = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  trade: string;
  reference?: string;
  createdAt: string;
  status: ApplicationStatus;
  note: string | null;
  reviewedAt: string | null;
  ownerId: number | null;
  calledAt: string | null;
  profile?: {
    trades: string[];
    experience: string;
    areas: string[];
    availability: string[];
    transport: boolean;
    licences: string[];
    insurance: boolean;
  };
};

export type ReportStatus = 'open' | 'called' | 'resolved';
export const REPORT_STATUSES: ReportStatus[] = ['open', 'called', 'resolved'];
export type ReportCategory = 'late' | 'price' | 'quality' | 'damage' | 'safety' | 'other';

export type ConsoleReport = {
  id: number;
  phone: string;
  jobId: string;
  category: ReportCategory;
  details: string | null;
  reference: string;
  createdAt: string;
  status: ReportStatus;
  ownerId: number | null;
  resolution: string | null;
  calledAt: string | null;
  resolvedAt: string | null;
};

export type WaitlistRow = { id: number; email: string; userType: 'HOMEOWNER' | 'ARTISAN'; createdAt: string };
export type Person = { id: number; name: string; role: AdminRole };

export type ConsoleStats = {
  applications: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    new7: number;
    prev7: number;
    daily: number[];
    waiting: number;
    oldestWaitingAt: string | null;
    overdue: number;
    medianFirstCallMs: number | null;
    approvalRate: number | null;
    decided: number;
  };
  reports: { total: number; open: number; safetyOpen: number; overdue: number; daily: number[] };
  waitlist: { total: number; new7: number; daily: number[] } | null;
  coverage: Record<string, Record<string, number>>;
  persistent: boolean;
};

export type AuditEvent = {
  id: number;
  at: string;
  adminId: number | null;
  adminName: string | null;
  role: AdminRole | null;
  action: string;
  record: string | null;
  detail: string | null;
};

/** How an application is named in the audit log and its history. */
export const recordOf = (a: Pick<ConsoleApplication, 'id' | 'reference'>) => a.reference ?? `#${a.id}`;

/** "38m", "5h 12m", "2d 04h". */
export function duration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
  return `${Math.floor(hours / 24)}d ${String(hours % 24).padStart(2, '0')}h`;
}

/** Green until half the target has gone, amber after, red once it's missed. */
export function targetTone(ageMs: number, targetMs: number): 'ok' | 'warn' | 'crit' {
  if (ageMs > targetMs) return 'crit';
  return ageMs > targetMs / 2 ? 'warn' : 'ok';
}

/** RFC 4180 CSV. Cells that a spreadsheet would run as a formula get a leading apostrophe. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))].join('\r\n');
}

/** Save a CSV to the viewer's machine (UTF-8 with a BOM, so Excel reads accents). */
export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The audit log's actions, in words. Unknown ones show their code. */
export const ACTION_LABELS: Record<string, StringKey> = {
  setup: 'admin.action.setup',
  signin: 'admin.action.signin',
  'signin.locked': 'admin.action.signin.locked',
  'password.change': 'admin.action.password.change',
  'team.add': 'admin.action.team.add',
  'team.role': 'admin.action.team.role',
  'team.disable': 'admin.action.team.disable',
  'team.enable': 'admin.action.team.enable',
  'team.password': 'admin.action.team.password',
  'application.status': 'admin.action.application.status',
  'application.note': 'admin.action.application.note',
  'application.assign': 'admin.action.application.assign',
  'report.status': 'admin.action.report.status',
  'report.assign': 'admin.action.report.assign',
  'data.export': 'admin.action.data.export',
};
