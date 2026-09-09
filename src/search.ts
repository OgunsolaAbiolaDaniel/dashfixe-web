/**
 * The search a customer is building, carried from the home composer into /explore.
 *
 * Held in the URL so a search is shareable, survives a reload and works with the
 * back button — the composer on the home page and the panel on /explore read the
 * same values.
 */
export type When = 'now' | 'later';

export type Search = {
  /** Free text: "kitchen tap dripping". */
  need: string;
  /** Trade slug, when one was picked explicitly. */
  trade: string;
  address: string;
  when: When;
  /** Artisan pre-selected on arrival, e.g. from a "book again" card. */
  artisan: string;
};

export const TRADES = [
  { slug: 'plumbing', label: 'Plumbing' },
  { slug: 'electrical', label: 'Electrical' },
  { slug: 'painting', label: 'Painting' },
  { slug: 'carpentry', label: 'Carpentry' },
  { slug: 'cleaning', label: 'Cleaning' },
  { slug: 'other', label: 'Something else' },
] as const;

export const DEFAULT_ADDRESS = 'Rua da Cooperativa 14, Amora';

export function tradeLabel(slug: string): string {
  return TRADES.find((t) => t.slug === slug)?.label ?? 'Any trade';
}

export function parseSearch(params: URLSearchParams): Search {
  return {
    need: params.get('need') ?? '',
    trade: params.get('trade') ?? '',
    address: params.get('address') ?? '',
    when: params.get('when') === 'later' ? 'later' : 'now',
    artisan: params.get('artisan') ?? '',
  };
}

/** Build an /explore URL, omitting anything empty so links stay readable. */
export function exploreUrl(search: Partial<Search>): string {
  const params = new URLSearchParams();
  if (search.need) params.set('need', search.need);
  if (search.trade) params.set('trade', search.trade);
  if (search.address) params.set('address', search.address);
  if (search.when === 'later') params.set('when', 'later');
  if (search.artisan) params.set('artisan', search.artisan);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : '/explore';
}
