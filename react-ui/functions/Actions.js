import bip39 from '../libs/bip39.js';
import { web3, getAddressFromMnemonic, runSidechainTransaction } from '../webaverse/blockchain.js';
import { loginEndpoint, previewExt, previewHost, storageHost } from '../webaverse/constants.js';
import storage from '../webaverse/storage.js';
import { getExt } from '../webaverse/util.js';


export const initializeEtherium = async (state) => {
  let networkType;
  if (!window.ethereum)
    return networkType = null;
  await window.ethereum.enable();

  networkType = await web3['main'].eth.net.getNetworkType();
  mainnetAddress = web3['main'].currentProvider.selectedAddress;
  return { ...state, mainnetAddress, networkType };
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


export const setUsername = async (name, state) => {
  console.warn("Setting username in user object, but not to server");
  return { ...state, name };
};

export const getAddress = (state) => {
  if (!state.loginToken.mnemonic)
    return null;
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(state.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  return { ...state, address };
};

export const setAvatar = async (id, state) => {
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

export const getInventoryForSelf = async (state) => {
  if (!state.loginToken) return [];

  // Use cached page
  if(state.inventory[page] !== undefined) return state;

  const address = getAddress();
  const res = await fetch(`https://tokens.webaverse.com/${address}?page=`);
  const inventory = await res.json();
  return { ...state, inventory };
};

export const getInventoryForCreator = async (creatorAddress, page, state) => {
  // Use cached page
  if(state.creatorInventories[creatorAddress] !== undefined &&
    state.creatorInventories[creatorAddress][page])
    {
      return state;
    }

  const res = await fetch(`https://tokens.webaverse.com/${creatorAddress}?page=`);
  const creatorInventory = await res.json();
  const newState = {...state}
  if(newState.creatorInventories[creatorAddress] === undefined){
    newState.creatorInventories[creatorAddress] = {}
  }
  if(newState.creatorInventories[creatorAddress][page] === undefined){
    newState.creatorInventories[creatorAddress][page] = creatorInventory;
  }

  return newState;
};

export const uploadFile = async (file, state) => {
  if (!state.loginToken) throw new Error('not logged in');
  if (!file.name) throw new Error('file has no name');

  const { mnemonic, addr } = state.loginToken;
  const res = await fetch(storageHost, { method: 'POST', body: file });
  const { hash } = await res.json();
  const contractSource = await getContractSource('mintNft.cdc');

  const response = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: addr,
      mnemonic,
      limit: 100,
      transaction: contractSource
        .replace(/ARG0/g, hash)
        .replace(/ARG1/g, file.name),
      wait: true,
    }),
  });

  const responseJson = await response.json();
  if (responseJson?.transaction?.events[0]) {
    const id = parseInt(responseJson.transaction.events[0].payload.value.fields.find(field => field.name === 'id').value.value, 10);
  } else console.warn("sendTransaction post request was not successful");
  return { ...state, lastFileHash: hash, lastFileId: id };
};

export const sendNft = async (address, id, state) => {
  if (!state.loginToken)
    throw new Error('not logged in');
  const { mnemonic, addr } = state.loginToken;
  const contractSource = await getContractSource('transferNft.cdc');

  await fetch(`https://accounts.exokit.org/sendTransaction`, {
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
};

export const destroyNft = async (id, state) => {
  if (!state.loginToken)
    throw new Error('not logged in');
  const { mnemonic, addr } = state.loginToken;
  const contractSource = await getContractSource('destroyNft.cdc');

  await fetch(`https://accounts.exokit.org/sendTransaction`, {
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
};

export const pullUserObject = async (state) => {
  const address = getAddressFromMnemonic(state.loginToken.mnemonic);
  console.log("Address is", address);
  const res = await fetch(`https://accounts.webaverse.com/${address}`);
  const result = await res.json();
  console.log("result is, ", result);
  return {
    ...state,
    address,
    ...result
  };
};

export const requestTokenByEmail = async (email) => {
  await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}`, {
    method: 'POST',
  });
  alert(`Code sent to ${loginEmail.value}!`);
  return state;
};


export const loginWithEmailCode = async (email, code, state) => {
  const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
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
    return await setNewLoginToken(mnemonic);
  } else {
    // Email
    requestTokenByEmail(email);
    return state;
  }
};

export const setNewLoginToken = async (newLoginToken, state) => {
  await storage.set('loginToken', newLoginToken);

  return await pullUserObject({ ...state, loginToken: newLoginToken });
};

export const copyAddress = async (state) => {
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(state.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  navigator.clipboard.writeText(address);
  console.log("Copied address to clipboard", address);
  return state;
};


export const copyPrivateKey = async (state) => {
  navigator.clipboard.writeText(state.loginToken.mnemonic);
  console.log("Copied private key to clipboard", state.loginToken.mnemonic);
  return state;
};

export const logout = async (state) => {
  await storage.remove('loginToken');
  return await initialize(state);
};

export const initialize = async (state) => {
  state.loginToken = await storage.get('loginToken');
  const newState = await pullUserObject(state);

  await initializeEtherium(state);

  if (state.loginToken) {
    if (newState.loginToken.unregistered) {
      console.warn("Login token is unregistered");
    }
    return newState;
  } else {
    const mnemonic = bip39.generateMnemonic();

    await storage.set('loginToken', { mnemonic, unregistered: true });

    return {
      ...newState,
      loginToken: newLoginToken
    };
  }
};
