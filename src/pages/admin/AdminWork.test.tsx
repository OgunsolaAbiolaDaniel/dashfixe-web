import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../../AppRoutes';
import { AuthProvider } from '../../auth';
import { LangProvider } from '../../i18n';
import { preloadPages } from '../../lib/lazyPage';
import { installPilotApi } from '../../test/pilotApi.mock';

vi.mock('maplibre-gl', async () => (await import('../../test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

/** The console's work screens (rev 2.13) in the browser, through the real API. */
const pilotApi = installPilotApi();
const KEY = 'correct horse battery';

beforeAll(() => preloadPages(), 30_000);
beforeEach(() => {
  pilotApi.reset();
  vi.stubEnv('OPS_PASSCODE', KEY);
  URL.createObjectURL = vi.fn(() => 'blob:csv');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllEnvs());

const post = (path: string, body: unknown) => fetch(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());

/** The owner sets up the console and a team; then this browser signs in as `who`. */
async function consoleAs(who: 'supervisor' | 'admin') {
  await post('/api/admin/setup', { key: KEY, name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' });
  await post('/api/admin/team', { name: 'Marta Silva', email: 'marta@dashfixe.pt', role: 'supervisor', password: 'start-marta-pass' });
  await post('/api/admin/team', { name: 'João Costa', email: 'joao@dashfixe.pt', role: 'admin', password: 'start-joao-pass' });
  await post('/api/artisans/apply', {
    fullName: 'Tiago Ferreira',
    phone: '914 111 222',
    email: 'tiago@example.com',
    trade: 'plumbing',
    profile: { trades: ['carpentry'], experience: '6-10', areas: ['Amora'], availability: ['weekdays'], transport: true, licences: ['gas'], insurance: true },
    consent: true,
  });
  const email = who === 'supervisor' ? 'marta@dashfixe.pt' : 'joao@dashfixe.pt';
  const start = who === 'supervisor' ? 'start-marta-pass' : 'start-joao-pass';
  await post('/api/admin/login', { email, password: start });
  await post('/api/admin/password', { current: start, next: `${who}-own-password` });
}

async function customerReports() {
  const { devCode } = (await post('/api/auth/request-code', { phone: '912 345 678' })) as { devCode: string };
  await post('/api/auth/verify', { phone: '912 345 678', code: devCode });
  await post('/api/support/report', { jobId: 'dfx-2004', category: 'price', details: 'Asked for €20 more' });
  await post('/api/support/report', { jobId: 'dfx-1042', category: 'safety', details: 'Smelled of gas' });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LangProvider initial="EN">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

describe('applications in the console', () => {
  it('lets an Admin take and call an applicant, but not decide', async () => {
    const user = userEvent.setup();
    await consoleAs('admin');
    renderAt('/admin/applications');

    await user.click(await screen.findByRole('button', { name: 'Tiago Ferreira' }));
    const drawer = screen.getByRole('region', { name: 'Tiago Ferreira' });
    expect(within(drawer).getByRole('link', { name: /Call \+351914111222/ })).toHaveAttribute('href', 'tel:+351914111222');
    expect(within(drawer).getByText('Plumbing, Carpentry')).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Take it' }));
    expect(await within(drawer).findByRole('button', { name: 'Let it go' })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Mark called' }));
    expect(await within(drawer).findByText('Called')).toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    // An Admin can't decide; they ask a supervisor instead (rev 2.14).
    expect(within(drawer).getByRole('button', { name: 'Ask a supervisor' })).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'History' }));
    expect(await within(drawer).findByText(/Changed an application's status/)).toBeInTheDocument();
    // No waitlist for an Admin.
    expect(within(screen.getByRole('navigation', { name: 'Console' })).queryByRole('link', { name: /Waitlist/ })).not.toBeInTheDocument();
  });

  it('lets a Supervisor assign, approve and export — and the export is logged', async () => {
    const user = userEvent.setup();
    await consoleAs('supervisor');
    renderAt('/admin/applications?open=1');

    const drawer = await screen.findByRole('region', { name: 'Tiago Ferreira' });
    await user.selectOptions(within(drawer).getByRole('combobox', { name: 'Owner' }), 'João Costa');
    expect(await screen.findByRole('row', { name: /Tiago Ferreira.*João Costa/ })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Approve' }));
    expect(await within(drawer).findByText('Approved')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Reopen' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Exported 1 rows. The export is in the audit log.');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('problem reports in the console', () => {
  it('puts safety first, hands it to a Supervisor, and resolves the rest with a note', async () => {
    const user = userEvent.setup();
    await customerReports();
    await consoleAs('admin');
    renderAt('/admin/reports');

    await screen.findByRole('button', { name: 'A safety concern' });
    // Safety sorts first, whatever arrived first (row 0 is the header).
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('A safety concern');

    await user.click(screen.getByRole('button', { name: 'A safety concern' }));
    const safety = screen.getByRole('region', { name: 'A safety concern' });
    expect(within(safety).getByText(/resolved by a Supervisor/)).toBeInTheDocument();
    expect(within(safety).queryByRole('button', { name: 'Resolve…' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Asked for more than the agreed price' }));
    const price = screen.getByRole('region', { name: 'Asked for more than the agreed price' });
    await user.click(within(price).getByRole('button', { name: 'Mark called back' }));
    await user.click(await within(price).findByRole('button', { name: 'Resolve…' }));
    await user.click(within(price).getByRole('button', { name: 'Resolve with this note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Write what happened and what you did.');
    await user.type(within(price).getByLabelText('What happened, and what we did'), 'Refunded the €20');
    await user.click(within(price).getByRole('button', { name: 'Resolve with this note' }));
    expect(await within(price).findByText('Resolved: Refunded the €20')).toBeInTheDocument();
  });
});
