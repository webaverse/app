import o from 'ospec';
import {clamp} from '../../../lib/math.js';

const
  min = 0;
const max = 10;

o.spec('clamp', () => {
  o('Out of bounds', () => {
    o(clamp(min - 1, min, max)).equals(min);
    o(clamp(max + 1, min, max)).equals(max);
  });

  o('Inclusive', () => {
    o(clamp(min, min, max)).equals(min);
    o(clamp(max, min, max)).equals(max);
  });

  o('Within bounds', () => {
    const x = min + 1;
    o(clamp(x, min, max)).equals(x);
  });
});
