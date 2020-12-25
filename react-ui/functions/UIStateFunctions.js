import bip39 from '../libs/bip39.js';
import hdkeySpec from '../libs/hdkey.js';
import { getAddressFromMnemonic } from '../webaverse/blockchain.js';
import storage from '../webaverse/storage.js';

const hdkey = hdkeySpec.default;

export const getAddress = (state) => {
  if (!state.loginToken.mnemonic) return state;
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(state.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();

  return { ...state, address };
};

export const clearInventroryForCreator = async (creatorAddress, state) => {
  let newState = { ...state }
  // Use cached page
  newState.creatorProfiles[creatorAddress] = undefined;
  newState.creatorInventories[creatorAddress] = undefined;
  return newState;
};

export const getInventoryForCreator = async (creatorAddress, page, forceUpdate, state) => {
  // Use cached page
  if (forceUpdate !== true && state.creatorInventories[creatorAddress] !== undefined) {
    return state;
  }

  const res = await fetch(`https://tokens.webaverse.com/${creatorAddress}?page=`);
  const creatorInventory = await res.json();
  const newState = { ...state };
  if (newState.creatorInventories[creatorAddress] === undefined) {
    newState.creatorInventories[creatorAddress] = {};
  }
  if (newState.creatorInventories[creatorAddress][page] === undefined) {
    newState.creatorInventories[creatorAddress][page] = creatorInventory;
  }

  return newState;
};

export const getBoothForCreator = async (creatorAddress, page, forceUpdate, state) => {
  // Use cached page
  if (forceUpdate !== true && state.creatorBooths[creatorAddress] !== undefined) {
    return state;
  }

  const address = `https://store.webaverse.com/${creatorAddress}?page=`;
  console.log("Addres is", `https://store.webaverse.com/${creatorAddress}?page=`);
  const res = await fetch(address);
  const creatorBooth = await res.json();
  const entries = (creatorBooth[0] === undefined) ? [] : creatorBooth[0].entries;
  console.log("creatorBooth is", entries);
  const newState = { ...state };
  if (newState.creatorBooths[creatorAddress] === undefined) {
    newState.creatorBooths[creatorAddress] = {};
  }
    newState.creatorBooths[creatorAddress][page] = entries;

  return newState;
};

export const getProfileForCreator = async (creatorAddress, state) => {
  console.log("Getting profile for creator")
  // Use cached page
  if (state.creatorProfiles[creatorAddress] !== undefined &&
    state.creatorInventories[creatorAddress] !== undefined &&
    state.creatorBooths[creatorAddress] !== undefined)
    return state;

    console.log("Got this far")


  const res = await fetch(`https://accounts.webaverse.com/${creatorAddress}`);
  const creatorProfile = await res.json();
  let newState = { ...state };
  newState.creatorProfiles[creatorAddress] = creatorProfile;
  const nextState = await getBoothForCreator(creatorAddress, 1, false, newState);
  const lastState = await getInventoryForCreator(creatorAddress, 1, false, nextState);
  console.log("Last state is", lastState);
  return lastState;
};

export const getBooths = async (page, state) => {
  // Use cached page
  if (state.booths[page] !== undefined)
    return state;

  const res = await fetch(`https://store.webaverse.com`);
  const booths = await res.json();
  const newState = { ...state };
  newState.booths[page] = booths;
  return newState;
};

export const getCreators = async (page, state) => {
  // Use cached page
  if (state.creators[page] !== undefined)
    return state;

  const res = await fetch(`https://accounts.webaverse.com/`);
  const creators = await res.json();
  let newState = { ...state };
  newState.creators[page] = creators;
  return newState;
};


export const pullUserObject = async (state) => {

  const address = getAddressFromMnemonic(state.loginToken.mnemonic);
  const res = await fetch(`https://accounts.webaverse.com/${address}`);
  const result = await res.json();
  const newState = {
    ...state,
    address,
    ...result
  };
  return newState;
};

export const requestTokenByEmail = async (email, state) => {
  await fetch(`/gateway?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
  alert(`Code sent to ${email}!`);
  return state;
};

export const loginWithEmailCode = async (email, code, state) => {
  const res = await fetch(`/gateway?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
  });

  if (!res.ok) {
    console.warn("Email login failed");
    return state;
  }

  const newLoginToken = await res.json();
  setNewLoginToken(newLoginToken, state);
};

export const loginWithEmailOrPrivateKey = async (emailOrPrivateKey, state) => {
  const split = emailOrPrivateKey.split(/\s+/).filter(w => !!w);

  if (split.length === 12) {
    // Private key
    const mnemonic = split.slice(0, 12).join(' ');
    return await setNewLoginToken(mnemonic, state);
  } else {
    // Email
    return await requestTokenByEmail(emailOrPrivateKey);
  }
};

export const setNewLoginToken = async (newLoginToken, state) => {
  await storage.set('loginToken', newLoginToken);
  const newState = await pullUserObject({ ...state, loginToken: newLoginToken });
  return newState;

};

export const logout = async (state) => {
  await storage.remove('loginToken');
  return await initializeStart(state);
};

export const initializeStart = async (state) => {
  let loginToken = await storage.get('loginToken');
  if (!loginToken) {
    const mnemonic = await bip39.generateMnemonic();
    loginToken = {
      unregistered: true,
      mnemonic
    }
    await storage.set('loginToken', loginToken);
  }

  const newState = await pullUserObject({ ...state, loginToken });
  // newState = await initializeEthereum(newState);
  if (newState.loginToken.unregistered) console.warn("Login token is unregistered");
  return await getAddress(newState);
};


export const setMainnetAddress = async (mainnetAddress, state) => {
  return { ...state, mainnetAddress }
}