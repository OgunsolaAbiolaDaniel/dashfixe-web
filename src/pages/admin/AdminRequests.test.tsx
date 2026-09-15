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

/** Supervisor sign-off and discussion (rev 2.14) in the browser, through the real API. */
const pilotApi = installPilotApi();
const KEY = 'correct horse battery';

beforeAll(() => preloadPages(), 30_000);
beforeEach(() => {
  pilotApi.reset();
  vi.stubEnv('OPS_PASSCODE', KEY);
});
afterEach(() => vi.unstubAllEnvs());

const post = (path: string, body: unknown) => fetch(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());

async function setUp() {
  await post('/api/admin/setup', { key: KEY, name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' });
  await post('/api/admin/team', { name: 'Marta Silva', email: 'marta@dashfixe.pt', role: 'supervisor', password: 'start-marta-pass' });
  await post('/api/admin/team', { name: 'João Costa', email: 'joao@dashfixe.pt', role: 'admin', password: 'start-joao-pass' });
  await post('/api/artisans/apply', { fullName: 'Tiago Ferreira', phone: '914 111 222', email: 'tiago@example.com', trade: 'plumbing' });
}

async function signInAs(email: string, start: string, next: string) {
  await post('/api/admin/logout', {});
  await post('/api/admin/login', { email, password: start });
  await post('/api/admin/password', { current: start, next });
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

describe('supervisor sign-off', () => {
  it('lets an Admin ask from the application, and talk it through', async () => {
    const user = userEvent.setup();
    await setUp();
    await signInAs('joao@dashfixe.pt', 'start-joao-pass', 'joao-own-password');
    renderAt('/admin/applications?open=1');

    const drawer = await screen.findByRole('region', { name: 'Tiago Ferreira' });
    await user.click(within(drawer).getByRole('button', { name: 'Ask a supervisor' }));
    await user.click(within(drawer).getByRole('radio', { name: 'decline' }));
    await user.type(within(drawer).getByLabelText('Message (optional)'), 'No gas licence');
    await user.click(within(drawer).getByRole('button', { name: 'Send request' }));

    expect(await within(drawer).findByText('Waiting for a supervisor to decline')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Tiago Ferreira.*Sign-off pending/ })).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Discussion' }));
    expect(await within(drawer).findByText('No gas licence')).toBeInTheDocument();
    await user.type(within(drawer).getByLabelText('Message the team'), 'He can get one by Friday');
    await user.click(within(drawer).getByRole('button', { name: 'Send' }));
    expect(await within(drawer).findByText('He can get one by Friday')).toBeInTheDocument();
  });

  it('lets a Supervisor send one back with a reason, and approve the next from the queue', async () => {
    const user = userEvent.setup();
    await setUp();
    await signInAs('joao@dashfixe.pt', 'start-joao-pass', 'joao-own-password');
    await post('/api/admin/requests', { recordType: 'application', recordId: 1, action: 'approve', note: 'Great call' });
    await signInAs('marta@dashfixe.pt', 'start-marta-pass', 'marta-own-password');
    renderAt('/admin/requests');

    const nav = await screen.findByRole('navigation', { name: 'Console' });
    expect(await within(nav).findByRole('link', { name: /Requests\s*1/ })).toBeInTheDocument();
    const row = await screen.findByRole('row', { name: /João Costa/ });
    expect(within(row).getByText('Great call')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: 'Send back…' }));
    await user.click(within(row).getByRole('button', { name: 'Send back with this reason' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Say why it's going back.");
    await user.type(within(row).getByLabelText("Why it's going back"), 'Check his insurance first');
    await user.click(within(row).getByRole('button', { name: 'Send back with this reason' }));
    await user.click(screen.getByRole('button', { name: /^Sent back/ }));
    expect(await screen.findByText('“Check his insurance first”')).toBeInTheDocument();
  });

  it('applies the decision when a Supervisor approves from the application', async () => {
    const user = userEvent.setup();
    await setUp();
    await signInAs('joao@dashfixe.pt', 'start-joao-pass', 'joao-own-password');
    await post('/api/admin/requests', { recordType: 'application', recordId: 1, action: 'approve' });
    await signInAs('marta@dashfixe.pt', 'start-marta-pass', 'marta-own-password');
    renderAt('/admin/applications?open=1');

    const drawer = await screen.findByRole('region', { name: 'Tiago Ferreira' });
    expect(await within(drawer).findByText('João Costa asks to approve')).toBeInTheDocument();
    // While it waits, the decision goes through the request, not around it.
    expect(within(drawer).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Approve request' }));
    expect(await within(drawer).findByText('Approved')).toBeInTheDocument();
  });
});
