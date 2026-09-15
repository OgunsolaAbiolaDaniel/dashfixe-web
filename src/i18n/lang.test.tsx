import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider, useLang } from '.';

function Show() {
  const { lang } = useLang();
  return <p>{lang}</p>;
}

afterEach(() => window.history.replaceState({}, '', '/'));

describe('the language of a visit', () => {
  it('follows ?lang=pt — the Portuguese URL search engines index — and remembers it', () => {
    localStorage.setItem('dfx.lang', 'EN');
    window.history.replaceState({}, '', '/help?lang=pt');
    render(<LangProvider><Show /></LangProvider>);
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(localStorage.getItem('dfx.lang')).toBe('PT');
    expect(document.documentElement.lang).toBe('pt-PT');
  });

  it('ignores a language it does not speak', () => {
    localStorage.setItem('dfx.lang', 'EN');
    window.history.replaceState({}, '', '/help?lang=fr');
    render(<LangProvider><Show /></LangProvider>);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});
