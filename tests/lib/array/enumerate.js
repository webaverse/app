import o from 'ospec';
import {enumerate} from '../../../lib/array.js';

const a0 = [0, 1, 2];

o.spec('enumerate', function() {
  o('empty', function() {
    o(enumerate()).deepEquals([]);
  });

  o('parameter', function() {
    o(enumerate(3)).deepEquals(a0);
  });
});
