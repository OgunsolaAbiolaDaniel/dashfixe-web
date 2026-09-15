import { useEffect, type CSSProperties } from 'react';
import type { AdminRole } from '../shared/adminRoles';
import type { Lang } from '../types';

/**
 * The admin console's look and small helpers (rev 2.12). The console is its own
 * room: black, dense, IBM Plex, and coloured by the viewer's role — violet for the
 * Super admin, blue for a Supervisor, teal for an Admin — so everyone always knows
 * which access they're using. Red, amber and green only ever mean attention.
 */
export const ROLE_COLOURS: Record<AdminRole, { acc: string; text: string; soft: string; line: string }> = {
  super: { acc: '#7C3AED', text: '#B9A2FF', soft: 'rgba(139, 92, 246, .16)', line: 'rgba(139, 92, 246, .45)' },
  supervisor: { acc: '#2F6FEB', text: '#79B8FF', soft: 'rgba(47, 129, 247, .16)', line: 'rgba(47, 129, 247, .45)' },
  admin: { acc: '#0F766E', text: '#5EEAD4', soft: 'rgba(20, 184, 166, .15)', line: 'rgba(20, 184, 166, .45)' },
};

/** CSS variables for the role accent: `bg-[var(--acc)]`, `text-[var(--acc-text)]`… */
export function roleVars(role: AdminRole): CSSProperties {
  const c = ROLE_COLOURS[role];
  return { '--acc': c.acc, '--acc-text': c.text, '--acc-soft': c.soft, '--acc-line': c.line } as CSSProperties;
}

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';

/** IBM Plex, loaded only when the console opens — the customer site never pays for it. */
export function useConsoleFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-console-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS;
    link.dataset.consoleFonts = '';
    document.head.appendChild(link);
  }, []);
}

const locale = (lang: Lang) => (lang === 'PT' ? 'pt-PT' : 'en-GB');

/** "15 Sep 19:12:40" — audit-log precision. */
export function stamp(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat(locale(lang), { day: '2-digit', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
  return `${day} ${time}`;
}

/** "19:24". */
export function clock(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

/** "3 minutes ago", "yesterday". */
export function ago(iso: string, lang: Lang, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  return rtf.format(0, 'minute');
}

const WORDS = [
  'amber', 'anchor', 'basil', 'beacon', 'birch', 'canyon', 'cedar', 'cobalt', 'comet', 'coral', 'delta', 'ember',
  'falcon', 'fjord', 'garnet', 'harbour', 'hazel', 'indigo', 'jasper', 'juniper', 'kestrel', 'lagoon', 'linden', 'maple',
  'meadow', 'mistral', 'nectar', 'nimbus', 'oasis', 'olive', 'orchid', 'pebble', 'pepper', 'quartz', 'raven', 'saffron',
  'sierra', 'sorrel', 'spruce', 'tangerine', 'thistle', 'tundra', 'umber', 'velvet', 'willow', 'zephyr',
];

/** "cedar-lagoon-quartz-47": easy to read out on WhatsApp, 16+ characters, from the CSPRNG. */
export function suggestPassword(): string {
  const r = new Uint32Array(4);
  crypto.getRandomValues(r);
  const w = (i: number) => WORDS[r[i]! % WORDS.length];
  return `${w(0)}-${w(1)}-${w(2)}-${10 + (r[3]! % 90)}`;
}

/** The console's host, as a badge: production, a Vercel preview, or this machine. */
export function environment(host = typeof location === 'undefined' ? '' : location.hostname): 'production' | 'preview' | 'local' {
  if (!host || host === 'localhost' || host === '127.0.0.1') return 'local';
  if (host.endsWith('.vercel.app') && host !== 'dashfixe-web.vercel.app') return 'preview';
  return 'production';
}
