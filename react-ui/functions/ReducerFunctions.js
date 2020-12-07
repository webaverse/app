import storage from '../webaverse/storage.js';
import { getAddressFromMnemonic } from '../webaverse/blockchain.js';


export const initializeEthereum = async (state) => {
  if (!window.ethereum)
    return { ...state, networkType: null };
  await window.ethereum.enable();

  let networkType = await web3['main'].eth.net.getNetworkType();
  mainnetAddress = web3['main'].currentProvider?.selectedAddress;
  return mainnetAddress ? { ...state, mainnetAddress, networkType } : state;
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

export const setUsername = (name, state) => {
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

export const getInventoryForCreator = async (creatorAddress, page, state) => {
  // Use cached page
  if (state.creatorInventories[creatorAddress] !== undefined &&
    state.creatorInventories[creatorAddress][page]) {
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
  return await getInventoryForCreator(creatorAddress, 1, newState);
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
  if (state.creators[page] !== undefined) return state;

  const res = await fetch(`https://accounts.webaverse.com/`);
  const creators = await res.json();
  let newState = { ...state };
  newState.creators[page] = creators;
  return newState;
};

export const uploadFile = async (file, state) => {
  if (!state.loginToken)
    throw new Error('not logged in');
  if (!file.name)
    throw new Error('file has no name');

  const { mnemonic, addr } = state.loginToken;
  const res = await fetch(storageHost, { method: 'POST', body: file });
  const { hash } = await res.json();

  const fullAmount = {
    t: 'uint256',
    v: new web3.utils.BN(1e9)
      .mul(new web3.utils.BN(1e9))
      .mul(new web3.utils.BN(1e9)),
  };

  let status, transactionHash, tokenIds;
  try {
    {
      const result = await runSidechainTransaction(mnemonic)('FT', 'approve', contracts['NFT']._address, fullAmount.v);
      status = result.status;
      transactionHash = '0x0';
      tokenIds = [];
    }
    if (status) {
      const description = '';
      // console.log('minting', ['NFT', 'mint', addr, '0x' + hash, file.name, description, quantity]);
      const result = await runSidechainTransaction(mnemonic)('NFT', 'mint', addr, '0x' + hash, file.name, description, quantity);
      status = result.status;
      transactionHash = result.transactionHash;
      const tokenId = new web3.utils.BN(result.logs[0].topics[3].slice(2), 16).toNumber();
      tokenIds = [tokenId, tokenId + quantity - 1];
    }
  } catch (err) {
    console.warn(err.stack);
    status = false;
    transactionHash = '0x0';
    tokenIds = [];
  }

  return { tokenIds };
};

export const pullUserObject = async (state) => {
  console.log("Pulling user object");
  const address = getAddressFromMnemonic(state.loginToken.mnemonic);
  const res = await fetch(`https://accounts.webaverse.com/${address}`);
  const result = await res.json();
  const newState = {
    ...state,
    address,
    ...result
  };
  console.log("New state is: ", newState);
  return newState;
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
  console.log("Setting new login token");
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
  return await initializeStart(state);
};

export const initializeStart = async (state) => {
  let loginToken = await storage.get('loginToken');

  if (!loginToken) {
    console.log("Generating login token");
    loginToken = bip39.generateMnemonic();
    await storage.set('loginToken', { mnemonic: loginToken, unregistered: true });
  }

  const newState = await pullUserObject({ ...state, loginToken });
  // newState = await initializeEthereum(newState);
  if (newState.loginToken.unregistered)
    console.warn("Login token is unregistered");
  return newState;
};

