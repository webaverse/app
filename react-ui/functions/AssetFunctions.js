import { contracts, runSidechainTransaction, web3 } from '../webaverse/blockchain.js';
import { previewExt, previewHost, storageHost } from '../webaverse/constants.js';
import { getExt } from '../webaverse/util.js';

export const buyAsset = async (id, successCallback, errorCallback) => {
  try {
    console.log("No buy asset logic");
    if (successCallback)
      successCallback();
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const sellAsset = async (id, successCallback, errorCallback) => {
  try {
    console.log("No buy asset logic");
    if (successCallback)
      successCallback();
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const cancelSale = async (id, successCallback, errorCallback) => {
  try {
    console.log("No buy asset logic");
    if (successCallback)
      successCallback();
  } catch (error) {
    if (errorCallback)
      errorCallback(error);
  }
};

export const setAvatar = async (id, successCallback, errorCallback) => {
  if (!state.loginToken)
    throw new Error('not logged in');
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
  if (!state.loginToken)
    throw new Error('not logged in');
  console.log("Setting homespace");
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
