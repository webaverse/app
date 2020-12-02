import { ActionTypes } from "../constants/ActionTypes.js";
import bip39 from '../libs/bip39.js';
import { getAddressFromMnemonic, runSidechainTransaction } from '../webaverse/blockchain.js';
import { loginEndpoint, previewExt, previewHost, storageHost } from '../webaverse/constants.js';
import storage from '../webaverse/storage.js';
import { getExt } from '../webaverse/util.js';

const expectedNetworkType = 'rinkeby';
const openSeaUrlPrefix = `https://${expectedNetworkType === 'main' ? '' : expectedNetworkType + '.'}opensea.io/assets`;
const openSeaUrl = `${openSeaUrlPrefix}/m3-v7`;
// const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fapp.webaverse.com%2Fdiscordlogin.html&response_type=code&scope=identify`;
let mainnetAddress = null;

const initializeEtherium = async (state) => {
  let networkType;
  if (window.ethereum) {
    await window.ethereum.enable();

    networkType = await web3['main'].eth.net.getNetworkType();
    if (expectedNetworkType === 'rinkeby') {
      mainnetAddress = web3['main'].currentProvider.selectedAddress;
    } else {
      document.write(`network is ${networkType}; switch to Rinkeby`);
      return;
    }
  } else {
    networkType = null;
  }
}

const _checkMainFtApproved = async (amt, state) => {
  const receipt0 = await contracts.main.FT.methods.allowance(mainnetAddress, contracts.main.FTProxy._address).call();
  
  if (receipt0 < amt) {
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
  } else {
    return null;
  }
};

const _checkMainNftApproved = async (state) => {
  const approved = await contracts.main.NFT.methods.isApprovedForAll(mainnetAddress, contracts.main.NFTProxy._address).call();

  if (!approved) {
    window.alert('First you have to approve the NFT contract to handle tokens. This will only happen once.');

    const receipt1 = await contracts.main.NFT.methods.setApprovalForAll(contracts.main.NFTProxy._address, true).send({
      from: mainnetAddress,
    });
    return receipt1;
  } else {
    return null;
  }
};


const setUsername = async (name, state) => {
    if (this.userObject) this.userObject.name = name;
}

const getAddress = (state) => {
    if (!this.loginToken.mnemonic) return null;
    const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(this.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
    const address = wallet.getAddressString();
    return address;
}

const getMnemonic = (state) => this.loginToken && this.loginToken.mnemonic;

const getAvatar = (state) => this.userObject && this.userObject.avatar;

const setAvatar = async (id, state) => {
    if (!this.loginToken) throw new Error('not logged in');
    const res = await fetch(`https://tokens.webaverse.com/${id}`);
    const token = await res.json();
    const { filename, hash } = token.properties;
    const url = `${storageHost}/${hash.slice(2)}`;
    const ext = getExt(filename);
    const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
    const address = this.getAddress();
    await Promise.all([
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', url),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', filename),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', preview),
    ]);
    this.userObject.avatar = {
        url,
        filename,
        preview,
    };
}

const setFtu = async (name, avatarUrl, state) => {
    const address = this.getAddress();
    const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

    await Promise.all([
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'name', name),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', avatarUrl),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', avatarUrl),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', avatarPreview),
        runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'ftu', '1'),
    ]);


    this.userObject.avatar = {
        url: avatarUrl,
        filename: avatarUrl,
        preview: avatarPreview,
    };
}

const getInventory = async (state) => {
    if (!this.loginToken) return []
    const address = this.getAddress();
    const res = await fetch(`https://tokens.webaverse.com/${address}`);
    return await res.json();
}

const uploadFile = async (file, state) => {
    if (!this.loginToken) throw new Error('not logged in');
    if (!file.name) throw new Error('file has no name');

    const { mnemonic, addr } = this.loginToken;
    const res = await fetch(storageHost, {
        method: 'POST',
        body: file,
    });
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
        return {
            hash,
            id,
        };
    } else {
        return {
            hash,
            id,
        };
    }
}

const sendFt = async (address, amount, state) => {
    if (!this.loginToken) throw new Error('not logged in');
    const { mnemonic, addr } = this.loginToken;
    const contractSource = await getContractSource('transferToken.cdc');

    await fetch(`https://accounts.exokit.org/sendTransaction`, {
        method: 'POST',
        body: JSON.stringify({
            address: addr,
            mnemonic,

            limit: 100,
            transaction: contractSource
                .replace(/ARG0/g, amount)
                .replace(/ARG1/g, '0x' + address),
            wait: true,
        }),
    });
}

const sendNft = async (address, id, state) => {
    if (!this.loginToken) throw new Error('not logged in');
        const { mnemonic, addr } = this.loginToken;
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
}

const destroyNft = async (id, state) => {
    if (!this.loginToken) throw new Error('not logged in');
        const { mnemonic, addr } = this.loginToken;
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
}

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

  if (!res.ok){
    console.warn("Email login failed");
    return state;
  } 

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
