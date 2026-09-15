import { Route, Routes } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { AdminSessionProvider, useAdminSession } from '../../lib/adminSession';
import { useConsoleFonts } from '../../lib/console';
import { useLang } from '../../i18n';
import { ConsoleFrame, ForcedPassword, SetupPage, SignInPage } from './AdminAuth';
import AdminOverview from './AdminOverview';
import AdminTeam from './AdminTeam';
import AdminAudit from './AdminAudit';
import AdminAccount from './AdminAccount';
import AdminApplications from './AdminApplications';
import AdminReports from './AdminReports';
import AdminWaitlist from './AdminWaitlist';
import AdminRequests from './AdminRequests';

/**
 * /admin/* — the admin console (rev 2.12). One lazy chunk (routePages.ts), so
 * the customer site never downloads it. docs/ARCHITECTURE.md → "The admin console".
 *
 *   /admin/setup   one-time Super admin setup (OPS_PASSCODE is the key)
 *   /admin         sign in → forced password change if needed → the console
 *   /admin/team    Super admin only
 *   /admin/audit   everyone, scoped by role (all / team / own)
 *   /admin/account
 */
export default function AdminApp() {
  useConsoleFonts();
  return (
    <AdminSessionProvider>
      <Routes>
        <Route path="setup" element={<SetupPage />} />
        <Route path="*" element={<Gate />} />
      </Routes>
    </AdminSessionProvider>
  );
}

function Gate() {
  const { t } = useLang();
  const { state } = useAdminSession();
  if (state.status === 'loading') {
    return (
      <ConsoleFrame>
        <p role="status" className="text-[12.5px] text-k-muted">
          {t('admin.loading')}
        </p>
      </ConsoleFrame>
    );
  }
  if (state.status === 'signedOut') return <SignInPage setupNeeded={state.setupNeeded} />;
  const { admin, sessionEndsAt } = state;
  if (admin.mustChange) return <ForcedPassword role={admin.role} />;

  return (
    <AdminShell admin={admin} sessionEndsAt={sessionEndsAt}>
      <Routes>
        <Route index element={<AdminOverview admin={admin} />} />
        <Route path="applications" element={<AdminApplications admin={admin} />} />
        <Route path="reports" element={<AdminReports admin={admin} />} />
        <Route path="waitlist" element={<AdminWaitlist admin={admin} />} />
        <Route path="requests" element={<AdminRequests admin={admin} />} />
        <Route path="team" element={<AdminTeam admin={admin} />} />
        <Route path="audit" element={<AdminAudit admin={admin} />} />
        <Route path="account" element={<AdminAccount admin={admin} sessionEndsAt={sessionEndsAt} />} />
        <Route path="*" element={<p className="text-k-muted">{t('admin.notFound')}</p>} />
      </Routes>
    </AdminShell>
  );
}
