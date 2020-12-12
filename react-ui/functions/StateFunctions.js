import { getAddressFromMnemonic, contracts, runSidechainTransaction, web3 } from '../webaverse/blockchain.js';
import storage from '../webaverse/storage.js';
import bip39 from '../libs/bip39.js';
import hdkeySpec from '../libs/hdkey.js';
import { storageHost, previewHost, previewExt } from '../webaverse/constants.js';
import {getExt} from '../webaverse/util.js';

const hdkey = hdkeySpec.default;

export const connectMetamask = async (state) => {
  if (!window.ethereum){
    console.log("Window.ethereum is null");
    return state;
  }
  await window.ethereum.enable();
  const address = web3['main'].currentProvider.selectedAddress;
  const ftBalance = await contracts['main'].FT.methods.balanceOf(address).call()
  const res = await fetch(`https://tokens-main.webaverse.com/${address}`);
  const tokens = await res.json();

  const newState = {
    mainnetAddress: address,
    mainnetFtBalance: ftBalance,
    mainnetInventory: tokens
  }

  return { ...state, ...newState }
};

export const disconnectMetamask = async (state) => {
  const newState = {
    mainnetAddress: address,
    mainnetFtBalance: ftBalance,
    mainnetInventory: tokens
  }
  return {...state, ...newState};
};

export const checkMainFtApproved = async (amt) => {
  const receipt0 = await contracts.main.FT.methods.allowance(mainnetAddress, contracts.main.FTProxy._address).call();

  if (receipt0 >= amt)
    return null;
  window.alert('First you have to approve the FT contract to handle funds. This will only happen once.');

  const fullAmount = {
    t: 'uint256',
    v: new web3['main'].utils.BN(1e9)
      .mul(new web3['main'].utils.BN(1e9))
      .mul(new web3['main'].utils.BN(1e9)),
  };
  const receipt1 = await contracts.main.FT.methods.approve(contracts.main.FTProxy._address, fullAmount.v).send({
    from: mainnetAddress,
  });
  return receipt1;
};

export const checkMainNftApproved = async () => {
  const approved = await contracts.main.NFT.methods.isApprovedForAll(mainnetAddress, contracts.main.NFTProxy._address).call();

  if (approved)
    return null;
  window.alert('First you have to approve the NFT contract to handle tokens. This will only happen once.');

  const receipt1 = await contracts.main.NFT.methods.setApprovalForAll(contracts.main.NFTProxy._address, true).send({
    from: mainnetAddress,
  });
  return receipt1;

};

export const setName = async (name, state) => {
  console.warn("Setting username in user object, but not to server");
  await  runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', state.address, 'name', name);
  return { ...state, name };
};

export const getAddress = (state) => {
  if (!state.loginToken.mnemonic) return state;
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(state.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  
  return { ...state, address };
};

export const setAvatar = async (id, state) => {
  if (!state.loginToken)  throw new Error('not logged in');
  const res = await fetch(`https://tokens.webaverse.com/${id}`);
  const token = await res.json();
  const { filename, hash } = token.properties;
  const url = `${storageHost}/${hash.slice(2)}`;
  const ext = getExt(filename);
  const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
  const address = state.address;
  await Promise.all([
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', url),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', filename),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', preview),
  ]);
  return { ...state, avatarUrl: url, avatarFileName: filename, avatarPreview: preview };
};

export const setHomespace = async (id, state) => {
  if (!state.loginToken)
    throw new Error('not logged in');
  const res = await fetch(`https://tokens.webaverse.com/${id}`);
  const token = await res.json();
  const { filename, hash } = token.properties;
  const url = `${storageHost}/${hash.slice(2)}`;
  const ext = getExt(filename);
  const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
  const address = state.getAddress();
  await Promise.all([
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespaceUrl', url),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespaceFileName', filename),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespacePreview', preview),
  ]);
  return { ...state, avatarUrl: url, avatarFileName: filename, avatarPreview: preview };
};

export const setLoadoutState = async (id, isInLoadout, state) => {
  if (!state.loginToken)
    throw new Error('not logged in');
  const res = await fetch(`https://tokens.webaverse.com/${id}`);
  const token = await res.json();
  const { filename, hash } = token.properties;
  const url = `${storageHost}/${hash.slice(2)}`;
  const ext = getExt(filename);
  const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
  const address = state.getAddress();
  await runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'isInLoadout', isInLoadout);
  return { ...state, avatarUrl: url, avatarFileName: filename, avatarPreview: preview };
};

export const setFtu = async (name, avatarUrl, state) => {
  const address = state.getAddress();
  const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

  await Promise.all([
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'name', name),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', avatarUrl),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', avatarUrl),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', avatarPreview),
    runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'ftu', '1'),
  ]);
  return { ...state, avatarUrl: avatarUrl, avatarFileName: avatarUrl, avatarPreview: avatarPreview };
};

export const clearInventroryForCreator = async (creatorAddress, state) => {
  let newState = {...state}
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

export const getProfileForCreator = async (creatorAddress, state) => {
  // Use cached page
  if (state.creatorProfiles[creatorAddress] !== undefined)
    return state;

  const res = await fetch(`https://accounts.webaverse.com/${creatorAddress}`);
  const creatorProfile = await res.json();
  let newState = { ...state };
  newState.creatorProfiles[creatorAddress] = creatorProfile;
  return await getInventoryForCreator(creatorAddress, 1, false, newState);
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


