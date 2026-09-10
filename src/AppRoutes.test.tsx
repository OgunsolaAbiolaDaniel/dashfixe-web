import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './auth';
import { LangProvider } from './i18n';

vi.mock('maplibre-gl', async () => (await import('./test/maplibre.mock')).mapLibreStub());
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

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
