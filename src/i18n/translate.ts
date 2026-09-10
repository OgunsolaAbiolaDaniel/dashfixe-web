import type { Lang } from '../types';
import { dictionaries, type StringKey } from './strings';

export type Vars = Record<string, string | number>;

/**
 * Look a key up in `lang`, falling back to English, then to the key itself.
 * `{name}` placeholders are filled from `vars`; unknown ones stay visible rather
 * than rendering blank, so a missing variable is obvious on the page.
 */
export function translate(lang: Lang, key: StringKey, vars?: Vars): string {
  const text = dictionaries[lang][key] ?? dictionaries.EN[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}
