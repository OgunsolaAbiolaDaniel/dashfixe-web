import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../../i18n';
import ErrorBoundary from './ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('replaces a crashed page with a reload screen, and recovers on navigation', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <LangProvider initial="EN">
        <ErrorBoundary resetKey="/broken">
          <Boom />
        </ErrorBoundary>
      </LangProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on this page');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();

    // Navigating (a new pathname) clears the error and renders the new page.
    rerender(
      <LangProvider initial="EN">
        <ErrorBoundary resetKey="/help">
          <p>Help page</p>
        </ErrorBoundary>
      </LangProvider>,
    );
    expect(screen.getByText('Help page')).toBeInTheDocument();
    quiet.mockRestore();
  });
});
