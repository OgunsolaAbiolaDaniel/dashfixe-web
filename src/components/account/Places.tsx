import { useState } from 'react';
import { Briefcase, Close, HomeSolid, MapPin, Plus } from '../icons';
import AddressField from '../shared/AddressField';
import { addSavedPlace, getSavedPlaces, removeSavedPlace, type SavedPlace } from '../../lib/places';
import { DEFAULT_ADDRESS } from '../../search';
import { useLang } from '../../i18n';

const PLACES = [
  { Icon: HomeSolid, key: 'customer.placeHome', address: DEFAULT_ADDRESS, primary: true },
  { Icon: Briefcase, key: 'customer.placeOffice', address: 'Praça 1º de Maio 3, Seixal', primary: false },
] as const;

/**
 * Saved places — the two sample ones plus per-browser additions (lib/places).
 * Lives on /account (Uber keeps saved places with the account, not the trips).
 */
export default function Places({ className = '' }: { className?: string }) {
  const { t } = useLang();
  const [custom, setCustom] = useState<SavedPlace[]>(() => getSavedPlaces());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const save = () => {
    if (!name.trim() || !address.trim()) return;
    setCustom(addSavedPlace({ name: name.trim(), address: address.trim() }));
    setName('');
    setAddress('');
    setAdding(false);
  };

  return (
    <section className={`overflow-hidden rounded-card border border-line-soft bg-panel ${className}`}>
      <div className="flex items-center gap-3 border-b border-line-rule px-5 py-[18px]">
        <h2 className="mr-auto text-label text-ink-40">{t('customer.yourPlaces')}</h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand transition hover:text-brand-hover"
        >
          <Plus size={14} strokeWidth={2.4} />
          {t('customer.add')}
        </button>
      </div>
      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-3 border-b border-line-rule bg-page px-5 py-4"
        >
          <div>
            <label htmlFor="place-name" className="mb-[7px] block text-label text-ink-40">
              {t('customer.placeName')}
            </label>
            <input
              id="place-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-input border border-line bg-panel px-[13px] text-[14px] font-semibold text-ink"
            />
          </div>
          <AddressField variant="input" value={address} onChange={setAddress} onPlace={(p) => setAddress(p.label)} />
          <button
            type="submit"
            className="h-11 rounded-[13px] bg-brand px-4 text-[13.5px] font-bold text-white transition hover:bg-brand-hover"
          >
            {t('customer.savePlace')}
          </button>
        </form>
      )}
      {PLACES.map((p) => (
        <div key={p.key} className="flex items-center gap-3.5 border-b border-line-rule px-5 py-4 last:border-b-0">
          <span className={'grid h-10 w-10 flex-none place-items-center rounded-well ' + (p.primary ? 'bg-brand-tint' : 'bg-well')}>
            <p.Icon size={18} className={p.primary ? 'text-brand' : 'text-ink-60'} />
          </span>
          <span className="mr-auto min-w-0">
            <span className="block text-[15px] font-bold text-ink">{t(p.key)}</span>
            <span className="mt-px block truncate text-[13px] font-semibold text-ink-40">{p.address}</span>
          </span>
        </div>
      ))}
      {custom.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-3.5 border-b border-line-rule px-5 py-4 last:border-b-0">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-well bg-well">
            <MapPin size={18} className="text-ink-60" />
          </span>
          <span className="mr-auto min-w-0">
            <span className="block text-[15px] font-bold text-ink">{p.name}</span>
            <span className="mt-px block truncate text-[13px] font-semibold text-ink-40">{p.address}</span>
          </span>
          <button
            type="button"
            onClick={() => setCustom(removeSavedPlace(i))}
            aria-label={t('customer.removePlace')}
            className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-well text-ink-60 transition hover:bg-line"
          >
            <Close size={14} />
          </button>
        </div>
      ))}
    </section>
  );
}
