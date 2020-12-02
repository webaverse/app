import { ActionTypes } from "../constants/ActionTypes.js";
import bip39 from '../webaverse/bip39.js';
import { getAddressFromMnemonic, runSidechainTransaction } from '../webaverse/blockchain.js';
import { loginEndpoint, previewExt, previewHost, storageHost } from '../webaverse/constants.js';
import storage from '../webaverse/storage.js';
import { getExt } from '../webaverse/util.js';

const pullUserObject = async (state) => {
  const address = getAddressFromMnemonic(state.loginToken.mnemonic);
  const res = await fetch(`https://accounts.webaverse.com/${address}`);
  const result = await res.json();
  const { name, avatarUrl, avatarFileName, avatarPreview, ftu } = result;
  return {
    ...state,
    name,
    avatarUrl,
    avatarFileName,
    avatarPreview,
    ftu
  }
}

const requestTokenByEmail = async (email, state) => {
  console.warn("requestTokenByEmail: Not implemented yet");
  return state;
}


const loginWithEmail = async (email, code, state) => {
  const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });

  if (!(res.status >= 200 && res.status < 300)) return state;

  const newLoginToken = await res.json();

  await storage.set('loginToken', newLoginToken);

  const newState = await pullUserObject(state);

  return {
    ...newState,
    loginToken: newLoginToken
  }
}

const loginWithPrivateKey = async (privateKey, state) => {
  console.warn("loginWithPrivateKey: Not implemented yet");
  return state;
}


const initialize = async (state) => {
  state.loginToken = await storage.get('loginToken');
  if (state.loginToken) {
    const newState = await pullUserObject(state);
    if (newState.loginToken.unregistered) console.warn("Login token is unregistered");
    return newState;
  } else {
    const mnemonic = bip39.generateMnemonic();

    await storage.set('loginToken', { mnemonic, unregistered: true });

    const newState = await pullUserObject(state);

    return {
      ...newState,
      loginToken: newLoginToken
    }
  }
}

export const LoginReducer = async (state, action) => {
  switch (action.type) {
    case ActionTypes.InitializeUserObject:
      return await initialize(state);

    case ActionTypes.RequestEmailToken:
      return await requestTokenByEmail(action.payload.email, state);

    case ActionTypes.LoginWithEmail:
      return await loginWithEmail(action.payload.email, action.payload.code, state);

    case ActionTypes.ConnectPrivateKey:
      console.warn("Not set up yet");
      return await loginWithPrivateKey(action.payload.privateKey, state);

    default:
      console.warn("Invalid action sent to reducer");
      return state;
  }
};
