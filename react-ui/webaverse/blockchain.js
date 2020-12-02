import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import ethereumJsTx from './ethereumjs-tx.js';
import {makePromise} from './util.js';
import {storageHost, web3SidechainEndpoint} from './constants.js';
const {Transaction, Common} = ethereumJsTx;
import addresses from 'https://contracts.webaverse.com/ethereum/address.js';
import abis from 'https://contracts.webaverse.com/ethereum/abi.js';
let {
  main: {Account: AccountAddress, FT: FTAddress, NFT: NFTAddress, FTProxy: FTProxyAddress, NFTProxy: NFTProxyAddress, Trade: TradeAddress},
  sidechain: {Account: AccountAddressSidechain, FT: FTAddressSidechain, NFT: NFTAddressSidechain, FTProxy: FTProxyAddressSidechain, NFTProxy: NFTProxyAddressSidechain, Trade: TradeAddressSidechain},
} = addresses;
let {Account: AccountAbi, FT: FTAbi, FTProxy: FTProxyAbi, NFT: NFTAbi, NFTProxy: NFTProxyAbi, Trade: TradeAbi} = abis;

const web3 = {
  main: new Web3(window.ethereum),
  sidechain: new Web3(new Web3.providers.HttpProvider(web3SidechainEndpoint)),
};

const contracts = {
  main: {
    Account: new web3['main'].eth.Contract(AccountAbi, AccountAddress),
    FT: new web3['main'].eth.Contract(FTAbi, FTAddress),
    FTProxy: new web3['main'].eth.Contract(FTProxyAbi, FTProxyAddress),
    NFT: new web3['main'].eth.Contract(NFTAbi, NFTAddress),
    NFTProxy: new web3['main'].eth.Contract(NFTProxyAbi, NFTProxyAddress),
    Trade: new web3['main'].eth.Contract(TradeAbi, TradeAddress),
  },
  sidechain: {
    Account: new web3['sidechain'].eth.Contract(AccountAbi, AccountAddressSidechain),
    FT: new web3['sidechain'].eth.Contract(FTAbi, FTAddressSidechain),
    FTProxy: new web3['sidechain'].eth.Contract(FTProxyAbi, FTProxyAddressSidechain),
    NFT: new web3['sidechain'].eth.Contract(NFTAbi, NFTAddressSidechain),
    NFTProxy: new web3['sidechain'].eth.Contract(NFTProxyAbi, NFTProxyAddressSidechain),
    Trade: new web3['sidechain'].eth.Contract(TradeAbi, TradeAddressSidechain),
  },
};

const transactionQueue = {
  running: false,
  queue: [],
  lock() {
    if (!this.running) {
      this.running = true;
      return Promise.resolve();
    } else {
      const promise = makePromise();
      this.queue.push(promise.accept);
      return promise;
    }
  },
  unlock() {
    this.running = false;
    if (this.queue.length > 0) {
      this.queue.shift()();
    }
  },
};
const runSidechainTransaction = mnemonic => async (contractName, method, ...args) => {
  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const address = wallet.getAddressString();
  // console.log('got mnem', mnemonic, address);
  const privateKey = wallet.getPrivateKeyString();
  const privateKeyBytes = Uint8Array.from(web3['sidechain'].utils.hexToBytes(privateKey));

  const txData = contracts['sidechain'][contractName].methods[method](...args);
  const data = txData.encodeABI();
  const gas = await txData.estimateGas({
    from: address,
  });
  let gasPrice = await web3['sidechain'].eth.getGasPrice();
  gasPrice = parseInt(gasPrice, 10);

  await transactionQueue.lock();
  const nonce = await web3['sidechain'].eth.getTransactionCount(address);
  let tx = Transaction.fromTxData({
    to: contracts['sidechain'][contractName]._address,
    nonce: '0x' + new web3['sidechain'].utils.BN(nonce).toString(16),
    gas: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
    gasPrice: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
    gasLimit: '0x' + new web3['sidechain'].utils.BN(8000000).toString(16),
    data,
  }, {
    common: Common.forCustomChain(
      'mainnet',
      {
        name: 'geth',
        networkId: 1,
        chainId: 1337,
      },
      'petersburg',
    ),
  }).sign(privateKeyBytes);
  const rawTx = '0x' + tx.serialize().toString('hex');
  // console.log('signed tx', tx, rawTx);
  const receipt = await web3['sidechain'].eth.sendSignedTransaction(rawTx);
  transactionQueue.unlock();
  return receipt;
};
const getTransactionSignature = async (chainName, contractName, transactionHash) => {
  const u = `https://sign.exokit.org/${chainName}/${contractName}/${transactionHash}`;
  for (let i = 0; i < 10; i++) {
    const signature = await fetch(u).then(res => res.json());
    // console.log('got sig', u, signature);
    if (signature) {
      return signature;
    } else {
      await new Promise((accept, reject) => {
        setTimeout(accept, 1000);
      });
    }
  }
  return null;
};

const _getWalletFromMnemonic = mnemonic => hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic))
  .derivePath(`m/44'/60'/0'/0/0`)
  .getWallet();
const getAddressFromMnemonic = mnemonic => _getWalletFromMnemonic(mnemonic)
  .getAddressString();

export {
  web3,
  contracts,
  runSidechainTransaction,
  getTransactionSignature,
  getAddressFromMnemonic,
};