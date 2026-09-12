import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../auth';
import { LangProvider } from '../i18n';
import HomePage from './HomePage';
import { getNearby } from '../components/explore/artisans';

vi.mock('maplibre-gl', async () => (await import('../test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

/** Stands in for /explore so a test can read where the composer sent us. */
function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LangProvider initial="EN">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<Where />} />
          </Routes>
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // No network in tests: the geocoder falls back to its list of pilot streets.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline');
    }),
  );
  localStorage.clear();
});

afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
  it('carries the need and a picked address into /explore', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(screen.getByLabelText('What needs fixing'), 'leaking tap');
    await user.type(screen.getByRole('combobox', { name: 'Your address' }), 'seixal');
    await user.click(await screen.findByRole('option', { name: 'Praça 1.º de Maio, Seixal' }));
    await user.click(screen.getByRole('button', { name: "See who's available" }));

    const where = await screen.findByTestId('where');
    expect(where).toHaveTextContent('need=leaking+tap');
    expect(where).toHaveTextContent('lng=-9.10120&lat=38.64030');
  });

  it('looks up a typed address on submit when no suggestion was picked', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(screen.getByRole('combobox', { name: 'Your address' }), 'Rua de Angola');
    await user.click(screen.getByRole('button', { name: "See who's available" }));

    expect(await screen.findByTestId('where')).toHaveTextContent('lng=-9.14900&lat=38.63500');
  });

  it('switches the whole page to Portuguese and remembers the choice', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Language' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Alguém bom, aqui perto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Escolha um ofício' })).toBeInTheDocument();
    expect(screen.getByText('Dados de exemplo')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('pt-PT');
    expect(localStorage.getItem('dfx.lang')).toBe('PT');
  });

  it('opens the phone menu and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('keeps an out-of-area location inside the pilot area, and says so', async () => {
    const user = userEvent.setup();
    // Lisbon: real, nearby, and outside the Amora–Seixal box.
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { longitude: -9.1393, latitude: 38.7223 } } as GeolocationPosition),
      },
    });
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(await screen.findByText(/piloting in Amora & Seixal only/)).toBeInTheDocument();
    // "We've kept your search there" is now literally true: the field, not Lisbon.
    expect(screen.getByRole('combobox', { name: 'Your address' })).toHaveValue('Rua da Cooperativa 14, Amora');
  });

  it('works out the sample distances instead of hard-coding them', () => {
    renderHome();
    const tiago = getNearby().find((p) => p.id === 'tf')!;
    expect(screen.getByText(`Plumbing · ${tiago.km} km`)).toBeInTheDocument();
    expect(screen.getAllByText(`Available · ${tiago.eta} min away`).length).toBeGreaterThan(0);
    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  it('re-works every distance and ETA when the customer picks an address', async () => {
    const user = userEvent.setup();
    renderHome();
    const seixal: [number, number] = [-9.1012, 38.6403];
    const before = getNearby().find((p) => p.id === 'tf')!;
    const after = getNearby(seixal).find((p) => p.id === 'tf')!;
    expect(after.km).not.toBe(before.km); // guard: the test means something

    await user.type(screen.getByRole('combobox', { name: 'Your address' }), 'seixal');
    await user.click(await screen.findByRole('option', { name: 'Praça 1.º de Maio, Seixal' }));

    expect(await screen.findByText(`Plumbing · ${after.km} km`)).toBeInTheDocument();
    expect(screen.getByText('Around Praça 1.º de Maio, Seixal')).toBeInTheDocument();
    // …and it is remembered for the next page.
    expect(JSON.parse(localStorage.getItem('dfx.place')!).label).toBe('Praça 1.º de Maio, Seixal');
  });
});
