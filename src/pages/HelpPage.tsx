import MarketingShell from '../components/chrome/MarketingShell';
import { useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';

/**
 * Honest pre-launch help — ARCHITECTURE.md §4. Four straight answers and a human
 * contact. Anchors (#cancellations, #safety, #contact) are footer destinations.
 */
const QA: Array<{ id?: string; q: StringKey; a: StringKey }> = [
  { q: 'help.q1', a: 'help.a1' },
  { q: 'help.q2', a: 'help.a2' },
  { id: 'cancellations', q: 'help.q3', a: 'help.a3' },
  { id: 'safety', q: 'help.q4', a: 'help.a4' },
];

export default function HelpPage() {
  const { t } = useLang();

  return (
    <MarketingShell>
      <section className="bg-panel">
        <div className="mx-auto max-w-[760px] px-[clamp(18px,4vw,40px)] py-[clamp(40px,6vw,80px)]">
          <div className="mb-3 text-label text-brand-hover">{t('help.kicker')}</div>
          <h1 className="mb-3 text-display text-ink">{t('help.title')}</h1>
          <p className="mb-9 text-lead text-ink-60">{t('help.intro')}</p>

          <div className="overflow-hidden rounded-card border border-line-soft bg-panel">
            {QA.map(({ id, q, a }, i) => (
              <article key={q} id={id} className={'scroll-mt-[88px] px-[clamp(18px,3vw,28px)] py-6' + (i < QA.length - 1 ? ' border-b border-line-rule' : '')}>
                <h2 className="mb-2 text-[16.5px] font-bold tracking-[-.01em] text-ink">{t(q)}</h2>
                <p className="text-[14.5px] font-medium leading-[1.6] text-ink-60">{t(a)}</p>
              </article>
            ))}
          </div>

          <div id="contact" className="mt-6 scroll-mt-[88px] rounded-card bg-well p-[clamp(20px,3vw,28px)]">
            <h2 className="mb-2 text-h3 text-ink">{t('help.contact.title')}</h2>
            <p className="text-[14.5px] font-medium leading-[1.6] text-ink-80">{t('help.contact.body')}</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
