/**
 * "What needs fixing?" → which trade. Keyword matching in English and Portuguese,
 * accent- and case-insensitive, on whole words (so "tap" is not found in "laptop").
 *
 * Deliberately simple and transparent: the UI shows the word it matched on
 * ("Plumbing · matched from 'tap'") and the customer can always change it. An AI
 * classifier can replace `classifyNeed` later behind the same signature — the
 * screens will not change (docs/ARCHITECTURE.md §6).
 */
import type { TradeSlug } from '../routes';

export type TradeMatch = { trade: TradeSlug; keyword: string };

/**
 * Words and phrases per trade, written without accents. A trailing `*` matches a
 * word stem ("entupi*" → entupido, entupida, entupimento). Order breaks ties: the
 * more specific trades come first, the generic "wall"/"window" trades last.
 */
const WORDS: Array<[TradeSlug, string[]]> = [
  [
    'plumbing',
    [
      'tap', 'taps', 'faucet', 'leak', 'leaks', 'leaking', 'leaky', 'drip', 'drips', 'dripping', 'sink', 'sinks',
      'basin', 'toilet', 'toilets', 'loo', 'cistern', 'flush', 'drain', 'drains', 'blocked', 'clogged', 'pipe',
      'pipes', 'plumbing', 'plumber', 'shower', 'bathtub', 'boiler', 'water heater', 'radiator', 'water', 'siphon',
      'torneira', 'torneiras', 'misturadora', 'fuga*', 'pinga*', 'lava loica', 'lavatorio', 'sanita', 'autoclismo',
      'cano', 'canos', 'canaliz*', 'esgoto', 'entupi*', 'chuveiro', 'banheira', 'esquentador', 'caldeira', 'sifao',
      'agua',
    ],
  ],
  [
    'electrical',
    [
      'socket', 'sockets', 'plug', 'plugs', 'switch', 'switches', 'light', 'lights', 'lamp', 'bulb', 'bulbs', 'fuse',
      'fuses', 'breaker', 'trips', 'tripping', 'tripped', 'power', 'electric', 'electrical', 'electricity',
      'electrician', 'wiring', 'wire', 'wires', 'spark', 'sparks', 'sparking', 'outlet', 'extractor fan', 'tomada',
      'tomadas', 'interruptor', 'luz', 'luzes', 'lampada', 'candeeiro', 'disjuntor', 'diferencial', 'quadro eletrico',
      'eletric*', 'fio', 'fios', 'faisca', 'curto circuito', 'corrente',
    ],
  ],
  [
    'carpentry',
    [
      'door', 'doors', 'shelf', 'shelves', 'cupboard', 'cupboards', 'wardrobe', 'hinge', 'hinges', 'drawer', 'drawers',
      'furniture', 'wood', 'wooden', 'skirting', 'flat pack', 'flatpack', 'ikea', 'cabinet', 'cabinets', 'handle',
      'lock', 'porta', 'portas', 'prateleira*', 'armario', 'armarios', 'roupeiro', 'dobradica*', 'gaveta*', 'movel',
      'moveis', 'madeira', 'fechadura', 'puxador', 'rodape', 'carpint*',
    ],
  ],
  [
    'cleaning',
    [
      'clean', 'cleaning', 'cleaner', 'deep clean', 'tidy', 'dust', 'dusty', 'dirty', 'move out', 'end of tenancy',
      'oven', 'limescale', 'mess', 'limpeza', 'limpar', 'limpo', 'suj*', 'forno', 'janelas', 'calcario', 'arrumar',
      'mudanca',
    ],
  ],
  [
    'painting',
    [
      'paint', 'painting', 'painter', 'repaint', 'wall', 'walls', 'ceiling', 'ceilings', 'mould', 'mold', 'damp',
      'stain', 'stains', 'plaster', 'crack', 'cracks', 'pint*', 'parede', 'paredes', 'teto', 'tecto', 'humidade',
      'bolor', 'mancha*', 'estuque', 'fissura*',
    ],
  ],
];

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** The most likely trade for a free-text need, or null when nothing matches. */
export function classifyNeed(text: string): TradeMatch | null {
  // " kitchen tap dripping " — spaces at both ends make whole-word checks cheap.
  const hay = ` ${fold(text).replace(/[^a-z0-9]+/g, ' ').trim()} `;
  if (hay.trim().length < 2) return null;

  let best: (TradeMatch & { score: number }) | null = null;
  for (const [trade, words] of WORDS) {
    let score = 0;
    let first = '';
    for (const word of words) {
      const stem = word.endsWith('*');
      const w = stem ? word.slice(0, -1) : word;
      const at = stem ? hay.indexOf(` ${w}`) : hay.indexOf(` ${w} `);
      if (at === -1) continue;
      // Multi-word phrases ("water heater") are stronger evidence than one word.
      score += w.split(' ').length;
      if (!first) first = stem ? (hay.slice(at + 1).split(' ')[0] ?? w) : w;
    }
    if (score > (best?.score ?? 0)) best = { trade, keyword: first, score };
  }
  return best ? { trade: best.trade, keyword: best.keyword } : null;
}
