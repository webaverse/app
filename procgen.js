import alea from './alea.js';

const rarities = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

function makeRandom(rng, n) {
  const raw = new Float32Array(n);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = rng();
  }
  return raw;
}
function procgen(seed) {
  const rng = alea(seed);
  const art = {
    color: '#' + Math.floor(rng() * 0xFFFFFF).toString(16).padStart(6, '0'),
    color2: '#' + Math.floor(rng() * 0xFFFFFF).toString(16).padStart(6, '0'),
    color3: '#' + Math.floor(rng() * 0xFFFFFF).toString(16).padStart(6, '0'),
    details: makeRandom(rng, 32),
  };
  const stats = {
    rarity: rarities[Math.floor(rng() * rarities.length)],
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
    charisma: Math.floor(rng() * 0xFF),
    luck:  Math.floor(rng() * 0xFF),
    details: makeRandom(rng, 32),
  };
  return {
    art,
    stats,
  };
}
window.procgen = procgen;