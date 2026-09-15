import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import { AuthProvider } from '../auth';
import { LangProvider } from '../i18n';
import { preloadPages } from '../lib/lazyPage';
import { createJob } from '../lib/jobs';
import { getWallet, redeemCode, spendCredit } from '../lib/wallet';
import { installPilotApi } from '../test/pilotApi.mock';

vi.mock('maplibre-gl', async () => (await import('../test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

/** "Need help with this job?" on /job/:id (rev 2.9): reschedule, cancel, report a problem. */
const pilotApi = installPilotApi();

beforeAll(() => preloadPages(), 30_000);
// Tuesday 15 September 2026, 09:00 — only Date is faked, timers stay real.
beforeEach(() => {
  pilotApi.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 15, 9, 0));
});
afterEach(() => vi.useRealTimers());

/** A real server-side session (so a report can be sent), then the app at `path`. */
async function openJob(path: string, { session = true } = {}) {
  if (session) {
    const post = (p: string, body: unknown) => fetch(p, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
    const { devCode } = (await post('/api/auth/request-code', { phone: '912 345 678' })) as { devCode: string };
    await post('/api/auth/verify', { phone: '912 345 678', code: devCode });
  }
  render(
    <MemoryRouter initialEntries={[path]}>
      <LangProvider initial="EN">
        <AuthProvider initialSignedIn={!session}>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

/** Booked for Thursday 17 September, 10–12. */
function bookAhead(lines = [{ label: { EN: 'Boiler service', PT: 'Revisão da caldeira' }, amount: 60 }]) {
  return createJob({
    artisanId: 'tf',
    artisanName: 'Tiago Ferreira',
    initials: 'TF',
    trade: 'plumbing',
    title: { EN: 'Boiler service', PT: 'Revisão da caldeira' },
    status: 'agreed',
    from: [-9.1118, 38.6338],
    dayOffset: 2,
    slot: { window: '10–12' },
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
  });
}

describe('help with a booked job', () => {
  it('changes the time with the booking slot picker', async () => {
    const user = userEvent.setup();
    const job = bookAhead();
    await openJob(`/job/${job.id}`);
    expect(await screen.findByRole('heading', { name: 'Booked with Tiago' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Change the time/ }));
    expect(screen.getByRole('button', { name: /^Day Thu 17/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save the new time' }));
    expect(screen.getByText("That's already your time.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Window 10–12' }));
    await user.click(screen.getByRole('button', { name: '16–18' }));
    await user.click(screen.getByRole('button', { name: 'Save the new time' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Moved to 17 Sept?\s·\s16–18\./);
    expect(screen.getByText(/17 Sept?\s·\s16–18/, { selector: 'span' })).toBeInTheDocument();
  });

  it('cancels for free, gives the credit back, and lands on Activity', async () => {
    const user = userEvent.setup();
    redeemCode('PILOT10');
    const job = bookAhead([
      { label: { EN: 'Boiler service', PT: 'Revisão da caldeira' }, amount: 60 },
      { label: { EN: 'Dashfixe credit', PT: 'Crédito Dashfixe' }, amount: -10 },
    ]);
    spendCredit(10, job.id);
    expect(getWallet().credit).toBe(0);
    await openJob(`/job/${job.id}`);

    await user.click(await screen.findByRole('button', { name: /Cancel the booking/ }));
    expect(screen.getByRole('heading', { name: 'Cancel with Tiago?' })).toBeInTheDocument();
    expect(screen.getByText(/The Dashfixe credit you used goes back/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep the booking' }));
    await user.click(screen.getByRole('button', { name: /Cancel the booking/ }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel' }));

    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(getWallet().credit).toBe(10);
  });
});

describe('help with a job on the way', () => {
  it("can't change the time, but messages the artisan", async () => {
    const user = userEvent.setup();
    await openJob('/job/dfx-1042');
    expect(await screen.findByText(/Tiago is already on the way/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Change the time/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Message Tiago' }));
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('reports a problem to the team, and the job remembers it', async () => {
    const user = userEvent.setup();
    await openJob('/job/dfx-1042');
    await user.click(await screen.findByRole('button', { name: /Report a problem/ }));

    await user.click(screen.getByRole('button', { name: 'Send to the team' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick what went wrong.');
    await user.click(screen.getByRole('radio', { name: 'Something else' }));
    await user.click(screen.getByRole('button', { name: 'Send to the team' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Tell us what happened, so we can help.');

    await user.click(screen.getByRole('radio', { name: 'A safety concern' }));
    expect(screen.getByRole('note')).toHaveTextContent("If you're in danger now, call 112 first.");
    expect(screen.getByText(/with your number, \+351912345678/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tell us more (optional)'), 'Left the gas on');
    await user.click(screen.getByRole('button', { name: 'Send to the team' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/Sent to the team, reference R-\d{4}\. We'll call you back\./);
  });

  it('says so when the session has ended', async () => {
    const user = userEvent.setup();
    await openJob('/job/dfx-1042', { session: false });
    await user.click(screen.getByRole('button', { name: /Report a problem/ }));
    await user.click(screen.getByRole('radio', { name: "They're late or didn't come" }));
    await user.click(screen.getByRole('button', { name: 'Send to the team' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session ended. Log in again to send this.');
  });
});

describe('help on a receipt', () => {
  it('offers Report a problem, not a new time', async () => {
    await openJob('/job/dfx-1031');
    expect(await screen.findByRole('heading', { name: 'Need help with this job?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Report a problem/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Change the time/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get help' })).toHaveAttribute('href', '/help');
  });
});
