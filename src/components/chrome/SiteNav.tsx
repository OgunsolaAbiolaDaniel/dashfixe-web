import Header from './Header';

/** Marketing-surface chrome: THE header, content-width (see Header.tsx). */
export default function SiteNav({ surface = 'customer' }: { surface?: 'customer' | 'pro' }) {
  return <Header layout="contained" surface={surface} />;
}
