import {createAccount, resolveContractSource, hexToWordList} from './blockchain.js';
import {uint8Array2hex} from './util.js';

const _jsonParse = s => {
  try {
    return JSON.parse(s);
  } catch (err) {
    return null;
  }
};
const _runArray = async (userKeys, array) => {
  const result = Array(array.length);
  for (let i = 0; i < array.length; i++) {
    result[i] = await _runSpec(userKeys, array[i]);
  }
  return result;
};
const _bakeContract = async (contractKeys, contractSource) => {
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: contractKeys.address,
      privateKey: contractKeys.privateKey,
      publicKey: contractKeys.publicKey,
      mnemonic: contractKeys.mnemonic,

      limit: 100,
      transaction: `\
        transaction(code: String) {
          prepare(acct: AuthAccount) {
            acct.setCode(code.decodeHex())
          }
        }
      `,
      args: [
        {value: uint8Array2hex(new TextEncoder().encode(contractSource)), type: 'String'},
      ],
      wait: true,
    }),
  });
  const response2 = await res.json();

  // console.log('bake contract 2', response2);
  return response2;
};
const _runTransaction = async (userKeys, transaction) => {
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: userKeys.address,
      privateKey: userKeys.privateKey,
      publicKey: userKeys.publicKey,
      mnemonic: userKeys.mnemonic,

      limit: 100,
      transaction,
      wait: true,
    }),
  });
  const response2 = await res.json();

  // console.log('bake contract 2', response2);
  return response2;
};
const _runScript = async script => {
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      limit: 100,
      script,
      wait: true,
    }),
  });
  const response2 = await res.json();

  // console.log('bake contract 2', response2);
  return response2;
};
const _runSpec = async (userKeys, spec) => {
  const {transaction, script, args} = spec;
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: userKeys.address,
      privateKey: userKeys.privateKey,
      publicKey: userKeys.publicKey,
      mnemonic: userKeys.mnemonic,

      limit: 100,
      transaction,
      script,
      args,
      wait: true,
    }),
  });
  const response2 = await res.json();

  // console.log('bake contract 2', response2);
  return response2;
};

{
  const createAccountForm = document.getElementById('create-account-form');
  const createAccountFormOutput = document.getElementById('create-account-form-output');
  createAccountForm.addEventListener('submit', async e => {
    e.preventDefault();

    createAccountFormOutput.setAttribute('disabled', '');

    const userKeys = await createAccount();
    createAccountFormOutput.value = JSON.stringify(userKeys, null, 2);
    createAccountFormOutput.removeAttribute('disabled');
  });
}
{
  const contractForm = document.getElementById('contract-form');
  const contractFormKeys = document.getElementById('contract-form-keys');
  const contractFormSource = document.getElementById('contract-form-source');
  contractForm.addEventListener('submit', async e => {
    e.preventDefault();

    const contractSource = await resolveContractSource(contractFormSource.value);
    contractFormSource.setAttribute('disabled', '');

    const contractKeys = _jsonParse(contractFormKeys.value);

    try {
      let result, o;
      if (contractSource.charAt(0) === '[') {
        console.log('run array');
        result = await _runArray(contractKeys, eval(contractSource));
      } else if (contractSource.charAt(0) === '{') {
        console.log('run array');
        result = await _runSpec(contractKeys, eval(contractSource));
      } else if (/pub contract /.test(contractSource)) {
        console.log('run contract');
        result = await _bakeContract(contractKeys, contractSource);
      } else if (/pub fun main\(\)/.test(contractSource)) {
        console.log('run script');
        result = await _runScript(contractSource);
      } else if (/transaction /.test(contractSource)) {
        console.log('run transaction');
        result = await _runTransaction(contractKeys, contractSource);
      } else {
        console.warn('do not know how to run source', contractSource);
      }

      contractFormSource.value = JSON.stringify(result, null, 2);
    } catch(err) {
      contractFormSource.value = err.stack;
    }
    contractFormSource.removeAttribute('disabled');
  });
}