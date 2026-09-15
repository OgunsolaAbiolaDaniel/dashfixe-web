import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '../types';
import { dictionaries, type StringKey } from './strings';

/**
 * Language for the whole site. Persisted per browser and mirrored onto
 * `<html lang>` so screen readers and translation tools follow it.
 *
 * Portuguese is PT-PT, the language of the pilot. The default is the browser's
 * language when it is Portuguese, otherwise English.
 */
const STORAGE_KEY = 'dfx.lang';

type Vars = Record<string, string | number>;

type LangValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key, substituting `{name}` placeholders. */
  t: (key: StringKey, vars?: Vars) => string;
};

const LangContext = createContext<LangValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'EN' || saved === 'PT') return saved;
  } catch {
    /* private mode, or no storage */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt') ? 'PT' : 'EN';
}

export function translate(lang: Lang, key: StringKey, vars?: Vars): string {
  const text = dictionaries[lang][key] ?? dictionaries.EN[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

export function LangProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? initialLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'PT' ? 'pt-PT' : 'en';
  }, [lang]);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
