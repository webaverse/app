import {contractsHost} from './constants.js';
import flowConstants from './flow-constants.js';
import wordList from './wordlist.js';
import {accountsHost} from './constants.js';

const createAccount = async () => {
  const res = await fetch(accountsHost, {
    method: 'POST',
  });
  const j = await res.json();
  j.key = j.mnemonic + ' ' + hexToWordList(j.address);
  return j;
};

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
  const {FungibleToken, NonFungibleToken, WebaverseToken, WebaverseNFT, WebaverseAccount} = await flowConstants.load();
  return contractSource
    .replace(/NONFUNGIBLETOKENADDRESS/g, NonFungibleToken)
    .replace(/FUNGIBLETOKENADDRESS/g, FungibleToken)
    .replace(/WEBAVERSETOKENADDRESS/g, WebaverseToken)
    .replace(/WEBAVERSENFTADDRESS/g, WebaverseNFT)
    .replace(/WEBAVERSEACCOUNTADDRESS/g, WebaverseAccount);
}

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
  createAccount,
  getContractSource,
  resolveContractSource,
  hexToWordList,
  wordListToHex,
};