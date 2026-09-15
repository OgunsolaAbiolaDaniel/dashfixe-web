import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { can } from '../../shared/adminRoles';
import { useAdminSession, type ConsoleAdmin } from '../../lib/adminSession';
import { api } from '../../lib/api';
import { clock, environment, roleVars } from '../../lib/console';
import { useLang } from '../../i18n';
import type { StringKey } from '../../i18n/strings';
import { Initials } from './ui';

/**
 * The admin console's frame (rev 2.12) — its own room, deliberately not the
 * customer site's Header (the one-header rule is for the customer and Pro
 * surfaces; docs/ARCHITECTURE.md → "The admin console").
 *
 * Black top bar and sidebar. The viewer's role colour runs along the top bar's
 * bottom edge, marks the current page and fills primary buttons, so everyone
 * always sees which access they're using.
 */
const svg = (d: string) => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" className="flex-none">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONS = {
  overview: svg('M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z'),
  applications: svg('M2 9l2-6h8l2 6v4H2zM2 9h4l1 2h2l1-2h4'),
  reports: svg('M3 14V2M3 3h8l-1.5 3L11 9H3'),
  waitlist: svg('M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01'),
  team: svg('M6 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.5 14c.5-2.5 2.3-4 4.5-4s4 1.5 4.5 4M11 7.5a2 2 0 000-4M12 10c1.4.4 2.3 1.8 2.5 4'),
  audit: svg('M3 2h10v12H3zM6 5h4M6 8h4M6 11h2'),
  requests: svg('M2.5 8.5l3.5 3.5 7.5-8M2.5 3.5h6M2.5 6h3'),
  account: svg('M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 14.5c.6-2.8 2.8-4.5 5.5-4.5s4.9 1.7 5.5 4.5'),
};

type Item = { to: string; label: StringKey; icon: ReactNode; count?: number };

const ENV_TONE = {
  production: 'bg-k-crit/15 text-k-crit',
  preview: 'bg-k-warn/15 text-k-warn',
  local: 'bg-k-muted/15 text-k-text2',
};

