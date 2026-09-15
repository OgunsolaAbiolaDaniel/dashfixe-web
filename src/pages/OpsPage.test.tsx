import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import { AuthProvider } from '../auth';
import { LangProvider } from '../i18n';
import { preloadPages } from '../lib/lazyPage';
import { installPilotApi } from '../test/pilotApi.mock';

vi.mock('maplibre-gl', async () => (await import('../test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

const pilotApi = installPilotApi();
const PASSCODE = 'correct horse battery';

beforeAll(() => preloadPages(), 30_000);
beforeEach(() => {
  pilotApi.reset();
  vi.stubEnv('OPS_PHONES', '912 345 678');
  vi.stubEnv('OPS_PASSCODE', PASSCODE);
});
afterEach(() => vi.unstubAllEnvs());

/** A real server-side session through the pilot API, then the app at /ops. */
async function openOpsAs(phone: string) {
  const post = (path: string, body: unknown) => fetch(path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
  await post('/api/artisans/apply', {
    fullName: 'Tiago Ferreira',
    phone: '914 111 222',
    email: 'tiago@example.com',
    trade: 'plumbing',
    profile: { trades: ['carpentry'], experience: '6-10', areas: ['Amora'], availability: ['weekdays'], transport: true, licences: ['gas'], insurance: false },
    consent: true,
  });
  const { devCode } = (await post('/api/auth/request-code', { phone })) as { devCode: string };
  await post('/api/auth/verify', { phone, code: devCode });
  await post('/api/support/report', { jobId: 'dfx-1042', category: 'safety', details: 'He smelled of gas and left' });
  render(
    <MemoryRouter initialEntries={['/ops']}>
      <LangProvider initial="EN">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

describe('/ops, the founders review', () => {
  it('asks the team for the passcode, then reviews an application end to end', async () => {
    const user = userEvent.setup();
    await openOpsAs('912 345 678');

    expect(await screen.findByRole('heading', { name: 'Enter the team passcode' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Passcode'), 'wrong passcode!');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(await screen.findByText("That's not the passcode.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Passcode'));
    await user.type(screen.getByLabelText('Passcode'), PASSCODE);
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    const card = await screen.findByRole('article', { name: 'Tiago Ferreira' });
    expect(screen.getByRole('note')).toHaveTextContent("DATABASE_URL isn't set");
    expect(within(card).getByText('New')).toBeInTheDocument();
    expect(within(card).getByText('Plumbing · Also: Carpentry')).toBeInTheDocument();
    expect(within(card).getByText('6–10')).toBeInTheDocument();
    expect(within(card).getByText('Gas (Lei n.º 15/2015)')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Call \+351914111222/ })).toHaveAttribute('href', 'tel:+351914111222');
    expect(within(card).getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/351914111222');

    await user.type(within(card).getByLabelText(/Note from the call/), 'Has a van, starts Monday');
    await user.click(within(card).getByRole('button', { name: 'Approve' }));

    const reviewed = await screen.findByRole('article', { name: 'Tiago Ferreira' });
    expect(await within(reviewed).findByText('Approved')).toBeInTheDocument();
    expect(within(reviewed).getByLabelText(/Note from the call/)).toHaveValue('Has a van, starts Monday');
    expect(within(reviewed).getByText(/Updated/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^New/ }));
    expect(screen.getByText('No applications here yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Approved/ }));
    expect(screen.getByRole('article', { name: 'Tiago Ferreira' })).toBeInTheDocument();

    // A customer's "Report a problem" lands in the second section.
    await user.click(screen.getByRole('button', { name: /^Problem reports\s*1$/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Problem reports' })).toBeInTheDocument();
    const report = screen.getByRole('article', { name: 'A safety concern' });
    expect(within(report).getByText('Job dfx-1042', { exact: false })).toBeInTheDocument();
    expect(within(report).getByText('He smelled of gas and left')).toBeInTheDocument();
    expect(within(report).getByRole('link', { name: /Call \+351912345678/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lock' }));
    expect(await screen.findByRole('heading', { name: 'Enter the team passcode' })).toBeInTheDocument();
  });

  it('turns away a phone that is not on the team list, whatever it knows', async () => {
    await openOpsAs('915 555 555');
    expect(await screen.findByRole('heading', { name: 'This page is for the Dashfixe team' })).toBeInTheDocument();
    expect(screen.queryByText('Tiago Ferreira')).not.toBeInTheDocument();
  });

  it('says how to set it up when the team variables are missing', async () => {
    vi.stubEnv('OPS_PASSCODE', '');
    await openOpsAs('912 345 678');
    expect(await screen.findByRole('heading', { name: "The team page isn't set up yet" })).toBeInTheDocument();
  });
});
