import {contractsHost} from './constants.js';
import flowConstants from './flow-constants.js';
import wordList from './wordlist.js';

const contractSourceCache = {};
async function getContractSource(p) {
  let contractSource = contractSourceCache[p];
  if (!contractSource) {
    const res = await fetch(contractsHost + '/flow/' + p);
    contractSource = await res.text();
    contractSource = await resolveContractSource(contractSource);
    if (/\.json$/.test(p)) {
      contractSource = eval(contractSource);
    }
    contractSourceCache[p] = contractSource;
  }
  return contractSource;
}

async function resolveContractSource(contractSource) {
  const {FungibleToken, NonFungibleToken, ExampleToken, ExampleNFT, ExampleAccount} = await flowConstants.load();
  return contractSource
    .replace(/NONFUNGIBLETOKENADDRESS/g, NonFungibleToken)
    .replace(/FUNGIBLETOKENADDRESS/g, FungibleToken)
    .replace(/EXAMPLETOKENADDRESS/g, ExampleToken)
    .replace(/EXAMPLENFTADDRESS/g, ExampleNFT)
    .replace(/EXAMPLEACCOUNTADDRESS/g, ExampleAccount);
}

function hexToWordList(hex) {
  const words = [];
  let n = BigInt('0x' + hex);
  n <<= 2n;
  while (n !== 0n) {
    const a = n & 0x7FFn;
    words.push(wordList[Number(a)]);
    n -= a;
    n >>= 11n;
  }
  return words.join(' ');
}
function wordListToHex(words) {
  words = words.split(/\s+/);

  let n = 0n;
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    const index = wordList.indexOf(word);
    const a = BigInt(index);
    n <<= 11n;
    n |= a;
  }
  n >>= 2n;
  return n.toString(16);
}

export {
  getContractSource,
  resolveContractSource,
  hexToWordList,
  wordListToHex,
};