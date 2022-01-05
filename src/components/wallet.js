/* eslint-disable no-async-promise-executor */
/* eslint-disable no-new */
/* eslint-disable prefer-promise-reject-errors */
import {walletHost} from '../../constants';

let pk = '';

class Wallet {
  async launch() {
    const self = this;
    let pubk = '';

    await new Promise(async (resolve, reject) => {
      const iframe = document.querySelector(`iframe[src^="${walletHost}"]`);
      // else create new iframe
      if (!iframe) {
        self.iframe = document.createElement('iframe');
        self.iframe.width = '0px';
        self.iframe.height = '0px';
        document.body.appendChild(self.iframe);
        self.iframe.src = walletHost;

        const fs = window.crypto.subtle.generateKey.toString();
        const ms = 'function generateKey() { [native code] }';

        if (fs === ms) {
          const {publicKey, privateKey} = await window.crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-384'}, false, ['sign', 'verify']);
          pk = privateKey; pubk = publicKey;
        } else {
          /** Empty reject halts the execution without stacktrace */
          new Promise((resolve, reject) => { reject(); });
        }
        Object.freeze(self);
      } else {
        return resolve();
      }
      const t = setTimeout(() => {
        reject(new Error('Failed to load wallet in 30 seconds'));
      }, 30 * 1000);

      const f = event => {
        if (`${event.origin}` !== walletHost) { return; }
        if (event.data.method === 'wallet_launched') {
          self.iframe.contentWindow.postMessage({action: 'register', key: pubk}, walletHost);
        } else if (event.data.method === 'wallet_registered') {
          window.removeEventListener('message', f, false);
          clearTimeout(t);
          resolve();
        }
      };
      window.addEventListener('message', f);
    });
  }

  async walletPromise(action, data, waitForAction, timeOutPromise) {
    const self = this;

    const m = await this.sign({
      ...data,
      ...{
        action: action,
      },
    });

    return new Promise((resolve, reject) => {
      self.iframe.contentWindow.postMessage({
        action: 'signed_message',
        message: m,
      }, walletHost);

      const f = event => {
        if (`${event.origin}` !== walletHost) { return; }
        if (event.data.method === waitForAction) {
          window.removeEventListener('message', f, false);
          resolve(event.data.data);
        }
      };
      window.addEventListener('message', f);
    });
  }

  async sign(message) {
    const ms = 'function sign() { [native code] }';
    const fs = window.crypto.subtle.sign.toString();
    const encoded = new TextEncoder().encode(JSON.stringify(message));
    let signature;
    if (fs === ms) {
      signature = await window.crypto.subtle.sign({name: 'ECDSA', hash: {name: 'SHA-384'}}, pk, encoded);
    } else {
      /** Empty reject halts the execution without stacktrace */
      new Promise((resolve, reject) => { reject(); });
    }
    return {encoded, signature};
  }

  async autoLogin() {
    return this.walletPromise('getUserData', {}, 'wallet_userdata', false);
  }

  async loginDiscord(code, id) {
    return this.walletPromise('doLoginViaDiscord', {
      code,
      id,
    }, 'wallet_userdata', false);
  }

  async logout() {
    return this.walletPromise('logout', {
    }, 'logout', false);
  }
}

const WebaWallet = new Wallet();
window.WebaWallet = WebaWallet;

export default WebaWallet;
