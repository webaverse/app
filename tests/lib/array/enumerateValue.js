import o from 'ospec';
import {enumerateValue} from '../../../lib/array.js';

o('enumerateValue', () => {
  o(enumerateValue(3, 'test')).deepEquals(['test', 'test', 'test']);
});
