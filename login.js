import storage from './storage.js';

const loginEndpoint = 'https://login.exokit.org';

let loginToken = null;
async function doLogin(email, code) {
  const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });
  if (res.status >= 200 && res.status < 300) {
    const newLoginToken = await res.json();

    await storage.set('loginToken', newLoginToken);

    loginToken = newLoginToken;

    const loginForm = document.getElementById('login-form');
    const loginEmailStatic = document.getElementById('login-email-static');
    loginEmailStatic.innerText = loginToken.email;
    /* loginNameStatic.innerText = loginToken.name;
    loginEmailStatic.innerText = loginToken.email;
    if (loginToken.stripeConnectState) {
      statusConnected.classList.add('open');
      statusNotConnected.classList.remove('open');
      connectStripeButton.classList.remove('visible');
    } else {
      statusNotConnected.classList.add('open');
      statusConnected.classList.remove('open');
      connectStripeButton.classList.add('visible');
    } */

    document.body.classList.add('logged-in');
    loginForm.classList.remove('phase-1');
    loginForm.classList.remove('phase-2');
    loginForm.classList.add('phase-3');

    return true;
  } else {
    return false;
  }
}
async function tryLogin() {
  const localLoginToken = await storage.get('loginToken');
  if (localLoginToken) {
    const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(localLoginToken.email)}&token=${encodeURIComponent(localLoginToken.token)}`, {
      method: 'POST',
    });
    if (res.status >= 200 && res.status < 300) {
      loginToken = await res.json();

      await storage.set('loginToken', loginToken);

      /* loginNameStatic.innerText = loginToken.name;
      loginEmailStatic.innerText = loginToken.email;
      if (loginToken.stripeConnectState) {
        statusConnected.classList.add('open');
        statusNotConnected.classList.remove('open');
        connectStripeButton.classList.remove('visible');
      } else {
        statusNotConnected.classList.add('open');
        statusConnected.classList.remove('open');
        connectStripeButton.classList.add('visible');
      } */
    } else {
      await storage.remove('loginToken');

      console.warn(`invalid status code: ${res.status}`);
    }
  }

  const header = document.getElementById('header');
  const loginForm = document.getElementById('login-form');
  loginForm.classList.add('login-form');
  loginForm.innerHTML = `
    <div class=phase-content>
      <div class=login-notice id=login-notice></div>
      <div class=login-error id=login-error></div>
    </div>
    <div class="phase-content phase-1-content">
      <input type=email placeholder="your@email.com" id=login-email>
      <input type=submit value="Log in" class="button highlight">
    </div>
    <div class="phase-content phase-2-content">
      <input type=text placeholder="Verification code" id=login-verification-code>
      <input type=submit value="Verify" class="button highlight">
    </div>
    <div class="phase-content phase-3-content">
      <nav class=user-button id=user-button>
        <img src="favicon.ico">
        <span class=name id=login-email-static></span>
        <input type=submit value="Log out" class="button highlight">
      </nav>
    </div>
    <div class="phase-content phaseless-content">
      <div>Working...</div>
    </div>
  `;

  const loginEmail = document.getElementById('login-email');
  const loginVerificationCode = document.getElementById('login-verification-code');
  const loginNotice = document.getElementById('login-notice');
  const loginError = document.getElementById('login-error');
  const loginEmailStatic = document.getElementById('login-email-static');
  if (loginToken) {
    loginEmailStatic.innerText = loginToken.email;
    
    document.body.classList.add('logged-in');
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

      const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(loginEmail.value)}`, {
        method: 'POST',
      })
      if (res.status >= 200 && res.status < 300) {
        loginNotice.innerText = `Code sent to ${loginEmail.value}!`;
        loginForm.classList.add('phase-2');

        return res.blob();
      } else {
        throw new Error(`invalid status code: ${res.status}`);
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

export {
  doLogin,
  tryLogin,
};