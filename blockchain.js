import {contractsHost} from './constants.js';
import wordList from './wordlist.js';
import {accountsHost} from './constants.js';

function hexToWordList(hex) {
  const words = [];
  let n = BigInt('0x' + hex);
  n <<= BigInt(2);
  while (n !== BigInt(0)) {
    const a = n & BigInt(0x7FF);
    words.push(wordList[Number(a)]);
    n -= a;
    n >>= BigInt(11);
  }
  return words.join(' ');
}
function wordListToHex(words) {
  words = words.split(/\s+/);

  let n = BigInt(0);
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    const index = wordList.indexOf(word);
    const a = BigInt(index);
    n <<= BigInt(11);
    n |= a;
  }
  n >>= BigInt(2);
  return n.toString(16);
}

export {
  hexToWordList,
  wordListToHex,
};