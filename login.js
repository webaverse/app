import storage from './storage.js';
// import {createAccount, getContractSource, hexToWordList, wordListToHex} from './blockchain.js';
// import * as blockchain from './blockchain.js';
import {storageHost, previewHost, loginEndpoint, previewExt} from './constants.js';
import {getExt} from './util.js';
import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import ethereumJsTx from './ethereumjs-tx.js';
const {Transaction, Common} = ethereumJsTx;
import * as blockchain from './blockchain.js';
import {makePromise} from './util.js';

// const usersEndpoint = 'https://users.exokit.org';

const _clone = o => JSON.parse(JSON.stringify(o));

const getTransactionSignature = async (chainName, contractName, transactionHash) => {
  const u = `https://sign.exokit.org/${chainName}/${contractName}/${transactionHash}`;
  for (let i = 0; i < 10; i++) {
    const signature = await fetch(u).then(res => res.json());
    // console.log('got sig', u, signature);
    if (signature) {
      return signature;
    } else {
      await new Promise((accept, reject) => {
        setTimeout(accept, 1000);
      });
    }
  }
  return null;
};
const transactionQueue = {
  running: false,
  queue: [],
  lock() {
    if (!this.running) {
      this.running = true;
      return Promise.resolve();
    } else {
      const promise = makePromise();
      this.queue.push(promise.accept);
      return promise;
    }
  },
  unlock() {
    this.running = false;
    if (this.queue.length > 0) {
      this.queue.shift()();
    }
  },
};
const runTransaction = async (contractName, method, ...args) => {
  // console.log('run tx', contracts['sidechain'], [contractName, method]);
  const {web3, contracts} = await blockchain.load();

  const {mnemonic} = loginToken;
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  // console.log('got mnem', mnemonic, address);
  const privateKey = wallet.getPrivateKeyString();
  const privateKeyBytes = Uint8Array.from(web3.utils.hexToBytes(privateKey));

  const txData = contracts[contractName].methods[method](...args);
  const data = txData.encodeABI();
  const gas = await txData.estimateGas({
    from: address,
  });
  let gasPrice = await web3.eth.getGasPrice();
  gasPrice = parseInt(gasPrice, 10);

  await transactionQueue.lock();
  const nonce = await web3.eth.getTransactionCount(address);
  let tx = Transaction.fromTxData({
    to: contracts[contractName]._address,
    nonce: '0x' + new web3.utils.BN(nonce).toString(16),
    gas: '0x' + new web3.utils.BN(gasPrice).toString(16),
    gasPrice: '0x' + new web3.utils.BN(gasPrice).toString(16),
    gasLimit: '0x' + new web3.utils.BN(8000000).toString(16),
    data,
  }, {
    common: Common.forCustomChain(
      'mainnet',
      {
        name: 'geth',
        networkId: 1,
        chainId: 1337,
      },
      'petersburg',
    ),
  }).sign(privateKeyBytes);
  const rawTx = '0x' + tx.serialize().toString('hex');
  // console.log('signed tx', tx, rawTx);
  const receipt = await web3.eth.sendSignedTransaction(rawTx);
  transactionQueue.unlock();
  return receipt;
};

