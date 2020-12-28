import { contracts, runSidechainTransaction, web3 } from '../webaverse/blockchain.js';
import { previewExt, previewHost, storageHost } from '../webaverse/constants.js';
import { getExt } from '../webaverse/util.js';
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
  newState.creatorProfiles[creatorAddress] = [];
  newState.creatorInventories[creatorAddress] = [];
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

export const getProfileForCreator = async (creatorAddress, successCallback, errorCallback, state) => {
  console.log("Getting profile for creator", creatorAddress);
  // Use cached page
  if (state.creatorProfiles[creatorAddress] !== undefined &&
    state.creatorInventories[creatorAddress] !== undefined &&
    state.creatorInventories[creatorAddress][0] !== undefined &&
    state.creatorBooths[creatorAddress] !== undefined)
    return state;

    try{
      const res = await fetch(`https://accounts.webaverse.com/${creatorAddress}`);
      const creatorProfile = await res.json();
      let newState = { ...state };
      newState.creatorProfiles[creatorAddress] = creatorProfile;
      // TODO: Parralelize this? Maybe dispatch separate actions?
      const boothState = await getBoothForCreator(creatorAddress, 1, false, newState);
      const inventoryState = await getInventoryForCreator(creatorAddress, 1, false, boothState);
      const loadoutState = await getLoadout(creatorAddress, inventoryState);
      if(successCallback) errorCallback(error);
      return loadoutState;
    } catch (error){
      if(errorCallback) errorCallback(error);
      return state;
    }
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
export const setName = async (name, state, successCallback, errorCallback) => {
  console.warn("Setting username in user object, but not to server");
  try {
    await runSidechainTransaction(state.loginToken.mnemonic)(
        "Account",
        "setMetadata",
        state.address,
        "name",
        name
        );
        if(successCallback) successCallback();
    } catch(error) {
        if(errorCallback) errorCallback();
    }
};

export const setFtu = async (name, avatarUrl, state) => {
  const address = state.getAddress();
  const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

  await Promise.all([
    runSidechainTransaction(state.loginToken.mnemonic)(
      "Account",
      "setMetadata",
      address,
      "name",
      name
    ),
    runSidechainTransaction(state.loginToken.mnemonic)(
      "Account",
      "setMetadata",
      address,
      "avatarUrl",
      avatarUrl
    ),
    runSidechainTransaction(state.loginToken.mnemonic)(
      "Account",
      "setMetadata",
      address,
      "avatarFileName",
      avatarUrl
    ),
    runSidechainTransaction(state.loginToken.mnemonic)(
      "Account",
      "setMetadata",
      address,
      "avatarPreview",
      avatarPreview
    ),
    runSidechainTransaction(state.loginToken.mnemonic)(
      "Account",
      "setMetadata",
      address,
      "ftu",
      "1"
    ),
  ]);
  return {
    ...state,
    avatarUrl: avatarUrl,
    avatarFileName: avatarUrl,
    avatarPreview: avatarPreview,
  };
};

export const connectMetamask = async (state) => {
  if (!window.ethereum) {
    console.log("Window.ethereum is null");
    return state;
  }
  await window.ethereum.enable();
  const address = web3["main"].currentProvider.selectedAddress;
  const ftBalance = await contracts["main"].FT.methods
    .balanceOf(address)
    .call();
  const res = await fetch(`https://tokens-main.webaverse.com/${address}`);
  const tokens = await res.json();

  const newState = {
    mainnetAddress: address,
    mainnetFtBalance: ftBalance,
    mainnetInventory: tokens,
  };

  return { ...state, ...newState };
};

export const disconnectMetamask = async (state) => {
  const newState = {
    mainnetAddress: address,
    mainnetFtBalance: ftBalance,
    mainnetInventory: tokens,
  };

  return { ...state, ...newState };
};

export const checkMainFtApproved = async (amt) => {
  const receipt0 = await contracts.main.FT.methods
    .allowance(mainnetAddress, contracts.main.FTProxy._address)
    .call();

  if (receipt0 >= amt) return null;
  window.alert(
    "First you have to approve the FT contract to handle funds. This will only happen once."
  );

  const fullAmount = {
    t: "uint256",
    v: new web3["main"].utils.BN(1e9)
      .mul(new web3["main"].utils.BN(1e9))
      .mul(new web3["main"].utils.BN(1e9)),
  };
  const receipt1 = await contracts.main.FT.methods
    .approve(contracts.main.FTProxy._address, fullAmount.v)
    .send({
      from: mainnetAddress,
    });
  return receipt1;
};

export const checkMainNftApproved = async () => {
  const approved = await contracts.main.NFT.methods
    .isApprovedForAll(mainnetAddress, contracts.main.NFTProxy._address)
    .call();

  if (approved) return null;
  window.alert(
    "First you have to approve the NFT contract to handle tokens. This will only happen once."
  );

  const receipt1 = await contracts.main.NFT.methods
    .setApprovalForAll(contracts.main.NFTProxy._address, true)
    .send({
      from: mainnetAddress,
    });
  return receipt1;
};


export const buyAsset = async (id, networkType, mnemonic, successCallback, errorCallback) => {
  try {
    const network = networkType.toLowerCase() === 'mainnet' ? 'mainnet' : 'sidechain';
    await runSidechainTransaction(mnemonic)('NFT', 'setApprovalForAll', contracts[network]['Trade']._address, true);

    const result = await runSidechainTransaction(mnemonic)('Trade', 'buy', id);
    if(result) console.log("Result of buy transaction:", result);

    if (successCallback)
      successCallback(result);
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const sellAsset = async (id, price, networkType, mnemonic, successCallback, errorCallback) => {
  console.log("Selling asset, price is", price);
  try {
    const network = networkType.toLowerCase() === 'mainnet' ? 'mainnet' : 'sidechain';

    await runSidechainTransaction(mnemonic)('NFT', 'setApprovalForAll', contracts[network]['Trade']._address, true);
    const result = await runSidechainTransaction(mnemonic)('Trade', 'addStore', id, price);
    if(result) console.log("Result of buy transaction:", result);

    if (successCallback)
      successCallback(result);
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const cancelSale = async (id, networkType, successCallback, errorCallback) => {
  try {
    const network = networkType.toLowerCase() === 'mainnet' ? 'mainnet' : 'sidechain';
    await runSidechainTransaction(mnemonic)('NFT', 'setApprovalForAll', contracts[network]['Trade']._address, true);

    await runSidechainTransaction(mnemonic)('Trade', 'removeStore', id);

    console.log("No buy asset logic");
    if (successCallback)
      successCallback();
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const setAvatar = async (id, successCallback, errorCallback) => {
  try {
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
    if (successCallback)
      successCallback();
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const mintNft = async (file, name, description, quantity, successCallback, errorCallback, state) => {
  const { mnemonic } = state.loginToken;
  const address = state.address;
  const res = await fetch(storageHost, { method: 'POST', body: file });
  const { hash } = await res.json();

  let status, transactionHash, tokenIds;

  try {

    const fullAmount = {
      t: 'uint256',
      v: new web3['sidechain'].utils.BN(1e9)
        .mul(new web3['sidechain'].utils.BN(1e9))
        .mul(new web3['sidechain'].utils.BN(1e9)),
    };

    const result = await runSidechainTransaction(mnemonic)('FT', 'approve', contracts['sidechain']['NFT']._address, fullAmount.v);
    status = result.status;
    transactionHash = '0x0';
    tokenIds = [];

    console.log("File is", file);
    console.log("Description is", description);

    if (status) {
      console.log("Status is", status)
      const result = await runSidechainTransaction(mnemonic)('NFT', 'mint', address, '0x' + hash, file.name, description, quantity);
      console.log("Result is ", result.json());
      status = result.status;
      transactionHash = result.transactionHash;
      const tokenId = new web3['sidechain'].utils.BN(result.logs[0].topics[3].slice(2), 16).toNumber();
      tokenIds = [tokenId, tokenId + quantity - 1];
      console.log("Token id is", tokenId);
      successCallback();
    }
  } catch (err) {
    console.warn(err);
    status = false;
    transactionHash = '0x0';
    tokenIds = [];
    errorCallback(err);
  }
};

export const setHomespace = async (id, successCallback, errorCallback) => {
  try {
    const res = await fetch(`https://tokens.webaverse.com/${id}`);
    const token = await res.json();
    const { filename, hash } = token.properties;
    const url = `${storageHost}/${hash.slice(2)}`;
    const ext = getExt(filename);
    const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
    const address = state.address;
    await Promise.all([
      runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespaceUrl', url),
      runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespaceFileName', filename),
      runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', address, 'homespacePreview', preview),
    ]);
    if (successCallback !== undefined)
      successCallback();
  } catch (err) {
    console.log("ERROR: ", err);
    if (errorCallback !== undefined)
      errorCallback();
  }
};

export const depositAsset = async (tokenId, networkType, mainnetAddress) => {
  // Deposit to mainnet
  if (networkType === 'webaverse') {
    const id = parseInt(tokenId, 10);
    if (!isNaN(id)) {
      const tokenId = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(id),
      };

      const hashSpec = await contracts.sidechain.NFT.methods.getHash(tokenId.v).call();
      const hash = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(hashSpec),
      };
      const filenameSpec = await contracts.sidechain.NFT.methods.getMetadata(hashSpec, 'filename').call();
      const filename = {
        t: 'string',
        v: filenameSpec,
      };
      console.log('got filename hash', hash, filename);

      await runSidechainTransaction(state.loginToken.mnemonic)('NFT', 'setApprovalForAll', contracts['sidechain'].NFTProxy._address, true);

      const receipt = await runSidechainTransaction(state.loginToken.mnemonic)('NFTProxy', 'deposit', mainnetAddress, tokenId.v);

      const signature = await getTransactionSignature('sidechain', 'NFT', receipt.transactionHash);
      const timestamp = {
        t: 'uint256',
        v: signature.timestamp,
      };
      const { r, s, v } = signature;

      await contracts.main.NFTProxy.methods.withdraw(mainnetAddress, tokenId.v, hash.v, filename.v, timestamp.v, r, s, v).send({
        from: mainnetAddress,
      });

      console.log('OK');
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
  }
  else {
    const id = parseInt(tokenId, 10);
    const tokenId = {
      t: 'uint256',
      v: new web3['main'].utils.BN(id),
    };

    const hashSpec = await contracts.main.NFT.methods.getHash(tokenId.v).call();
    const hash = {
      t: 'uint256',
      v: new web3['main'].utils.BN(hashSpec),
    };
    const filenameSpec = await contracts.main.NFT.methods.getMetadata(hashSpec, 'filename').call();
    const filename = {
      t: 'string',
      v: filenameSpec,
    };

    await _checkMainNftApproved();

    const receipt = await contracts.main.NFTProxy.methods.deposit(myAddress, tokenId.v).send({
      from: mainnetAddress,
    });

    const signature = await getTransactionSignature('main', 'NFT', receipt.transactionHash);

    const { timestamp, r, s, v } = signature;

    await runSidechainTransaction('NFTProxy', 'withdraw', myAddress, tokenId.v, hash.v, filename.v, timestamp, r, s, v);

  }
}

export const getLoadout = async (creatorAddress, state) => {
  
  const loadoutString = await contracts.sidechain.Account.methods.getMetadata(creatorAddress, 'loadout').call();
  console.log("********** LOADOUT IS")
  console.log(loadoutString)

  let loadout;

  if(loadoutString === "" || loadoutString === null ){
    loadout = []
  }
  else {
    const returnedLoadout = JSON.parse(loadoutString);
    loadout = []

    // iterate through loadout
    // for each, set card id, card name, cart type and preview image
    returnedLoadout.forEach(loadoutItem => {
      if(loadoutItem === null) return;
      const normalizedLoadoutItem = {
        id: loadoutItem[0],
        name: loadoutItem[1],
        type: loadoutItem[2],
        previewUrl: loadoutItem[3]
      }
      loadout.push(normalizedLoadoutItem);
    })
  }

  let loadouts = state.loadouts;
  loadouts[creatorAddress] = loadout;
  console.log("************** LOADOUT FOR CREATOR ", creatorAddress, " IS ", loadouts[creatorAddress]);
  return { ...state, loadouts };
}

export const addToLoadout = async (id, state, successCallback, warnCallback, errorCallback) => {
// Check if id is already in loadout
  const res = await fetch(`https://tokens.webaverse.com/${id}`);
  const token = await res.json();
  const { filename, hash } = token.properties;
  const url = `${storageHost}/${hash.slice(2)}`;
  const ext = getExt(filename);
  const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;

  console.log("STATE LOADOUTS IS", state.loadouts);
  console.log("state.loadouts[state.address] is", state.loadouts[state.address])

  let newLoadout = state.loadouts[state.address];

// Check if it's in another position, if it is
  let isInLoadout = newLoadout.filter(loadoutItem => {
    loadoutItem.id === id
  }).length > 0;

  // If it is and it's in the same position, return state
  if(isInLoadout){
      warnCallback("This asset is already in your loadout", state);
      return({...state});
    }

  try{
    await runSidechainTransaction(state.loginToken.mnemonic)('Account', 'setMetadata', state.address, 'loadout', JSON.stringify(newLoadout));
    newState = await getLoadout(state.address, newState)
    if(successCallback) successCallback(newState);
    return newState;
  } catch(error) {
    if(errorCallback) errorCallback(error, newState);
    return newState;
  }
}

export const removeFromLoadout = async (id, state) => {
// Check if ID is already in loadout
// If it is, return
let newLoadout = {...state.loadout}
for(let i = 0; i < newLoadout.length; i++){
  if(newLoadout[i].id === id) {
    newLoadout[i].id = null
  }
}
runSidechainTransaction(state.token.mnemonic)('Account', 'setMetadata', state.address, 'loadout', JSON.stringify(newLoadout));

  return newLoadout;
}