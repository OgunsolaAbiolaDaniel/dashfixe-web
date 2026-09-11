import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './auth';
import { LangProvider } from './i18n';

vi.mock('maplibre-gl', async () => (await import('./test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

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
    expect(screen.getByRole('heading', { name: 'Good morning, Alex.' })).toBeInTheDocument();
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
    expect(screen.getByText('leaking tap')).toBeInTheDocument();
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

  it('turns a signed-out visitor back to the home', () => {
    renderAt('/activity');
    expect(screen.getByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
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

  it('is signed-in only', () => {
    renderAt('/job/dfx-1042');
    expect(screen.getByRole('heading', { name: 'Somebody good, close by' })).toBeInTheDocument();
  });

  it('sends an unknown job to Activity', () => {
    renderSignedIn('/job/dfx-9999');
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });
});
