/**
 * A Pexels photo sized for the slot it fills. Pexels resizes on the fly (`w`), so
 * the browser picks the smallest width that covers the box instead of every phone
 * downloading the 1600px original. Photos sit below the fold on every page that
 * uses them: lazy, decoded off the main thread.
 */
const WIDTHS = [640, 960, 1280, 1600];

const src = (id: number, w: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

type Props = {
  /** The Pexels photo id. */
  id: number;
  alt: string;
  /** The rendered width, as a `sizes` value — half the page on wide screens by default. */
  sizes?: string;
  className?: string;
};

export default function Photo({ id, alt, sizes = '(min-width: 768px) 50vw, 100vw', className }: Props) {
  return (
    <img
      src={src(id, 1280)}
      srcSet={WIDTHS.map((w) => `${src(id, w)} ${w}w`).join(', ')}
      sizes={sizes}
      width={1280}
      height={853}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
