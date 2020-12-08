import { React, ReactDOM, useEffect, useReducer, useState } from 'https://unpkg.com/es-react/dev';
import { getAddressFromMnemonic, runSidechainTransaction, web3 } from '../webaverse/blockchain.js';
import storage from './webaverse/storage.js';
import bip39 from './libs/bip39.js'
import { PageRouter } from './components/PageRouter.js';
import ActionTypes from './constants/ActionTypes.js';
import { Context } from './constants/Context.js';
import htm from './web_modules/htm.js';
import hdkeySpec from './libs/hdkey.js';
const storageHost = 'https://storage.exokit.org';
const hdkey = hdkeySpec.default;

window.html = htm.bind(React.createElement);

const initialValues = {
  useWebXR: false,
  loginToken: null,
  name: null,
  mainnetAddress: null,
  avatarThumbnail: null,
  showUserDropdown: false,
  address: null,
  avatarUrl: null,
  avatarFileName: null,
  avatarPreview: null,
  ftu: true,
  inventory: null,
  creatorProfiles: {},
  creatorInventories: {},
  creators: {},
  booths: {},
  lastFileHash: null,
  lastFileId: null
};



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
  console.log("Address is", address);
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

export const mintNft = async (file, name, description, quantity, successCallback, errorCallback, state) => {
  const { mnemonic, addr } = state.loginToken;
  const res = await fetch(storageHost, { method: 'POST', body: file });
  const { hash } = await res.json();

  let status, transactionHash, tokenIds;

  
  try {

  const fullAmount = {
    t: 'uint256',
    v: new web3.utils.BN(1e9)
      .mul(new web3.utils.BN(1e9))
      .mul(new web3.utils.BN(1e9)),
  };

    {
      const result = await runSidechainTransaction(mnemonic)('FT', 'approve', contracts['NFT']._address, fullAmount.v);
      status = result.status;
      transactionHash = '0x0';
      tokenIds = [];
    }
    if (status) {
      const result = await runSidechainTransaction(mnemonic)('NFT', 'mint', addr, '0x' + hash, name, description, quantity);
      status = result.status;
      transactionHash = result.transactionHash;
      const tokenId = new web3.utils.BN(result.logs[0].topics[3].slice(2), 16).toNumber();
      tokenIds = [tokenId, tokenId + quantity - 1];
      successCallback();
    }
  } catch (err) {
    console.warn(err.stack);
    status = false;
    transactionHash = '0x0';
    tokenIds = [];
    errorCallback();
  }

  return await pullUserObject(state);
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
  return newState;
};

export const requestTokenByEmail = async (email) => {
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
  console.log("emailOrPrivateKey is", emailOrPrivateKey);
  const split = emailOrPrivateKey.split(/\s+/).filter(w => !!w);

  if (split.length === 12) {
    // Private key
    const mnemonic = split.slice(0, 12).join(' ');
    return await setNewLoginToken(mnemonic);
  } else {
    // Email
    return await requestTokenByEmail(emailOrPrivateKey);
  }
};

export const setNewLoginToken = async (newLoginToken, state) => {
  console.log("Setting new login token");
  await storage.set('loginToken', newLoginToken);

  return await pullUserObject({ ...state, loginToken: newLoginToken });
};

export const logout = async (state) => {
  await storage.remove('loginToken');
  return await initializeStart(state);
};

export const initializeStart = async (state) => {
  let loginToken = await storage.get('loginToken');
  if (!loginToken) {
    console.log("Generating login token");
    loginToken = await bip39.generateMnemonic();
    await storage.set('loginToken', { mnemonic: loginToken, unregistered: true });
  }
  
  const newState = await pullUserObject({ ...state, loginToken });
  // newState = await initializeEthereum(newState);
  if (newState.loginToken.unregistered)
  console.warn("Login token is unregistered");
  console.log("login token is", loginToken);
  return await getAddress(newState);
};

