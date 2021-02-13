import alea from './alea.js';
import colorScheme from './color-scheme.js';

const rarities = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];
const rarityFactors = [80, 18, 1.8, 0.18, 0.02].map(n => n / 100);

function makeRandom(rng, n) {
  const raw = new Float32Array(n);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = rng();
  }
  return raw;
}
const makeColors = rng => {
  const colors = colorScheme
    .from_hue(rng() * 360)
    .scheme('triade')
    .variation('default')
    .colors()
    .map(c => '#' + c);
  return [
    colors[0],
    colors[4],
    colors[8],
  ];
};
function procgen(seed = '', count = 1) {
  const result = Array(count);
  const rng = alea(seed);
  for (let i = 0; i < count; i++) {
    const [color, color2, color3] = makeColors(rng);
    const art = {
      color,
      color2,
      color3,
      details: makeRandom(rng, 32),
    };
    const stats = {
      rarity: (() => {
        const f = rng();
        let totalFactor = 0;
        for (let i = 0; i < rarityFactors.length; i++) {
          totalFactor += rarityFactors[i];
          if (f <= totalFactor) {
            return rarities[i];
          }
        }
        return rarities[rarities.length-1];
      })(),
      level: Math.floor(rng() * 100),
      hp: Math.floor(rng() * 0xFF),
      mp: Math.floor(rng() * 0xFF),
      attack: Math.floor(rng() * 0xFF),
      defense: Math.floor(rng() * 0xFF),
      magic: Math.floor(rng() * 0xFF),
      magicDefense: Math.floor(rng() * 0xFF),
      speed: Math.floor(rng() * 0xFF),
      accuracy: Math.floor(rng() * 0xFF),
      evasion: Math.floor(rng() * 0xFF),
      luck:  Math.floor(rng() * 0xFF),
      details: makeRandom(rng, 32),
    };
    result[i] = {
      art,
      stats,
    };
  }
  return result;
}
export default procgen;