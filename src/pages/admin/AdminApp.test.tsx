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

/** The admin console in the browser (rev 2.12), through the real API handlers. */
const pilotApi = installPilotApi();
const KEY = 'correct horse battery';

beforeAll(() => preloadPages(), 30_000);
beforeEach(() => {
  pilotApi.reset();
  vi.stubEnv('OPS_PASSCODE', KEY);
});
afterEach(() => vi.unstubAllEnvs());

const post = (path: string, body: unknown) => fetch(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());

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

/** The owner has claimed the console (and is signed in, in this browser). */
async function ownerSignedIn() {
  await post('/api/admin/setup', { key: KEY, name: 'Owner', email: 'owner@dashfixe.pt', password: 'owner-password-1' });
}

describe('the admin console', () => {
  it('lets the owner claim it once, with the setup key, and opens as the Super admin', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await user.click(await screen.findByRole('link', { name: 'First time here? Set up the console' }));

    await user.type(screen.getByLabelText('Setup key'), 'not the key at all');
    await user.type(screen.getByLabelText('Name'), 'Owner');
    await user.type(screen.getByLabelText('Email'), 'owner@dashfixe.pt');
    await user.type(screen.getByLabelText('New password'), 'owner-password-1');
    await user.type(screen.getByLabelText('Type it again'), 'owner-password-2');
    await user.click(screen.getByRole('button', { name: 'Become the Super admin' }));
    expect(screen.getByRole('alert')).toHaveTextContent("The two passwords don't match.");

    await user.clear(screen.getByLabelText('Type it again'));
    await user.type(screen.getByLabelText('Type it again'), 'owner-password-1');
    await user.click(screen.getByRole('button', { name: 'Become the Super admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("That isn't the setup key.");

    await user.clear(screen.getByLabelText('Setup key'));
    await user.type(screen.getByLabelText('Setup key'), KEY);
    await user.click(screen.getByRole('button', { name: 'Become the Super admin' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Overview · everyone' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Console' });
    expect(within(nav).getByRole('link', { name: /Team/ })).toHaveAttribute('href', '/admin/team');
    expect(within(nav).getByRole('link', { name: /Audit log/ })).toBeInTheDocument();
    expect(screen.getByText('Add people, change roles, reset passwords')).toBeInTheDocument();
    expect(await screen.findByText('Set up the console')).toBeInTheDocument();
  });

  it('says plainly when the email and password are wrong', async () => {
    const user = userEvent.setup();
    await ownerSignedIn();
    await post('/api/admin/logout', {});
    renderAt('/admin');
    await user.type(await screen.findByLabelText('Email'), 'owner@dashfixe.pt');
    await user.type(screen.getByLabelText('Password'), 'not-my-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("That email and password don't match.");
    expect(screen.queryByRole('link', { name: /Set up the console/ })).not.toBeInTheDocument();
  });

  it('adds a person, shows the message to send once, and disables them after a confirm', async () => {
    const user = userEvent.setup();
    await ownerSignedIn();
    renderAt('/admin/team');

    await user.click(await screen.findByRole('button', { name: '+ Add a person' }));
    await user.type(screen.getByLabelText('Name'), 'Marta Silva');
    await user.type(screen.getByLabelText('Email'), 'marta@dashfixe.pt');
    await user.selectOptions(screen.getByLabelText('Role'), 'supervisor');
    const password = (screen.getByLabelText('Starting password') as HTMLInputElement).value;
    expect(password.length).toBeGreaterThanOrEqual(12);
    await user.click(screen.getByRole('button', { name: 'Add person' }));

    const sent = await screen.findByRole('status');
    expect(sent).toHaveTextContent('Marta Silva can now sign in');
    expect(sent).toHaveTextContent(`email marta@dashfixe.pt · starting password ${password}`);
    const row = screen.getByRole('row', { name: /Marta Silva/ });
    expect(within(row).getByText('Must set password')).toBeInTheDocument();
    expect(within(row).getByLabelText('Role for Marta Silva')).toHaveValue('supervisor');

    await user.click(within(row).getByRole('button', { name: 'Disable' }));
    expect(within(row).getByText("Disable Marta Silva? They're signed out at once.")).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: 'Yes, disable' }));
    expect(await within(row).findByText('Disabled')).toBeInTheDocument();
    // Your own row can't be disabled or re-roled.
    const mine = screen.getByRole('row', { name: /Owner/ });
    expect(within(mine).queryByRole('button', { name: 'Disable' })).not.toBeInTheDocument();
  });

  it('makes a new Admin choose their own password, and keeps the team page from them', async () => {
    const user = userEvent.setup();
    await ownerSignedIn();
    await post('/api/admin/team', { name: 'João Costa', email: 'joao@dashfixe.pt', role: 'admin', password: 'start-admin-pass' });
    await post('/api/admin/logout', {});

    renderAt('/admin/team');
    await user.type(await screen.findByLabelText('Email'), 'joao@dashfixe.pt');
    await user.type(screen.getByLabelText('Password'), 'start-admin-pass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Choose your own password' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Starting password'), 'start-admin-pass');
    await user.type(screen.getByLabelText('New password'), 'joao-own-password');
    await user.type(screen.getByLabelText('Type it again'), 'joao-own-password');
    await user.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByRole('heading', { name: 'Only the Super admin manages the team' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Console' });
    expect(within(nav).queryByRole('link', { name: /Team/ })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /Activity/ })).toBeInTheDocument();
    expect(screen.getByText('João Costa')).toBeInTheDocument();
  });
});