const Application = () => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case ActionTypes.InitializeState:
        initializeStart(state).then(newState => {
          dispatch({ type: ActionTypes.InitializeStateEnd, payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.InitializeStateEnd:
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetProfileForCreator:
        getProfileForCreator(action.payload.address, state).then(newState => {
          dispatch({ type: ActionTypes.GetProfileForCreator.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetProfileForCreator.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetInventoryForCreator:
        getInventoryForCreator(action.payload.address, action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetInventoryForCreator.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetInventoryForCreator.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetCreators:
        getCreators(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetCreators.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetCreators.concat('End'):
        return { ...state, ...action.payload.state };
  
  
      case ActionTypes.GetBooths:
        console.log("GetBooths for creator action is", action.payload);
        getBooths(action.payload.page, state).then(newState => {
          dispatch({ type: ActionTypes.GetBooths.concat('End'), payload: { state: newState } });
        });
        return state;
  
      case ActionTypes.GetBooths.concat('End'):
        return { ...state, ...action.payload.state };


      case ActionTypes.RequestEmailToken.concat('End'):
        return { ...state, ...action.payload.state };

      case ActionTypes.LoginWithEmailOrPrivateKey:
        loginWithEmailOrPrivateKey(action.payload.emailOrPrivateKey, state).then(newState => {
          dispatch({ type: ActionTypes.LoginWithEmailOrPrivateKey.concat('End'), payload: { state: newState } });

        });
      return state;
  
      case ActionTypes.LoginWithEmailOrPrivateKey.concat('End'):
        return { ...state, ...action.payload.state };


      case ActionTypes.GatewayWithEmail:
        loginWithEmailCode(action.payload.email, action.payload.code, state).then(newState => {
          dispatch({ type: ActionTypes.GatewayWithEmail.concat('End'), payload: { state: newState } });
        });
        return state;

      case ActionTypes.GatewayWithEmail.concat('End'):
        return { ...state, ...action.payload.state };

  
      case ActionTypes.Logout:
        logout(state).then(newState => {
          dispatch({ type: ActionTypes.Logout.concat('End'), payload: { state: newState } });
        });
        return state;

        case ActionTypes.Logout.concat('End'):
          return { ...state, ...action.payload.state };


      case ActionTypes.MintNft:
        mintNft(action.payload.file,
                action.payload.name,
                action.payload.description,
                action.payload.quantity,
                action.payload.successCallback,
                action.payload.errorCallback,
                state
          ).then(newState => {
          dispatch({ type: ActionTypes.MintNft.concat('End'), payload: { state: newState } });
        });
        return state;

      case ActionTypes.MintNft.concat('End'):
        return { ...state, ...action.payload.state };
        
  
      // case ActionTypes.SendNft:
      //   return sendNft(action.payload.receiverAddress, action.payload.assetId, state);
  
      // case ActionTypes.BuyNft:
      //   return buyNft(action.payload.assetId, state);
  
      // case ActionTypes.SellNft:
      //   return sellNft(action.payload.assetId, state);
  
      // case ActionTypes.DestroyNft:
      //   return destroyNft(action.payload.assetId, state);
  
      // case ActionTypes.AddFtToNft:
      //   return addFtToNft(action.payload.assetId, state);
  
      // case ActionTypes.DepositFt:
      //   return depositFt(action.payload.amount, state);
  
      // case ActionTypes.WithdrawFt:
      //   return withdrawFt(action.payload.amount, state);
  
      // case ActionTypes.ChangeName:
      //   newState = setUsername(action.payload.newUserName, state);
      //   break;
  
      // case ActionTypes.SetAvatar:
      //   newState = setAvatar(action.payload.assetId, state);
      //   break;
  
      // case ActionTypes.SetHomespace:
      //   newState = setHomespace(action.payload.assetId, state);
      //   break;
  
      // case ActionTypes.AddToLoadout:
      //   newState = setLoadoutState(action.payload.assetId, true, state);
      //   break;
  
      // case ActionTypes.RemoveFromLoadout:
      //   newState = setLoadoutState(action.payload.assetId, false, state);
      //   break;
  
      // case ActionTypes.UploadFile:
      //   newState = uploadFile(action.payload.file, state);
      //   break;
  
      // case ActionTypes.SetFtu:
      //   newState = setFtu(state);
      //   break;
  
      default:
        console.warn("Default case in reducer, something is wrong");
        console.warn(action);
        return state;
  
    }
  }, initialValues);
  window.dispatch = dispatch;
  window.state = state;
  const [initState, setInitState] = useState(false);

  useEffect(() => {
    window.dispatch = dispatch;
  }, [dispatch]);

  useEffect(() => {
    window.state = state;
  }, [state]);

  useEffect(() => {
    if (!initState) {
      setInitState(true);
      dispatch({ type: ActionTypes.InitializeState });
      console.log("Render!");
    }
  }, []);
  return html`
  <${React.Suspense} fallback=${html`<div>Loading...</div>`}>
  ${state.address && html`
  <${Context.Provider} value=${{ state, dispatch }}>  
    ${!state.useWebXR ? html`
      <${PageRouter} />
    ` : html`
      <${WebXRContext} />
    `}
    </${Context.Provider}>
    `}
  <//>
`
}

ReactDOM.render(html`<${Application} />`,
  document.getElementById('root')
)