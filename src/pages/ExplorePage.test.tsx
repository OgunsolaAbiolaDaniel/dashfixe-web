import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { LangProvider } from '../i18n';
import ExplorePage from './ExplorePage';
import { AVAILABLE, getSupply } from '../components/explore/artisans';

vi.mock('maplibre-gl', async () => (await import('../test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

// The auth-gate journey (Chat → /login → back with the chat open) lives in
// AppRoutes.test.tsx, where the whole route tree is mounted.
function renderExplore(url = '/explore?need=kitchen%20tap', signedIn = false) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LangProvider initial="EN">
        <AuthProvider initialSignedIn={signedIn}>
          <ExplorePage />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

describe('ExplorePage', () => {
  it('lists every available artisan and shows the search from the URL', () => {
    renderExplore();
    expect(screen.getByText('kitchen tap')).toBeInTheDocument();
    for (const a of AVAILABLE) expect(screen.getByText(a.name)).toBeInTheDocument();
  });

  it('mounts the markers once the map loads', async () => {
    renderExplore();
    await waitFor(() => expect(screen.getByTitle('Your address')).toBeInTheDocument());
    const others = AVAILABLE.filter((a) => a.id !== AVAILABLE[0]!.id);
    for (const a of others) expect(screen.getByRole('button', { name: a.name })).toBeInTheDocument();
  });

  it('pre-selects the artisan named in the URL', async () => {
    const target = AVAILABLE[1]!;
    renderExplore(`/explore?artisan=${target.id}`);
    await waitFor(() => expect(screen.getByText(`${target.price} · ${target.eta} min`)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: `Chat with ${target.name.split(' ')[0]}` })).toBeInTheDocument();
  });

  it('works distances out from the address carried in the URL', () => {
    const seixal: [number, number] = [-9.1012, 38.6403];
    renderExplore(`/explore?address=Seixal&lng=${seixal[0]}&lat=${seixal[1]}`);
    const tiago = getSupply(seixal).available.find((a) => a.id === 'tf')!;

    // Guard: the test only means something if the two homes give different answers.
    expect(tiago.km).not.toBe(AVAILABLE.find((a) => a.id === 'tf')!.km);
    expect(screen.getByText(`${tiago.rating} · ${tiago.jobs} jobs · ${tiago.km} km`)).toBeInTheDocument();
    expect(screen.getByText('Seixal')).toBeInTheDocument();
  });

  it('shows the day and window picker in later mode', () => {
    renderExplore('/explore?when=later');
    expect(screen.getByText('Hold a slot that suits you')).toBeInTheDocument();
    expect(screen.getByLabelText('Day')).toBeInTheDocument();
    expect(screen.getByLabelText('Window')).toBeInTheDocument();
  });

  it('opens the chat straight away for a signed-in customer', async () => {
    const user = userEvent.setup();
    renderExplore('/explore', true);
    await user.click(screen.getAllByRole('button', { name: /^Chat/ })[0]!);
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('selecting a marker selects the card', async () => {
    const user = userEvent.setup();
    renderExplore();
    const target = AVAILABLE[2]!;
    const marker = await screen.findByRole('button', { name: target.name });
    await user.click(marker);
    expect(screen.getByText(`${target.price} · ${target.eta} min`)).toBeInTheDocument();
  });
});
