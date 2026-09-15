import type { StringKey } from '../i18n/strings';

/**
 * The questions the help pages answer. One list, two readers: the pages render it,
 * and seo.ts turns it into FAQPage structured data — so search results can only
 * ever quote answers a visitor can read on the page.
 */

/** /help — four straight answers. Anchors (#cancellations, #safety) are footer destinations. */
export const HELP_QA: Array<{ id?: string; q: StringKey; a: StringKey }> = [
  { q: 'help.q1', a: 'help.a1' },
  { q: 'help.q2', a: 'help.a2' },
  { id: 'cancellations', q: 'help.q3', a: 'help.a3' },
  { id: 'safety', q: 'help.q4', a: 'help.a4' },
];

/** /pro/help — answers for artisans, by topic; each topic id is an anchor. */
export const PRO_HELP_TOPICS: Array<{ id: string; label: StringKey; qa: Array<[StringKey, StringKey]> }> = [
  {
    id: 'pay',
    label: 'pro.help.t.pay',
    qa: [
      ['pro.help.pay.q1', 'pro.help.pay.a1'],
      ['pro.help.pay.q2', 'pro.help.pay.a2'],
      ['pro.help.pay.q3', 'pro.help.pay.a3'],
    ],
  },
  {
    id: 'jobs',
    label: 'pro.help.t.jobs',
    qa: [
      ['pro.help.jobs.q1', 'pro.help.jobs.a1'],
      ['pro.help.jobs.q2', 'pro.help.jobs.a2'],
      ['pro.help.jobs.q3', 'pro.help.jobs.a3'],
    ],
  },
  {
    id: 'estimates',
    label: 'pro.help.t.estimates',
    qa: [
      ['pro.help.est.q1', 'pro.help.est.a1'],
      ['pro.help.est.q2', 'pro.help.est.a2'],
      ['pro.help.est.q3', 'pro.help.est.a3'],
    ],
  },
  {
    id: 'documents',
    label: 'pro.help.t.documents',
    qa: [
      ['pro.help.doc.q1', 'pro.help.doc.a1'],
      ['pro.help.doc.q2', 'pro.help.doc.a2'],
    ],
  },
  {
    id: 'safety',
    label: 'pro.help.t.safety',
    qa: [
      ['pro.help.safe.q1', 'pro.help.safe.a1'],
      ['pro.help.safe.q2', 'pro.help.safe.a2'],
    ],
  },
  {
    id: 'account',
    label: 'pro.help.t.account',
    qa: [
      ['pro.help.acct.q1', 'pro.help.acct.a1'],
      ['pro.help.acct.q2', 'pro.help.acct.a2'],
    ],
  },
];
