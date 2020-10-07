import storage from './storage.js';
import {createAccount, getContractSource, hexToWordList, wordListToHex} from './blockchain.js';
import {storageHost, previewExt} from './constants.js'

const loginEndpoint = 'https://login.exokit.org';
// const usersEndpoint = 'https://users.exokit.org';

const _clone = o => JSON.parse(JSON.stringify(o));

let loginToken = null;
let userObject = null;
/* async function ensureUserObjectBaked() {
  const contractSource = await getContractSource('isUserAccountBaked.cdc');

  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      limit: 100,
      script: contractSource.replace(/ARG0/g, '0x' + loginToken.addr),
      wait: true,
    }),
  });
  const response = await res.json();
  const isBaked = response.encodedData.value;
  if (!isBaked) {
    const contractSources = await getContractSource('bakeUserAccount.json');
    for (const contractSource of contractSources) {
      contractSource.address = loginToken.addr;
      contractSource.mnemonic = loginToken.mnemonic;
      contractSource.limit = 100;
      contractSource.wait = true;

      const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify(contractSource),
      });
      
      const response = await res.json();
      console.log('baked account result', response);
    }
  }
} */
async function pullUserObject() {
  // await ensureUserObjectBaked();
  
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
  const avatarHash = response.encodedData.value[1].value && response.encodedData.value[1].value.value;
  const avatarFileName = response.encodedData.value[2].value && response.encodedData.value[2].value.value;
  userObject = {
    name,
    avatar: {
      hash: avatarHash,
      filename: avatarFileName,
    },
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

  console.log('got user token', loginToken);

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
        </div>
        <!-- <input type=submit value="Log out" class="button highlight"> -->
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
    navigator.clipboard.writeText('0x' + loginToken.addr);
  });
  document.getElementById('privatekey-button').addEventListener('click', async e => {
    navigator.clipboard.writeText(loginToken.mnemonic + ' ' + hexToWordList(loginToken.addr));
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
        const contractSource = await getContractSource('setUserData.cdc');

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
        const response2 = await res.json();
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
    const newLoginToken = await createAccount();
    const {address: addr, mnemonic} = newLoginToken;
    await finishLogin({
      addr,
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
      if (split.length === 30) {
        const mnemonic = split.slice(0, 24).join(' ');
        const addr = wordListToHex(split.slice(24).join(' '));

        finishLogin({
          addr,
          mnemonic,
        });
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

      if (await doLogin(loginEmail.value, loginVerificationCode.value)) {
        /* xrEngine.postMessage({
          method: 'login',
          loginToken,
        }); */
      }
    } else if (loginForm.classList.contains('phase-3')) {
      await storage.remove('loginToken');

      window.location.reload();
    }
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
    return loginToken && loginToken.addr;
  }
  getMnemonic() {
    return loginToken && loginToken.mnemonic;
  }

  getAvatar() {
    return userObject && userObject.avatar;
  }

  async setAvatar(id) {
    if (loginToken) {
      const {mnemonic, addr} = loginToken;
      const [_setResponse, avatarSpec] = await Promise.all([
        (async () => {
          const contractSource = await getContractSource('setUserData.cdc');

          const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
            method: 'POST',
            body: JSON.stringify({
              address: addr,
              mnemonic,

              limit: 100,
              transaction: contractSource
                .replace(/ARG0/g, "avatar")
                .replace(/ARG1/g, id),
              wait: true,
            }),
          });
          return await res.json();
        })(),
        (async () => {
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
        })(),
      ]);
      userObject.avatar = avatarSpec;
      // await pushUserObject();
      this.dispatchEvent(new MessageEvent('avatarchange', {
        data: avatarSpec,
      }));
    } else {
      throw new Error('not logged in');
    }
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
      const contractSource = await getContractSource('getHashes.cdc');

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
        const match = filename.match(/\.([^\.]+)$/);
        const ext = match ? match[1] : 'bin';
        const preview = `https://preview.exokit.org/${hash}.${ext}/preview.${previewExt}`;
        return {id, hash, filename, preview};
      });
      return entries;
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