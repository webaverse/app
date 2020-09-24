import storage from './storage.js';
import {getContractSource, hexToWordList, wordListToHex} from './blockchain.js';
import {storageHost} from './constants.js'

const loginEndpoint = 'https://login.exokit.org';
// const usersEndpoint = 'https://users.exokit.org';

const _clone = o => JSON.parse(JSON.stringify(o));

let loginToken = null;
let userObject = null;
async function ensureUserObjectBaked() {
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
}
async function pullUserObject() {
  await ensureUserObjectBaked();
  
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
  const name = response.encodedData.value[0].value || 'Anonymous';
  const avatarHash = response.encodedData.value[1].value;
  userObject = {
    name,
    avatarHash,
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
  // const avatarName = document.getElementById('avatar-name');
  userName.innerText = userObject.name;
  // avatarName.innerText = userObject.avatarHash !== null ? userObject.avatarHash : 'None';

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
      <input type=text placeholder="your@email.com" id=login-email>
      <input type=submit value="Log in" class="button highlight">
    </div>
    <div class="phase-content phase-2-content">
      <input type=text placeholder="Verification code" id=login-verification-code>
      <input type=submit value="Verify" class="button highlight">
    </div>
    <div class="phase-content phase-3-content">
      <nav class=user-button id=user-button>
        <img src="favicon.ico">
        <span class=name id=user-name></span>
        <nav class=button id=clipboard-button>
          <i class="fal fa-clipboard"></i>
        </nav>
        <input type=submit value="Log out" class="button highlight">
      </nav>
    </div>
    <div class="phase-content phaseless-content">
      <div>Working...</div>
    </div>
  `;

  /* document.getElementById('userAvatarInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", async () => {      
      const response = await fetch(storageHost, {
        method: "POST",
        body: reader.result
      })
      if (response.ok) {
        const json = await response.json();
        loginManager.setAvatar(json.hash);
      } else {
        console.error('Failed to upload new Avatar.', response);
      }

    });
    if (file) {
      reader.readAsArrayBuffer(file);
    }
  }); */

  /* document.getElementById('unloadAvatar').addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    loginManager.setAvatar(null);
  }); */

  document.getElementById('clipboard-button').addEventListener('click', e => {
    navigator.clipboard.writeText(loginToken.mnemonic + ' ' + hexToWordList(loginToken.addr));
  });

  const userButton = document.getElementById('user-button');
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
  } else {
    loginForm.classList.add('phase-1');
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
      await pushUserObject();
      updateUserObject();
    }
    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: name,
    }));
  }
  
  getAddress() {
    return loginToken && loginToken.address;
  }
  getMnemonic() {
    return loginToken && loginToken.mnemonic;
  }

  getAvatar() {
    return userObject && userObject.avatarHash;
  }

  async setAvatar(avatarHash) {
    if (userObject) {
      userObject.avatarHash = avatarHash;
      await pushUserObject();
      // updateUserObject();
    }
    this.dispatchEvent(new MessageEvent('avatarchange', {
      data: avatarHash,
    }));
  }

  getInventory() {
    return userObject ? _clone(userObject.inventory) : [];
  }

  async setInventory(inventory) {
    if (userObject) {
      userObject.inventory = inventory;
      await pushUserObject();
      // updateUserObject();
    }
    this.dispatchEvent(new MessageEvent('inventorychange', {
      data: _clone(inventory),
    }));
  }

  pushUpdate() {
    this.dispatchEvent(new MessageEvent('usernamechange', {
      data: userObject && userObject.name,
    }));
    this.dispatchEvent(new MessageEvent('avatarchange', {
      data: userObject && userObject.avatarHash,
    }));
  }
}
const loginManager = new LoginManager();

export {
  doLogin,
  tryLogin,
  loginManager,
};
