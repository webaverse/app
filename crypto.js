import {web3, contracts, runSidechainTransaction} from './blockchain.js';
import {loginManager} from './login.js';
import {getExt} from './util.js';
import {storageHost} from './constants.js';

const mintToken = async (file, {description = ''} = {}) => {
  const res = await fetch(storageHost, {
    method: 'POST',
    body: file,
  });
  if (res.ok) {
    const j = await res.json();
    const {hash} = j;

    const mnemonic = loginManager.getMnemonic();
    const address = loginManager.getAddress();
    const quantity = 1;

    // const receipt = await runSidechainTransaction(mnemonic)('NFT', 'mint', myAddress, hash.v, filename.v, count.v);

    // const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
    // const address = wallet.getAddressString();

    const fullAmount = {
      t: 'uint256',
      v: new web3['sidechain'].utils.BN(1e9)
        .mul(new web3['sidechain'].utils.BN(1e9))
        .mul(new web3['sidechain'].utils.BN(1e9)),
    };

    let status, transactionHash, tokenId;
    try {
      {
        const result = await runSidechainTransaction(mnemonic)('FT', 'approve', contracts['sidechain']['NFT']._address, fullAmount.v);
        status = result.status;
        transactionHash = '0x0';
        tokenId = null;
      }
      if (status) {
        const extName = getExt(name);
        const fileName = name.slice(0, -(extName.length + 1));
        console.log('minting', ['NFT', 'mint', address, '0x' + hash, fileName, extName, description, quantity]);
        const result = await runSidechainTransaction(mnemonic)('NFT', 'mint', address, '0x' + hash, fileName, extName, description, quantity);
        status = result.status;
        transactionHash = result.transactionHash;
        tokenId = new web3['sidechain'].utils.BN(result.logs[0].topics[3].slice(2), 16).toNumber();
      }

      return tokenIds;
    } catch(err) {
      console.warn(err.stack);
      status = false;
      transactionHash = '0x0';
      tokenId = null;
    }

    return tokenId;
  } else {
    throw new Error('invalid status code: ' + res.status);
  }
};

export {
  mintToken,
};