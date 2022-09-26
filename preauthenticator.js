import * as preauthenticator from 'https://preauthenticator.webaverse.online/preauthenticator.js';

let port = null;
const loadPromise = (async () => {
  port = await preauthenticator.connect();
})();

const o = {
  async callAuthenticatedApi() {
    await loadPromise;

    return port.callAuthenticatedApi.apply(port, arguments);
  },
  async setAuthenticatedApi() {
    await loadPromise;

    return port.setAuthenticatedApi.apply(port, arguments);
  },
  async getAuthenticatedApi() {
    await loadPromise;

    return port.getAuthenticatedApi.apply(port, arguments);
  },
  async hasAuthenticatedApi() {
    await loadPromise;

    return port.hasAuthenticatedApi.apply(port, arguments);
  },
  async deleteAuthenticatedApi() {
    await loadPromise;

    return port.deleteAuthenticatedApi.apply(port, arguments);
  },
  /* waitForLoad() {
    return loadPromise;
  }, */
};
export default o;