let loginToken = null;
let userObject = null;
async function pullUserObject() {
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  const res = await fetch(`https://accounts.webaverse.com/${address}`);
  const result = await res.json();
  console.log('pull user object', result);
  const {name, avatarUrl, avatarFileName, avatarPreview, ftu} = result;

  /* const {web3} = await blockchain.load();
  const contractSource = await getContractSource('getUserData.cdc');

  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      limit: 100,
      script: contractSource.replace(/ARG0/g, '0x' + loginToken.addr),
      wait: true,
    }),
  });
  const response = await res.json();
  const name = response.encodedData.value[0].value ? response.encodedData.value[0].value.value : 'Anonymous';
  const avatarUrl = response.encodedData.value[1].value && response.encodedData.value[1].value.value;
  const avatarFileName = response.encodedData.value[2].value && response.encodedData.value[2].value.value;
  const avatarPreview = response.encodedData.value[3].value && response.encodedData.value[3].value.value;
  const ftu = !!(response.encodedData.value[4].value && response.encodedData.value[4].value.value); */
  userObject = {
    name,
    avatar: {
      url: avatarUrl,
      filename: avatarFileName,
      preview: avatarPreview,
    },
    ftu,
  };
}
/* async function pushUserObject() {
  const res = await fetch(`${usersEndpoint}/${loginToken.name}`, {
    method: 'PUT',
    body: JSON.stringify(userObject),
  });
  if (res.ok) {
    // nothing
  } else {
    throw new Error(`invalid status code: ${res.status}`);
  }
} */
function updateUserObject() {
  const userName = document.getElementById('user-name');
  userName.innerText = userObject.name;

  loginManager.pushUpdate();
}
async function finishLogin(newLoginToken) {
  await storage.set('loginToken', newLoginToken);

  loginToken = newLoginToken;

  const loginForm = document.getElementById('login-form');
  // document.body.classList.add('logged-in');
  loginForm.classList.remove('phase-1');
  loginForm.classList.remove('phase-2');
  loginForm.classList.add('phase-3');

  await pullUserObject();
  updateUserObject();
}
async function doLogin(email, code) {
  const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });

  if (res.status >= 200 && res.status < 300) {
    const newLoginToken = await res.json();

    await finishLogin(newLoginToken);

    return true;
  } else {
    const loginError = document.getElementById('login-error');
    const loginForm = document.getElementById('login-form');
    loginError.innerText = 'Invalid code!';
    loginForm.classList.add('phase-2');
    return false;
  }
}
async function tryLogin() {
  loginToken = await storage.get('loginToken');

  const loginForm = document.getElementById('login-form');
  loginForm.classList.add('login-form');
  loginForm.innerHTML = `
    <div class=phase-content>
      <div class=login-notice id=login-notice></div>
      <div class=login-error id=login-error></div>
    </div>
    <div class="phase-content phase-1-content">
      <input type=text placeholder="Email or key" id=login-email>
      <input type=submit value="Log in" class="button highlight">
      <input type=button value="Cancel" class="button highlight" id=login-cancel>
    </div>
    <div class="phase-content phase-2-content">
      <input type=text placeholder="Verification code" id=login-verification-code>
      <input type=submit value="Verify" class="button highlight">
    </div>
    <div class="phase-content phase-3-content">
      <nav class=user-button id=user-button>
        <img src="favicon.ico">
        <span class=name id=user-name></span>
        <div class=unregistered-warning id=unregistered-warning style="display: none">
          <i class="fal fa-exclamation-triangle"></i>
          <div class=label>unreg</div>
        </div>
        <i class="fal fa-bars"></i>
        <div class=user-details>
          <nav class=subbutton id=address-button>
            <i class="fal fa-address-card"></i>
            Address copy
          </nav>
          <nav class=subbutton id=privatekey-button>
            <i class="fal fa-key"></i>
            Private key copy
          </nav>
          <nav class=subbutton id=changename-button>
            <i class="fal fa-signature"></i>
            Change name
          </nav>
          <nav class=subbutton id=signin-button>
            <i class="fal fa-sign-in"></i>
            Switch account
          </nav>
          <nav class=subbutton id=logout-button>
            <i class="fal fa-sign-out"></i>
            Log out
          </nav>
        </div>
      </nav>
    </div>
    <div class="phase-content phaseless-content">
      <div>Working...</div>
    </div>
  `;

  const userButton = document.getElementById('user-button');
  userButton.addEventListener('click', e => {
    userButton.classList.toggle('open');
  });

  const loginCancel = document.getElementById('login-cancel');
  loginCancel.addEventListener('click', e => {
    loginForm.classList.remove('phase-1');
    loginForm.classList.add('phase-3');
  });

  const userName = document.getElementById('user-name');
  userName.addEventListener('keydown', e => {
    if (e.which === 13) {
      e.preventDefault();
      e.stopPropagation();
      userName.blur();
    }
  });
  document.getElementById('address-button').addEventListener('click', e => {
    const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
    const address = wallet.getAddressString();
    navigator.clipboard.writeText(address);
  });
  document.getElementById('privatekey-button').addEventListener('click', async e => {
    navigator.clipboard.writeText(loginToken.mnemonic);
    delete loginToken.unregistered;
    await storage.set('loginToken', loginToken);

    unregisteredWarning.style.display = 'none';
  });
  document.getElementById('changename-button').addEventListener('click', e => {
    userName.setAttribute('contenteditable', '');
    userName.focus();
    const oldUserName = userName.innerText;
    userName.addEventListener('blur', async e => {
      userName.removeAttribute('contenteditable');

      const newUserName = userName.innerText;
      if (newUserName !== oldUserName) {
        const address = this.getAddress();
        await runTransaction('Account', 'setMetadata', address, 'name', name);
        /* const contractSource = await getContractSource('setUserData.cdc');

        const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
          method: 'POST',
          body: JSON.stringify({
            address: loginToken.addr,
            mnemonic: loginToken.mnemonic,

            limit: 100,
            transaction: contractSource
              .replace(/ARG0/g, 'name')
              .replace(/ARG1/g, newUserName),
            wait: true,
          }),
        });
        const response2 = await res.json(); */
      }
    }, {
      once: true,
    });
  });
  document.getElementById('signin-button').addEventListener('click', e => {
    loginForm.classList.remove('phase-3');
    loginForm.classList.add('phase-1');
    loginEmail.focus();
  });
  document.getElementById('logout-button').addEventListener('click', async e => {
    await storage.remove('loginToken');
    window.location.reload();
  });
  const unregisteredWarning = document.getElementById('unregistered-warning');

  // const userButton = document.getElementById('user-button');
  const loginEmail = document.getElementById('login-email');
  const loginVerificationCode = document.getElementById('login-verification-code');
  const loginNotice = document.getElementById('login-notice');
  const loginError = document.getElementById('login-error');
  /* userButton.addEventListener('click', e => {
    userButton.classList.toggle('open');
  }); */
  /* userDetails.addEventListener('click', e => {
    // e.preventDefault();
    e.stopPropagation();
  }); */
  if (loginToken) {
    await pullUserObject();
    updateUserObject();

    loginForm.classList.add('phase-3');

    if (loginToken.unregistered) {
      unregisteredWarning.style.display = null;
    }
  } else {
    const mnemonic = bip39.generateMnemonic();
    await finishLogin({
      mnemonic,
      unregistered: true,
    });

    unregisteredWarning.style.display = null;
  }
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (loginForm.classList.contains('phase-1') && loginEmail.value) {
      loginNotice.innerHTML = '';
      loginError.innerHTML = '';
      loginForm.classList.remove('phase-1');

      const split = loginEmail.value.split(/\s+/).filter(w => !!w);
      if (split.length === 12) {
        const mnemonic = split.slice(0, 12).join(' ');

        await finishLogin({
          mnemonic,
        });

        location.reload();
      } else {
        const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(loginEmail.value)}`, {
          method: 'POST',
        });
        if (res.status >= 200 && res.status < 300) {
          loginNotice.innerText = `Code sent to ${loginEmail.value}!`;
          loginForm.classList.add('phase-2');

          return res.blob();
        } else {
          loginError.innerText = 'Invalid email!';
          loginForm.classList.add('phase-1');
          throw new Error(`invalid status code: ${res.status}`);
        }
      }
    } else if (loginForm.classList.contains('phase-2') && loginEmail.value && loginVerificationCode.value) {
      loginNotice.innerHTML = '';
      loginError.innerHTML = '';
      loginForm.classList.remove('phase-2');

      const loginOk = await doLogin(loginEmail.value, loginVerificationCode.value);
      if (loginOk) {
        location.reload();
      }
    } /* else if (loginForm.classList.contains('phase-3')) {
      await storage.remove('loginToken');

      location.reload();
    } */
  });
}

class LoginManager extends EventTarget {
  constructor() {
    super();
  }

  isLoggedIn() {
    return !!userObject;
  }

  getUsername() {
    return userObject && userObject.name;
  }

  async setUsername(name) {
    if (userObject) {
      userObject.name = name;
      // await pushUserObject();
      updateUserObject();
    }
    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: name,
    }));
  }

  /* async getLatestBlock() {
    const res = await fetch(`https://accounts.exokit.org/latestBlock`);
    return await res.json();
  }

  async getEvents(eventTypes, startBlock, endBlock) {
    if (Array.isArray(eventTypes)) {
      eventTypes = eventTypes.join(',');
    }
    const res = await fetch(`https://accounts.exokit.org/getEvents/${eventTypes}/${startBlock}/${endBlock}`);
    return await res.json();
  } */

  getAddress() {
    if (loginToken.mnemonic) {
      const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
      const address = wallet.getAddressString();
      return address;
    } else {
      return null;
    }
  }
  getMnemonic() {
    return loginToken && loginToken.mnemonic;
  }

  getAvatar() {
    return userObject && userObject.avatar;
  }

  async setAvatar(id) {
    if (loginToken) {
      // const {mnemonic} = loginToken;
      const res = await fetch(`https://tokens.webaverse.com/${id}`);
      const token = await res.json();
      const {filename, hash} = token.properties;
      /* const {filename, hash} = await (async () => {
        const contractSource = await getContractSource('getNft.cdc');

        const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
          method: 'POST',
          body: JSON.stringify({
            limit: 100,
            script: contractSource
              .replace(/ARG0/g, id),
            wait: true,
          }),
        });
        const response2 = await res.json();
        const [hash, filename] = response2.encodedData.value.map(value => value.value && value.value.value);
        return {hash, filename};
      })(); */
      const url = `${storageHost}/${hash.slice(2)}`;
      const ext = getExt(filename);
      const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
      const address = this.getAddress();
      await Promise.all([
        runTransaction('Account', 'setMetadata', address, 'avatarUrl', url),
        runTransaction('Account', 'setMetadata', address, 'avatarFileName', filename),
        runTransaction('Account', 'setMetadata', address, 'avatarPreview', preview),
      ]);
      /* {
        const contractSource = await getContractSource('setUserDataMulti.cdc');

        const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
          method: 'POST',
          body: JSON.stringify({
            address: loginToken.addr,
            mnemonic: loginToken.mnemonic,

            limit: 100,
            transaction: contractSource
              .replace(/ARG0/g, JSON.stringify(['avatarUrl', 'avatarFilename', 'avatarPreview']))
              .replace(/ARG1/g, JSON.stringify([url, filename, preview])),
            wait: true,
          }),
        });
        await res.json();
      } */
      userObject.avatar = {
        url,
        filename,
        preview,
      };
      // await pushUserObject();
      this.dispatchEvent(new MessageEvent('avatarchange', {
        data: userObject.avatar,
      }));
    } else {
      throw new Error('not logged in');
    }
  }

  getFtu() {
    return !!(userObject && userObject.ftu);
  }

  async setFtu(name, avatarUrl) {
    const address = this.getAddress();
    const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

    await Promise.all([
      runTransaction('Account', 'setMetadata', address, 'name', name),
      runTransaction('Account', 'setMetadata', address, 'avatarUrl', avatarUrl),
      runTransaction('Account', 'setMetadata', address, 'avatarFileName', avatarUrl),
      runTransaction('Account', 'setMetadata', address, 'avatarPreview', avatarPreview),
      runTransaction('Account', 'setMetadata', address, 'ftu', '1'),
    ]);
    // console.log('wrote all tx');
    /* const contractSource = await getContractSource('setUserDataMulti.cdc');

    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: loginToken.addr,
        mnemonic: loginToken.mnemonic,

        limit: 100,
        transaction: contractSource
          .replace(/ARG0/g, JSON.stringify(['name', 'avatarUrl', 'avatarFilename', 'avatarPreview', 'ftu']))
          .replace(/ARG1/g, JSON.stringify([name, avatarUrl, avatarUrl, avatarPreview, '1'])),
        wait: true,
      }),
    });
    const response2 = await res.json(); */

    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: name,
    }));
    userObject.avatar = {
      url: avatarUrl,
      filename: avatarUrl,
      preview: avatarPreview,
    };
    this.dispatchEvent(new MessageEvent('avatarchange', {
      data: userObject.avatar,
    }));
  }

  async getBalance() {
    if (loginToken) {
      const contractSource = await getContractSource('getBalance.cdc');

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          script: contractSource
            .replace(/ARG0/g, '0x' + loginToken.addr),
          wait: true,
        }),
      });
      const response2 = await res.json();
      const balance = parseFloat(response2.encodedData.value);
      return balance;
    } else {
      return 0;
    }
  }

  async getInventory() {
    if (loginToken) {
      const address = this.getAddress();
      const res = await fetch(`https://tokens.webaverse.com/${address}`);
      const tokens = await res.json();
      /* const contractSource = await getContractSource('getHashes.cdc');

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          script: contractSource
            .replace(/ARG0/g, '0x' + loginToken.addr),
          wait: true,
        }),
      });
      const response2 = await res.json();

      const entries = response2.encodedData.value.map(({value: {fields}}) => {
        const id = parseInt(fields.find(field => field.name === 'id').value.value, 10);
        const hash = fields.find(field => field.name === 'hash').value.value;
        const filename = fields.find(field => field.name === 'filename').value.value;
        const balance = parseInt(fields.find(field => field.name === 'balance').value.value, 10);
        const match = filename.match(/\.([^\.]+)$/);
        const ext = match ? match[1] : 'bin';
        const preview = `https://preview.exokit.org/${hash.slice(2)}.${ext}/preview.${previewExt}`;
        return {id, hash, filename, balance, preview};
      }); */
      return tokens;
    } else {
      return [];
    }
  }

  async uploadFile(file) {
    if (loginToken) {
      const {name} = file;
      if (name) {
        const {mnemonic, addr} = loginToken;

        let hash;
        {
          const res = await fetch(storageHost, {
            method: 'POST',
            body: file,
          });
          const j = await res.json();
          hash = j.hash;
        }
        {
          const contractSource = await getContractSource('mintNft.cdc');

          const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
            method: 'POST',
            body: JSON.stringify({
              address: addr,
              mnemonic,

              limit: 100,
              transaction: contractSource
                .replace(/ARG0/g, hash)
                .replace(/ARG1/g, name),
              wait: true,
            }),
          });
          const response2 = await res.json();
          if (response2?.transaction?.events[0]) {
            const id = parseInt(response2.transaction.events[0].payload.value.fields.find(field => field.name === 'id').value.value, 10);
            return {
              hash,
              id,
            };
          } else {
              return {
                hash,
                id,
              };
          }
        }
      } else {
        throw new Error('file has no name');
      }
    } else {
      throw new Error('not logged in');
    }
  }

  async sendFt(address, amount) {
    if (loginToken) {
      const {mnemonic, addr} = loginToken;
      const contractSource = await getContractSource('transferToken.cdc');

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          address: addr,
          mnemonic,

          limit: 100,
          transaction: contractSource
            .replace(/ARG0/g, amount)
            .replace(/ARG1/g, '0x' + address),
          wait: true,
        }),
      });
      const response2 = await res.json();
    } else {
      throw new Error('not logged in');
    }
  }

  async sendNft(address, id) {
    if (loginToken) {
      const {mnemonic, addr} = loginToken;
      const contractSource = await getContractSource('transferNft.cdc');

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          address: addr,
          mnemonic,

          limit: 100,
          transaction: contractSource
            .replace(/ARG0/g, id)
            .replace(/ARG1/g, '0x' + address),
          wait: true,
        }),
      });
      const response2 = await res.json();
    } else {
      throw new Error('not logged in');
    }
  }

  async destroyNft(id) {
    if (loginToken) {
      const {mnemonic, addr} = loginToken;
      const contractSource = await getContractSource('destroyNft.cdc');

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
          address: addr,
          mnemonic,

          limit: 100,
          transaction: contractSource
            .replace(/ARG0/g, id),
          wait: true,
        }),
      });
      const response2 = await res.json();
    } else {
      throw new Error('not logged in');
    }
  }

  pushUpdate() {
    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: userObject && userObject.name,
    }));
    this.dispatchEvent(new MessageEvent('avatarchange', {
      data: userObject && userObject.avatar,
    }));
    this.dispatchEvent(new MessageEvent('inventorychange'));
  }
}
const loginManager = new LoginManager();

export {
  doLogin,
  tryLogin,
  loginManager,
};
