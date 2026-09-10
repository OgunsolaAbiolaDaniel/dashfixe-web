import MarketingShell from '../components/chrome/MarketingShell';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * Privacy, terms, cookies — ARCHITECTURE.md §4. One layout, three content sets.
 * Deliberately short and honest: pre-launch, no transactions, no tracking. The
 * full marketplace versions arrive with the first real transactions (Phase 5).
 */
const CONTENT: Record<'privacy' | 'terms' | 'cookies', { title: StringKey; paragraphs: StringKey[] }> = {
  privacy: { title: 'privacy.title', paragraphs: ['privacy.p1', 'privacy.p2', 'privacy.p3', 'privacy.p4', 'privacy.p5'] },
  terms: { title: 'terms.title', paragraphs: ['terms.p1', 'terms.p2', 'terms.p3', 'terms.p4'] },
  cookies: { title: 'cookies.title', paragraphs: ['cookies.p1', 'cookies.p2', 'cookies.p3'] },
};

export default function LegalPage({ kind }: { kind: keyof typeof CONTENT }) {
  const { t } = useLang();
  const { title, paragraphs } = CONTENT[kind];

  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto max-w-[680px] px-[clamp(18px,4vw,40px)] py-[clamp(40px,6vw,80px)]">
          <h1 className="mb-3 text-display text-ink">{t(title)}</h1>
          <p className="mb-8 text-[13px] font-semibold text-ink-40">{t('legal.updated')}</p>
          <div className="flex flex-col gap-5">
            {paragraphs.map((p) => (
              <p key={p} className="text-[15px] font-medium leading-[1.7] text-ink-80">
                {t(p)}
              </p>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
