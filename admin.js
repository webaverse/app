import flowConstants from './flow-constants.js';
import {accountsHost} from './constants.js';
import {uint8Array2hex} from './util.js';

const _createAccount = async () => {
  const res = await fetch(accountsHost, {
    method: 'POST',
  });
  const j = await res.json();
  return j;
};
const _bakeContract = async (contractKeys, contractSource) => {
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: contractKeys.address,
      privateKey: contractKeys.privateKey,
      publicKey: contractKeys.publicKey,

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

  console.log('bake contract 2', response2);
  return response2;
};

{
	const createAccountForm = document.getElementById('create-account-form');
	const createAccountFormOutput = document.getElementById('create-account-form-output');
	createAccountForm.addEventListener('submit', async e => {
	  e.preventDefault();

	  const userKeys = await _createAccount();
	  createAccountFormOutput.value = JSON.stringify(userKeys, null, 2);
	});
}
{
	const contractForm = document.getElementById('contract-form');
	const contractFormSource = document.getElementById('contract-form-source');
	contractForm.addEventListener('submit', async e => {
	  e.preventDefault();

	  const contractSource = contractFormSource.value;
	  contractFormSource.setAttribute('disabled', '');

	  const contractKeys = await _createAccount();
	  const contract = await _bakeContract(contractKeys, contractSource);

	  contractFormSource.value = JSON.stringify(contractKeys, null, 2);
	  contractFormSource.removeAttribute('disabled');
	});
}