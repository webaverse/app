import alea from './alea.js';
import colorScheme from './color-scheme.js';
import types from './types.js';
import {rarities, rarityFactors} from './rarities.js';

function makeRng() {
  const a = Array.from(arguments);
  const seed = a.join(':');
  const rng = alea(seed);
  return rng;
}

function makeRandomFloat32Array(rng, n) {
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

function createMisc(seed = '', count = 1) {
  const result = Array(count);
  const rng = alea(seed);
  for (let i = 0; i < count; i++) {
    const colors = makeColors(rng);
    const color = colors[0];
    const color2 = colors[4];
    const color3 = colors[8];
    const art = {
      colors,
      color,
      color2,
      color3,
      details: makeRandomFloat32Array(rng, 32),
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
      attack: Math.floor(rng() * 0xff),
      defense: Math.floor(rng() * 0xff),
      magic: Math.floor(rng() * 0xff),
      magicDefense: Math.floor(rng() * 0xff),
      speed: Math.floor(rng() * 0xff),
      accuracy: Math.floor(rng() * 0xff),
      evasion: Math.floor(rng() * 0xff),
      luck: Math.floor(rng() * 0xff),
      details: makeRandomFloat32Array(rng, 32),
    };
    result[i] = {
      art,
      stats,
    };
  }
  return result;
}
export {makeRng, createMisc};
