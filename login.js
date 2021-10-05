throw new Error('lol');
// import storage from './storage.js';
// import {createAccount, getContractSource, hexToWordList, wordListToHex} from './blockchain.js';
// import * as blockchain from './blockchain.js';
import {storageHost, previewHost, accountsHost, tokensHost, loginEndpoint, previewExt} from './constants.js';
import {getExt} from './util.js';
import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import {web3, contracts, getAddressFromMnemonic, runSidechainTransaction} from './blockchain.js';
import {otherChainName} from './constants.js';
import * as notifications from './notifications.js';
import {jsonParse} from './util.js';
// import {menuActions} from './mithril-ui/store/actions.js';

// const usersEndpoint = 'https://users.exokit.org';

// const _clone = o => JSON.parse(JSON.stringify(o));

async function contentIdToStorageUrl(id) {
  if (typeof id === 'number') {
    const hash = await contracts['mainnetsidechain']['NFT'].methods.getHash(id + '').call();
    return `${storageHost}/${hash}`;    
  } else if (typeof id === 'string') {
    return id;
  } else {
    return null;
  }
}

let loginToken = null;
let userObject = null;
async function pullUserObject() {
  const address = getAddressFromMnemonic(loginToken.mnemonic);
  const res = await fetch(`${accountsHost}/${address}`);
  const result = await res.json();
  // console.log('pull user object', result);
  let {name, avatarId, avatarName, avatarExt, avatarPreview, loadout, homeSpaceId, homeSpaceName, homeSpaceExt, homeSpaceFileName, homeSpacePreview, ftu} = result;
  loadout = jsonParse(loadout, Array(8).fill(null));

  const avatarNumber = parseInt(avatarId);
  const avatarUrl = await contentIdToStorageUrl(!isNaN(avatarNumber) ? avatarNumber : avatarId);
  const homeSpaceNumber = parseInt(homeSpaceId);
  const homeSpaceUrl = await contentIdToStorageUrl(!isNaN(homeSpaceNumber) ? homeSpaceNumber : homeSpaceId);

  const inventory = await (async () => {
    const res = await fetch(`${tokensHost}/${address}`);
    const tokens = await res.json();
    return tokens;
  })();

  // menuActions.setInventory(inventory);
  
  userObject = {
    name,
    avatar: {
      id: avatarId,
      name: avatarName,
      ext: avatarExt,
      preview: avatarPreview,
      url: avatarUrl,
    },
    loadout,
    inventory,
    homespace: {
      id: homeSpaceId,
      name: homeSpaceName,
      ext: homeSpaceExt,
      preview: homeSpacePreview,
      url: homeSpaceUrl,
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
  if (userName) {
    userName.innerText = userObject.name || 'Anonymous';
  }

  const avatarIcon = document.getElementById('avatar-icon');
  if (avatarIcon) {
    if (userObject.avatar.preview) {
      avatarIcon.src = userObject.avatar.preview;
    } else {
      delete avatarIcon.src;
    }
  }

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
  
  const unregisteredWarning = document.getElementById('unregistered-warning');

  // const userButton = document.getElementById('user-button');
  const loginForm = document.getElementById('login-form');
  // const loginEmail = document.getElementById('login-email');
  // const loginVerificationCode = document.getElementById('login-verification-code');
  // const loginNotice = document.getElementById('login-notice');
  // const loginError = document.getElementById('login-error');
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

    loginForm && loginForm.classList.add('phase-3');

    if (loginToken.unregistered) {
      unregisteredWarning && (unregisteredWarning.style.display = null);
    }
  } else {
    const mnemonic = bip39.generateMnemonic();
    await finishLogin({
      mnemonic,
      unregistered: true,
    });

    unregisteredWarning && (unregisteredWarning.style.display = null);
  }
};
const loginForm = document.getElementById('login-form');
async function bindLogin() {
  if (loginForm) {
    loginForm.classList.add('login-form');
    loginForm.innerHTML = `
      <div class=phase-content>
        <div class=login-notice id=login-notice></div>
        <div class=login-error id=login-error></div>
      </div>
      <div class="phase-content phase-1-content">
        <input type=text placeholder="Email or key" autocomplete="off" id=login-email>
        <input type=submit value="Log in" class="button highlight">
        <input type=button value="Cancel" class="button highlight" id=login-cancel>
      </div>
      <div class="phase-content phase-2-content">
        <input type=text placeholder="Verification code" autocomplete="off" id=login-verification-code>
        <input type=submit value="Verify" class="button highlight">
      </div>
      <div class="phase-content phase-3-content">
        <nav class=user-button id=user-button>
          <img id=avatar-icon>
          <div class=avatar-icon-placeholder></div>
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
            <nav class=subbutton id=switch-chain-button>
              <i class="fal fa-sign-in"></i>
              <div>Switch to <span id=other-chain-name></span></div>
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
    const loginEmail = loginForm.querySelector('#login-email');
    const loginNotice = loginForm.querySelector('#login-notice');
    const loginError = loginForm.querySelector('#login-error');

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
          await runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'name', name);
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
    // TODO: Fix me with polygon
    document.getElementById('switch-chain-button').addEventListener('click', e => {
      if (/^main\./.test(location.hostname)) {
        location.hostname = location.hostname.replace(/^main\./, '');
      } else {
        location.hostname = 'main.' + location.hostname;
      }
    });
    document.getElementById('other-chain-name').innerText = otherChainName;
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
};

class LoginManager extends EventTarget {
  constructor() {
    super();

    this.loadPromise = null;
  }

  waitForLoad() {
    if (!this.loadPromise) {
      this.loadPromise = tryLogin();
    }
    return this.loadPromise;
  }
  
  async bindLogin() {
    await bindLogin();
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
    if (loginToken) {
      if (loginToken.address) {
        return loginToken.address;
      } else if (loginToken.mnemonic) {
        const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
        loginToken.address = wallet.getAddressString();
        return loginToken.address;
      } else {
        return null;
      }
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

  getAvatarPreview() {
    return userObject && userObject.avatar.preview;
  }

  getLoadout() {
    return userObject ? userObject.loadout : Array(8).fill(null);
  }

  getHomespace() {
    return userObject && userObject.homespace;
  }

  async setAvatar(id) {
    if (loginToken) {
      if (typeof id === 'number') {
        const res = await fetch(`${tokensHost}/${id}`);
        const token = await res.json();
        const {name, ext, hash} = token.properties;
        const preview = `${previewHost}/${hash}.${ext}/preview.${previewExt}`;
        const address = this.getAddress();
        await Promise.all([
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarId', id + ''),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarName', name),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarExt', ext),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', preview),
        ]);

        const url = `${storageHost}/${hash}`;
        userObject.avatar = {
          id: id + '',
          name,
          ext,
          preview,
          url,
        };
        this.dispatchEvent(new MessageEvent('avatarchange', {
          data: userObject.avatar,
        }));
      } else if (typeof id === 'string') {
        const avatarUrl = id;
        const ext = getExt(avatarUrl);
        const name = ext ? avatarUrl.slice(0, -(ext.length + 1)) : avatarUrl;
        const preview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;
        const address = this.getAddress();
        await Promise.all([
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarId', avatarUrl),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarName', name),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarExt', ext),
          runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', preview),
        ]);

        const url = avatarUrl;
        userObject.avatar = {
          id,
          name,
          ext,
          preview,
          url,
        };
        this.dispatchEvent(new MessageEvent('avatarchange', {
          data: userObject.avatar,
        }));
      } else {
        throw new Error('invalid avatar content id: ' + JSON.stringify(id));
      }
    } else {
      throw new Error('not logged in');
    }
  }

  getFtu() {
    return !!(userObject && userObject.ftu);
  }

  /* async setFtu(name, avatarId) {
    throw new Error('not debugged');
    
    const address = this.getAddress();
    const res = await fetch(`${tokensHost}/${avatarId}`);
    const token = await res.json();
    const {name: avatarName, ext: avatarExt, hash} = token.properties;
    const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

    await Promise.all([
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'name', name),
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarId', avatarId),
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarName', avatarName),
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarExt', avatarExt),
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', avatarPreview),
      runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'ftu', '1'),
    ]);

    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: name,
    }));
    const url = avatarUrl;
    userObject.avatar = {
      id: avatarId,
      name: avatarName,
      ext: avatarExt,
      preview: avatarPreview,
      url: avatarUrl,
    };
    this.dispatchEvent(new MessageEvent('avatarchange', {
      data: userObject.avatar,
    }));
  } */

  getInventory() {
    return userObject ? userObject.inventory : [];
  }

  async uploadFile(file) {
    const res = await fetch(storageHost, {
      method: 'POST',
      body: file,
    });
    const j = await res.json();
    j.name = file.name;
    return j;
  }

  async uploadAndMintFile(file, {description = ''} = {}) {
    if (loginToken) {
      const {name} = file;
      if (name) {
        const {mnemonic} = loginToken;
        const address = this.getAddress();

        let hash;
        let notification;
        try {
          notification = notifications.addNotification(`\
            <i class="icon fa fa-upload"></i>
            <div class=wrap>
              <div class=label>Uploading ${name}</div>
              <div class=text>Hold tight...</div>
              <div class=close-button>✕</div>
            </div>
          `, {
            timeout: Infinity,
          });
          notification.querySelector('.close-button').addEventListener('click', e => {
            notifications.removeNotification(notification);
          });

          const res = await fetch(storageHost, {
            method: 'POST',
            body: file,
          });
          const j = await res.json();
          hash = j.hash;
        } finally {
          notifications.removeNotification(notification);
        }
        const quantity = 1;
        const fullAmount = {
          t: 'uint256',
          v: new web3['mainnetsidechain'].utils.BN(1e9)
            .mul(new web3['mainnetsidechain'].utils.BN(1e9))
            .mul(new web3['mainnetsidechain'].utils.BN(1e9)),
        };

        let status, transactionHash, id;
        try {
          notification = notifications.addNotification(`\
            <i class="icon fa fa-layer-plus"></i>
            <div class=wrap>
              <div class=label>Minting ${name}</div>
              <div class=text>Almost there...</div>
              <div class=close-button>✕</div>
            </div>
          `, {
            timeout: Infinity,
          });
          notification.querySelector('.close-button').addEventListener('click', e => {
            notifications.removeNotification(notification);
          });
          {
            const result = await runSidechainTransaction(mnemonic)('FT', 'approve', contracts['mainnetsidechain']['NFT']._address, fullAmount.v);
            status = result.status;
            transactionHash = '0x0';
            id = -1;
          }
          if (status) {
            const extName = getExt(name);
            const fileName = extName ? name.slice(0, -(extName.length + 1)) : name;
            console.log('minting', ['NFT', 'mint', address, '0x' + hash, fileName, extName, description, quantity]);
            const result = await runSidechainTransaction(mnemonic)('NFT', 'mint', address, '0x' + hash, fileName, extName, description, quantity);
            status = result.status;
            transactionHash = result.transactionHash;
            id = new web3['mainnetsidechain'].utils.BN(result.logs[0].topics[3].slice(2), 16).toNumber();
          }
        } catch (err) {
          const errorNotification = notifications.addNotification(`\
            <i class="icon fa fa-exclamation-triangle"></i>
            <div class=wrap>
              <div class=label>Minting failed</div>
              <div class=text>${err + ''}</div>
              <div class=close-button>✕</div>
            </div>
          `/* , {
            timeout: Infinity,
          } */);
          errorNotification.querySelector('.close-button').addEventListener('click', e => {
            notifications.removeNotification(errorNotification);
          });
        } finally {
          notifications.removeNotification(notification);
        }
        return {
          name,
          hash,
          id,
        };
      } else {
        throw new Error('file has no name');
      }
    } else {
      throw new Error('not logged in');
    }
  }

  /* async sendFt(address, amount) {
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
  } */

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
