import { useState } from 'react';
import type { ConsoleAdmin } from '../../lib/adminSession';
import { useAdminSession } from '../../lib/adminSession';
import { clock } from '../../lib/console';
import { PageHead, Panel, RoleBadge } from '../../components/admin/ui';
import { useLang } from '../../i18n';
import { PasswordChangeForm } from './AdminAuth';

/** /admin/account — your details, your session, your password (rev 2.12). */
export default function AdminAccount({ admin, sessionEndsAt }: { admin: ConsoleAdmin; sessionEndsAt: string }) {
  const { t, lang } = useLang();
  const { refresh } = useAdminSession();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHead title={t('admin.nav.account')} lead={t('admin.account.lead')} />
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t('admin.account.details')}>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 p-3 text-[12.5px]">
            <dt className="text-k-muted">{t('admin.name')}</dt>
            <dd>{admin.name}</dd>
            <dt className="text-k-muted">{t('admin.email')}</dt>
            <dd className="break-all font-plexmono text-[12px]">{admin.email}</dd>
            <dt className="text-k-muted">{t('admin.team.col.role')}</dt>
            <dd>
              <RoleBadge role={admin.role} />
            </dd>
            <dt className="text-k-muted">{t('admin.account.session')}</dt>
            <dd className="font-plexmono text-[12px]">{t('admin.sessionEnds', { time: clock(sessionEndsAt, lang) })}</dd>
          </dl>
          <p className="border-t border-k-line px-3 py-2 text-[12px] text-k-text2">{t(`admin.roleDesc.${admin.role}`)}</p>
        </Panel>
        <Panel title={t('admin.account.change')} meta={t('admin.account.note')}>
          <div className="grid gap-3 p-3">
            {saved && (
              <p role="status" className="rounded-[5px] bg-k-ok/15 px-2.5 py-2 text-[12.5px] text-k-ok">
                {t('admin.pw.saved')}
              </p>
            )}
            <PasswordChangeForm
              currentLabel="admin.pw.current"
              onDone={async () => {
                setSaved(true);
                await refresh();
              }}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
