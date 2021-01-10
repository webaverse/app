/* import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import ethereumJsTx from './ethereumjs-tx.js';
import {makePromise} from './util.js';
import {storageHost, web3SidechainEndpoint} from './constants.js';
const {Transaction, Common} = ethereumJsTx; */

import {loginManager} from './login.js';
import {web3, contracts} from './blockchain.js';

const mintToken = (file, opts) => loginManager.uploadFile(file, opts);
const getParcel = id => {
  id = new web3['sidechain'].utils.BN(id);
  return contracts['sidechain'].LAND.methods.tokenByIdFull(id).call();
};

export {
  mintToken,
  getParcel,
};