export default function AdminShell({ admin, sessionEndsAt, children }: { admin: ConsoleAdmin; sessionEndsAt: string; children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const { signOut } = useAdminSession();
  const { pathname } = useLocation();
  const env = environment();
  // Sign-offs waiting: on everyone's plate for reviewers, your own for Admins. Refreshed per page.
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    let live = true;
    void api<{ requests: Array<{ status: string }> }>('/api/admin/requests').then(
      (r) => live && r.ok && setWaiting(r.data.requests.filter((x) => x.status === 'pending').length),
    );
    return () => {
      live = false;
    };
  }, [pathname]);

  const groups: Array<{ label?: StringKey; items: Item[] }> = [
    { items: [{ to: '/admin', label: 'admin.nav.overview', icon: ICONS.overview }] },
    {
      label: 'admin.nav.work',
      items: [
        { to: '/admin/applications', label: 'admin.nav.applications', icon: ICONS.applications },
        { to: '/admin/reports', label: 'admin.nav.reports', icon: ICONS.reports },
        { to: '/admin/requests', label: 'admin.nav.requests', icon: ICONS.requests, count: waiting },
        ...(can(admin.role, 'waitlist.view') ? [{ to: '/admin/waitlist', label: 'admin.nav.waitlist' as StringKey, icon: ICONS.waitlist }] : []),
      ],
    },
    {
      label: 'admin.nav.administration',
      items: [
        ...(can(admin.role, 'team.manage') ? [{ to: '/admin/team', label: 'admin.nav.team' as StringKey, icon: ICONS.team }] : []),
        { to: '/admin/audit', label: can(admin.role, 'audit.all') ? 'admin.nav.audit' : 'admin.nav.activity', icon: ICONS.audit },
      ],
    },
    { label: 'admin.nav.you', items: [{ to: '/admin/account', label: 'admin.nav.account', icon: ICONS.account }] },
  ];
  const isCurrent = (to: string) => (to === '/admin' ? /^\/admin\/?$/.test(pathname) : pathname.startsWith(to));
  const section = groups.flatMap((g) => g.items).find((i) => isCurrent(i.to))?.label ?? 'admin.nav.overview';

  return (
    <div style={roleVars(admin.role)} className="flex min-h-screen flex-col bg-k-bg font-plex text-[13px] leading-[1.45] text-k-text [font-variant-numeric:tabular-nums]">
      <header className="relative z-10 flex h-[46px] flex-none items-center gap-3 border-b border-k-line bg-k-panel px-3.5 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-[var(--acc)] after:content-['']">
        <Link to="/admin" className="flex items-center gap-2 text-[14px] font-bold text-k-text hover:text-k-text md:w-[180px]">
          Dashfixe
          <span className="rounded-[3px] border border-[var(--acc-line)] px-[5px] py-px font-plexmono text-[10px] font-semibold tracking-[.08em] text-[var(--acc-text)]">
            {t('admin.brandTag')}
          </span>
        </Link>
        <span className={`rounded-[3px] px-[7px] py-[2px] font-plexmono text-[10.5px] font-semibold tracking-[.06em] ${ENV_TONE[env]}`}>{t(`admin.env.${env}`)}</span>
        <span className="hidden truncate text-[12.5px] text-k-muted sm:inline">
          {t('admin.title')} / <span className="font-semibold text-k-text">{t(section)}</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')}
            aria-label={t('admin.language')}
            className="rounded-[4px] border border-k-line2 px-1.5 py-px font-plexmono text-[11px] text-k-text2 hover:bg-k-hover hover:text-k-text"
          >
            {lang}
          </button>
          <div className="flex items-center gap-2">
            <Initials name={admin.name} mine />
            <div className="hidden leading-tight sm:block">
              <span className="block text-[12.5px] font-semibold">{admin.name}</span>
              <span className="block text-[11px] text-[var(--acc-text)]">{t(`admin.role.${admin.role}`)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-[5px] border border-k-line2 px-2 py-[3px] text-[12px] text-k-text2 transition hover:bg-k-hover hover:text-k-text"
          >
            {t('admin.signOut')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:grid md:grid-cols-[206px_minmax(0,1fr)]">
        <nav
          aria-label={t('admin.nav.label')}
          className="flex gap-1 overflow-x-auto border-b border-k-line bg-k-panel p-2 md:flex-col md:gap-3.5 md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-3"
        >
          {groups.map((group, g) => (
            <div key={g} className="flex gap-px md:grid">
              {group.label && (
                <span className="hidden px-2.5 pb-1.5 pt-0.5 font-plexmono text-[10.5px] font-semibold uppercase tracking-[.08em] text-k-muted md:block">
                  {t(group.label)}
                </span>
              )}
              {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isCurrent(item.to) ? 'page' : undefined}
                    className={
                      'relative flex items-center gap-2.5 whitespace-nowrap rounded-[5px] px-2.5 py-1.5 font-medium transition ' +
                      (isCurrent(item.to)
                        ? "bg-[var(--acc-soft)] text-k-text hover:text-k-text md:before:absolute md:before:-left-2 md:before:inset-y-1.5 md:before:w-[2px] md:before:rounded md:before:bg-[var(--acc)] md:before:content-['']"
                        : 'text-k-text2 hover:bg-k-hover hover:text-k-text')
                    }
                  >
                    {item.icon}
                    {t(item.label)}
                    {item.count ? (
                      <em className="ml-auto rounded-full bg-[var(--acc)] px-1.5 font-plexmono text-[10.5px] not-italic text-white">{item.count}</em>
                    ) : null}
                  </Link>
                ),
              )}
            </div>
          ))}
          <div className="mt-auto hidden border-t border-k-line px-2.5 pt-2.5 font-plexmono text-[11px] text-k-muted md:block">
            {t('admin.sessionEnds', { time: clock(sessionEndsAt, lang) })}
          </div>
        </nav>
        <main className="grid min-w-0 content-start gap-3 p-4 md:px-5">{children}</main>
      </div>
    </div>
  );
}
