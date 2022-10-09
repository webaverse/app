import alea from './alea.js';
import colorScheme from './color-scheme.js';

const types = [
  'fire',
  'grass',
  'water',
  'electric',
  'fighting',
  'psychic',
  'colorless',
  'dark',
  'metal',
  'fairy',
  'bug',
  'rock',
  'flying',
  'ground',
  'ice',
  'poison',
  'ghost',
  'dragon',
];
const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const rarityFactors = [80, 18, 1.8, 0.18, 0.02].map(n => n / 100);

function makeRandom(rng, n) {
  const raw = new Float32Array(n);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = rng();
  }
  return raw;
}
const makeColors = rng =>
  colorScheme
    .from_hue(rng() * 360)
    .scheme('triade')
    .variation('default')
    .colors()
    .map(c => '#' + c);
const generateStats = (seed = '') => {
  const rng = alea(seed);
  const colors = makeColors(rng);
  const color = colors[0];
  const color2 = colors[4];
  const color3 = colors[8];
  const art = {
    colors,
    color,
    color2,
    color3,
    details: makeRandom(rng, 32),
  };
  const stats = {
    type: types[Math.floor(rng() * types.length)],
    rarity: (() => {
      const f = rng();
      let totalFactor = 0;
      for (let i = 0; i < rarityFactors.length; i++) {
        totalFactor += rarityFactors[i];
        if (f <= totalFactor) {
          return rarities[i];
        }
      }
      return rarities[rarities.length - 1];
    })(),
    level: Math.floor(rng() * 100),
    hp: Math.floor(rng() * 0xff),
    mp: Math.floor(rng() * 0xff),
    atk: Math.floor(rng() * 0xff),
    def: Math.floor(rng() * 0xff),
    mag: Math.floor(rng() * 0xff),
    spr: Math.floor(rng() * 0xff),
    dex: Math.floor(rng() * 0xff),
    lck: Math.floor(rng() * 0xff),
    details: makeRandom(rng, 32),
  };
  return {
    art,
    stats,
  };
};
export default generateStats;
export {types, rarities};
