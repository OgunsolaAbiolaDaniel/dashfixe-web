/**
 * A seven-point trend under a console figure (rev 2.13): one scale from zero to
 * the series' own peak, a faint baseline, an area, the line, and the last point
 * marked. Colour follows the viewer's role, or red for things that are bad news.
 */
export default function Sparkline({ values, tone = 'acc', label }: { values: number[]; tone?: 'acc' | 'crit'; label: string }) {
  const W = 100;
  const H = 26;
  const pad = 3;
  const peak = Math.max(1, ...values);
  const points = values.map((v, i) => [values.length > 1 ? (i / (values.length - 1)) * W : W, H - pad - (v / peak) * (H - pad * 2)] as const);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const stroke = tone === 'crit' ? '#F85149' : 'var(--acc-text)';
  const fill = tone === 'crit' ? 'rgba(248, 81, 73, .15)' : 'var(--acc-soft)';
  const last = points[points.length - 1] ?? [W, H - pad];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="mt-1 block h-[26px] w-full">
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="#232329" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${H} ${line} ${W},${H}`} fill={fill} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={stroke} />
    </svg>
  );
}
