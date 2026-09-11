import { useRef, useState } from 'react';
import { Camera, Close } from '../icons';
import { useLang } from '../../i18n';

/**
 * A real photo attach: file picker + thumbnail + remove. The image stays in the
 * browser (object URL) — uploading it to the job is a Phase 6 backend item, but
 * the button does what it says today.
 */
export default function PhotoPick({ variant }: { variant: 'round' | 'chip' }) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
  };

  const remove = () => {
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(null);
    if (input.current) input.current.value = '';
  };

  const trigger =
    variant === 'round'
      ? 'grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-panel text-brand transition hover:bg-brand-tint'
      : 'flex h-ctl items-center gap-[9px] rounded-well border border-line bg-panel px-4 text-sm font-bold text-ink transition hover:bg-page';

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        aria-label={t('hero.attachPhoto')}
        onChange={(e) => pick(e.target.files?.[0])}
        className="hidden"
      />
      {photo ? (
        <span className="relative flex-none">
          <img src={photo} alt={t('hero.photoAttached')} className="block h-[38px] w-[38px] rounded-[11px] object-cover" />
          <button
            type="button"
            onClick={remove}
            aria-label={t('hero.removePhoto')}
            className="absolute -right-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full border border-line bg-panel text-ink-60 shadow-card"
          >
            <Close size={10} />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className={trigger}>
          <Camera size={variant === 'round' ? 18 : 17} className={variant === 'chip' ? 'text-brand' : undefined} />
          {variant === 'chip' && t('customer.addPhoto')}
        </button>
      )}
    </>
  );
}
