import { Apple, GooglePlay } from '../icons';
import { useLang } from '../../i18n';

/**
 * App Store / Google Play badges — the honest kind. No Dashfixe app is in the
 * stores yet (../Dashfixe.md: never imply a live app exists), so they read
 * "Coming soon" and link nowhere. When the apps ship, each badge becomes its
 * store link and `note` goes away.
 */
type Props = {
  /** `dark` badges for light grounds, `light` badges for the navy field. */
  tone?: 'dark' | 'light';
  size?: 'md' | 'sm';
  /** The one-line "not in the stores yet" note under the badges. */
  note?: boolean;
};

export default function StoreBadges({ tone = 'dark', size = 'md', note = false }: Props) {
  const { t } = useLang();
  const sm = size === 'sm';
  const box =
    'inline-flex flex-none items-center ' +
    (tone === 'dark' ? 'bg-ink text-white' : 'bg-panel text-ink') +
    (sm ? ' h-11 gap-2 rounded-[12px] px-3' : ' h-[54px] gap-2.5 rounded-[14px] px-4');

  const badges = [
    { Icon: Apple, soon: t('store.soonOn.apple'), store: 'App Store' },
    { Icon: GooglePlay, soon: t('store.soonOn.google'), store: 'Google Play' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {badges.map(({ Icon, soon, store }) => (
          <span key={store} className={box}>
            <Icon size={sm ? 20 : 25} />
            <span className="text-left leading-none">
              <span className={'block font-semibold ' + (sm ? 'text-[9.5px]' : 'text-[10.5px]')}>{soon}</span>
              <span className={'mt-[3px] block font-bold tracking-[-.01em] ' + (sm ? 'text-[14px]' : 'text-[16.5px]')}>{store}</span>
            </span>
          </span>
        ))}
      </div>
      {note && (
        <p className={'mt-3 text-[13px] font-medium leading-[1.5] ' + (tone === 'dark' ? 'text-ink-60' : 'text-onink')}>{t('store.note')}</p>
      )}
    </div>
  );
}
