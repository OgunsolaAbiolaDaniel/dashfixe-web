import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './auth';
import { LangProvider } from './i18n';

vi.mock('maplibre-gl', async () => (await import('./test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

import { installPilotApi } from './test/pilotApi.mock';

// Every fetch in these tests goes through the real handlers + a fresh store.
const pilotApi = installPilotApi();
beforeEach(() => pilotApi.reset());

function renderSignedIn(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LangProvider initial="EN">
        <AuthProvider initialSignedIn>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LangProvider initial="EN">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

describe('the route tree (ARCHITECTURE.md §4)', () => {
  it('redirects the cut /fix page to the product surface', () => {
    renderAt('/fix');
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
  });

  it('redirects the cut /book page to explore in later mode', () => {
    renderAt('/book');
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
    expect(screen.getByText('Hold a slot that suits you')).toBeInTheDocument();
  });

  it('redirects the cut /coverage page into /about', () => {
    renderAt('/coverage');
    expect(screen.getByRole('heading', { name: 'Where we operate' })).toBeInTheDocument();
  });

  it('serves the info and legal pages', () => {
    renderAt('/help');
    expect(screen.getByRole('heading', { name: 'Straight answers' })).toBeInTheDocument();
  });

  it('sends unknown paths home', () => {
    renderAt('/definitely-not-a-page');
    expect(screen.getByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
  });
});

describe('/for-artisans', () => {
  it('pitches honestly and folds the cut pages in as anchors', () => {
    renderAt('/for-artisans');
    expect(screen.getByRole('heading', { name: 'Work comes to you. You keep the job.' })).toBeInTheDocument();
    expect(screen.getAllByText(/limited cohort/i).length).toBeGreaterThan(0);
    expect(document.getElementById('pay')).not.toBeNull();
    expect(document.getElementById('vetting')).not.toBeNull();
    expect(document.getElementById('app')).not.toBeNull();
    expect(document.getElementById('apply')).not.toBeNull();
  });

  it('takes an application and confirms the WhatsApp follow-up', async () => {
    const user = userEvent.setup();
    renderAt('/for-artisans');
    await user.type(screen.getByLabelText('Full name'), 'Tiago Ferreira');
    await user.type(screen.getByLabelText('WhatsApp / phone number'), '+351 912 345 678');
    await user.type(screen.getByLabelText('Email address'), 'tiago@example.com');
    await user.selectOptions(screen.getByLabelText('Primary trade'), 'electrical');
    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    expect(screen.getByRole('heading', { name: 'Application received' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit application' })).not.toBeInTheDocument();
  });

  it('reads in Portuguese too', async () => {
    const user = userEvent.setup();
    renderAt('/for-artisans');
    await user.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getByRole('heading', { name: /O trabalho vem ter consigo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar candidatura' })).toBeInTheDocument();
  });
});

describe('the signed-in app home (map-first, ARCHITECTURE.md rev 1.1)', () => {
  it('is the map and the composer, not a dashboard', async () => {
    renderSignedIn('/');
    // Greets by first name, for the time of day.
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening), Alex\.$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find an artisan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activity' })).toBeInTheDocument();
    // The map mounts with the supply around the saved address.
    await waitFor(() => expect(screen.getByTitle('Your address')).toBeInTheDocument());
    // The dashboard lists moved to /activity.
    expect(screen.queryByText('Recent requests')).not.toBeInTheDocument();
  });

  it('sends the composer into /explore with the saved address', async () => {
    const user = userEvent.setup();
    renderSignedIn('/');
    await user.type(screen.getByLabelText('What needs fixing'), 'leaking tap');
    await user.click(screen.getByRole('button', { name: 'Find an artisan' }));
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('leaking tap')).toBeInTheDocument();
  });

  it('opens the search with an artisan when a map pin is tapped', async () => {
    const user = userEvent.setup();
    renderSignedIn('/');
    const pin = await screen.findByRole('button', { name: 'Marta Cunha' });
    await user.click(pin);
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Chat with Marta' })).toBeInTheDocument();
  });
});

describe('/activity', () => {
  it('holds the lists that left the home, reached from the app bar', async () => {
    const user = userEvent.setup();
    renderSignedIn('/');
    await user.click(await screen.findByRole('link', { name: 'Activity' }));
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Recent requests')).toBeInTheDocument();
    expect(screen.getByText('Your places')).toBeInTheDocument();
  });

  it('turns a signed-out visitor back to the home', async () => {
    renderAt('/activity');
    expect(await screen.findByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
  });
});

describe('/artisan/:id (public trust page)', () => {
  it('shows the profile and routes the commit back into /explore', async () => {
    const user = userEvent.setup();
    renderAt('/artisan/tf');
    expect(screen.getByRole('heading', { name: 'Tiago Ferreira' })).toBeInTheDocument();
    expect(screen.getByText('Verified pro')).toBeInTheDocument();
    expect(screen.getAllByText(/Chegou à hora/).length).toBe(1); // sample review, PT on purpose
    await user.click(screen.getByRole('link', { name: 'Chat with Tiago' }));
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Chat with Tiago' })).toBeInTheDocument();
  });

  it('sends an unknown artisan to the search', () => {
    renderAt('/artisan/nobody');
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
  });
});

describe('/job/:id', () => {
  it('tracks the live job: timeline, approved estimate, chat that really sends', async () => {
    const user = userEvent.setup();
    renderSignedIn('/job/dfx-1042');
    expect(screen.getByRole('heading', { name: 'Tiago is heading over' })).toBeInTheDocument();
    expect(screen.getByText('Price agreed')).toBeInTheDocument();
    expect(screen.getByText('Mixer cartridge')).toBeInTheDocument();
    expect(screen.getByText('€63.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByLabelText('Message'), 'The gate code is 4412');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('The gate code is 4412')).toBeInTheDocument();
  });

  it('shows a receipt for a finished job and takes a rating', async () => {
    const user = userEvent.setup();
    renderSignedIn('/job/dfx-1031');
    expect(screen.getByText('Paid in app')).toBeInTheDocument();
    expect(screen.getByText('Ceiling fixture')).toBeInTheDocument();
    expect(screen.getByText('€48.00')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rate 5 stars' }));
    expect(screen.getByText('Thanks — this helps the next customer.')).toBeInTheDocument();
  });

  it('opens a receipt from its Activity row', async () => {
    const user = userEvent.setup();
    renderSignedIn('/');
    await user.click(await screen.findByRole('link', { name: 'Activity' }));
    await user.click(screen.getByRole('link', { name: /Bathroom light replaced/ }));
    expect(screen.getByText('Receipt')).toBeInTheDocument();
    expect(screen.getByText('€48.00')).toBeInTheDocument();
  });

  it('is signed-in only', async () => {
    renderAt('/job/dfx-1042');
    expect(await screen.findByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
  });

  it('sends an unknown job to Activity', () => {
    renderSignedIn('/job/dfx-9999');
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });
});

/**
 * Drive the real login flow. Pilot mode (no SMS provider): Send code signs the
 * visitor straight in, then the one-time name step.
 */
async function logIn(user: ReturnType<typeof userEvent.setup>, name = 'Ana') {
  await user.type(screen.getByLabelText('Phone number'), '912 345 678');
  await user.click(screen.getByRole('button', { name: 'Send code' }));
  await user.type(await screen.findByLabelText('First name'), name);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('/login (a page, not a modal)', () => {
  it('signs in on Send code in pilot mode, asks a name once, and returns to next', async () => {
    const user = userEvent.setup();
    renderAt('/login?next=/activity');
    await user.type(screen.getByLabelText('Phone number'), '912 345 678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    // No code to type: pilot mode says so, honestly.
    expect(await screen.findByText(/you're in without a code/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('First name'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    // The header now knows who this is.
    expect(screen.getByRole('button', { name: 'Account' })).toHaveTextContent('Ana');
  });

  it('lets a new customer skip the name', async () => {
    const user = userEvent.setup();
    renderAt('/login?next=/activity');
    await user.type(screen.getByLabelText('Phone number'), '912 345 678');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });

  it('turns away a number that is not a phone number', async () => {
    const user = userEvent.setup();
    renderAt('/login');
    await user.type(screen.getByLabelText('Phone number'), '12');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText(/does not look right/)).toBeInTheDocument();
  });

  it('gates chat on /explore and comes back with the chat open', async () => {
    const user = userEvent.setup();
    renderAt('/explore?artisan=ra');
    await user.click(screen.getByRole('button', { name: 'Chat with Rui' }));
    // The commit point sent us to the login PAGE.
    expect(screen.getByRole('heading', { name: 'Log in or sign up' })).toBeInTheDocument();
    await logIn(user);
    // …and back on the search with the chat we asked for.
    expect(await screen.findByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
  });
});

describe('the waitlist forms hit the real API', () => {
  it('joins the waitlist and collapses to the success state', async () => {
    const user = userEvent.setup();
    renderAt('/waitlist');
    const email = screen.getAllByLabelText('Email address')[0]!;
    await user.type(email, 'ana@example.com');
    await user.click(screen.getAllByRole('button', { name: 'Join the waitlist' })[0]!);
    expect(await screen.findByText("You're on the list")).toBeInTheDocument();
  });

  it('shows a retryable error when the server rejects an application', async () => {
    const user = userEvent.setup();
    renderAt('/waitlist');
    await user.click(screen.getByRole('button', { name: /tradesperson/ }));
    await user.type(screen.getByLabelText('Full name'), 'Tiago Ferreira');
    await user.type(screen.getByLabelText('WhatsApp / phone number'), 'not-a-phone');
    await user.type(screen.getByLabelText('Email address', { selector: 'input[id$="-email"]' }), 'tiago@example.com');
    await user.selectOptions(screen.getByLabelText('Primary trade'), 'plumbing');
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByText(/Something went wrong/)).toBeInTheDocument();
    // Still on the form — the customer can fix the number and retry.
    expect(screen.getByRole('button', { name: 'Submit application' })).toBeInTheDocument();
  });
});

describe('/trade/:slug (SEO landing pages)', () => {
  it('pitches one trade and hands off to the search with it set', () => {
    renderAt('/trade/plumbing');
    expect(screen.getByRole('heading', { level: 1, name: 'Plumbers in Amora & Seixal' })).toBeInTheDocument();
    expect(screen.getByText('Blocked drains and siphons')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See who is free/ })).toHaveAttribute('href', '/explore?trade=plumbing');
    // Supply on this page is sample data, and says so.
    expect(screen.getByText('Sample data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tiago Ferreira/ })).toHaveAttribute('href', '/artisan/tf');
  });

  it('is reachable from the footer and links its sibling trades', () => {
    renderAt('/help');
    expect(screen.getByRole('link', { name: 'Electrical' })).toHaveAttribute('href', '/trade/electrical');
    renderAt('/trade/cleaning');
    expect(screen.getByRole('link', { name: 'Painters' })).toHaveAttribute('href', '/trade/painting');
  });

  it('sends an unknown trade to the search', () => {
    renderAt('/trade/juggling');
    expect(screen.getByRole('heading', { name: 'Who is free right now' })).toBeInTheDocument();
  });
});

describe('per-route document metadata (seo.ts)', () => {
  it('titles each page and follows the language', async () => {
    const user = userEvent.setup();
    renderAt('/trade/electrical');
    expect(document.title).toBe('Electricians in Amora & Seixal · Dashfixe');
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `${location.origin}/trade/electrical`);
    await user.click(screen.getByRole('button', { name: 'Language' }));
    expect(document.title).toBe('Eletricistas na Amora e no Seixal · Dashfixe');
  });

  it('marks private pages noindex', () => {
    renderAt('/login');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
});

describe('the launch switch (VITE_LAUNCHED)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps the waitlist before launch', () => {
    renderAt('/waitlist');
    expect(screen.getAllByRole('button', { name: 'Join the waitlist' }).length).toBeGreaterThan(0);
  });

  it('retires the waitlist to the home at launch', () => {
    vi.stubEnv('VITE_LAUNCHED', 'true');
    renderAt('/waitlist');
    expect(screen.getByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
  });
});
