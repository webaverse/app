import hdkeySpec from '../libs/hdkey.js';
import { contracts, runSidechainTransaction, web3 } from '../webaverse/blockchain.js';
import { storageHost } from '../webaverse/constants.js';

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
