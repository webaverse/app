import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
import ethereumJsTx from './ethereumjs-tx.js';
import {makePromise} from './util.js';
import {
  chainName,
  web3MainnetSidechainEndpoint,
  web3TestnetSidechainEndpoint,
  polygonVigilKey,
} from './constants.js';
import addresses from 'https://contracts.webaverse.com/config/addresses.js';
import abis from 'https://contracts.webaverse.com/config/abi.js';
const hdkey = hdkeySpec.default;
const {Transaction, Common} = ethereumJsTx;

export const Networks = {
  mainnet: {
    displayName: 'Mainnet',
    transferOptions: ['mainnetsidechain'],
  },
  mainnetsidechain: {
    displayName: 'Webaverse',
    transferOptions: ['mainnet', 'polygon'],
  },
  polygon: {
    displayName: 'Polygon',
    transferOptions: ['mainnetsidechain'],
  },
  testnet: {
    displayName: 'Rinkeby Testnet',
    transferOptions: ['testnetsidechain', 'testnetpolygon'],
  },
  testnetsidechain: {
    displayName: 'Webaverse Testnet',
    transferOptions: ['testnet'],
  },
  testnetpolygon: {
    displayName: 'Polygon Testnet',
    transferOptions: ['testnetsidechain'],
  },
};

const injectedWeb3 = new Web3(window.ethereum);
const web3 = {
  mainnet: injectedWeb3,
  mainnetsidechain: new Web3(
    new Web3.providers.HttpProvider(web3MainnetSidechainEndpoint),
  ),
  testnet: injectedWeb3,
  testnetsidechain: new Web3(
    new Web3.providers.HttpProvider(web3TestnetSidechainEndpoint),
  ),
  polygon: new Web3(
    new Web3.providers.HttpProvider(
      `https://rpc-mainnet.maticvigil.com/v1/${polygonVigilKey}`,
    ),
  ),
  testnetpolygon: new Web3(
    new Web3.providers.HttpProvider(
      `https://rpc-mumbai.maticvigil.com/v1/${polygonVigilKey}`,
    ),
  ),
};
let common = null;
let addressFront;
let addressBack;
let networkName = '';
function _setChain(nn) {
  addressFront = addresses[nn];
  addressBack = addresses[nn + 'sidechain'];
  networkName = nn;

  if (nn === 'mainnet') {
    common = Common.forCustomChain(
      'mainnet',
      {
        name: 'geth',
        networkId: 1,
        chainId: 1338,
      },
      'petersburg',
    );
  } else if (nn === 'testnet') {
    common = Common.forCustomChain(
      'mainnet',
      {
        name: 'geth',
        networkId: 1,
        chainId: 1337,
      },
      'petersburg',
    );
  } else if (nn === 'polygon') {
    // throw new Error('cannot set common properties for polygon yet');
  } else {
    throw new Error('unknown network name', nn);
  }
}
const _initSetChain = () => {
  _setChain(chainName);
};
_initSetChain();

const contracts = {};
Object.keys(Networks).forEach(network => {
  // console.log("*** Network is", network);
  contracts[network] = {
    Account: new web3[network].eth.Contract(
      abis.Account,
      addresses[network].Account,
    ),
    FT: new web3[network].eth.Contract(abis.FT, addresses[network].FT),
    FTProxy: new web3[network].eth.Contract(
      abis.FTProxy,
      addresses[network].FTProxy,
    ),
    NFT: new web3[network].eth.Contract(abis.NFT, addresses[network].NFT),
    NFTProxy: new web3[network].eth.Contract(
      abis.NFTProxy,
      addresses[network].NFTProxy,
    ),
    Trade: new web3[network].eth.Contract(abis.Trade, addresses[network].Trade),
    LAND: new web3[network].eth.Contract(abis.LAND, addresses[network].LAND),
    LANDProxy: new web3[network].eth.Contract(
      abis.LANDProxy,
      addresses[network].LANDProxy,
    ),
  };
});

const getNetworkName = () => chainName;

const getMainnetAddress = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const [address] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return address || null;
  } else {
    return null;
  }
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
const runSidechainTransaction =
  mnemonic =>
  async (contractName, method, ...args) => {
    const wallet = hdkey
      .fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic))
      .derivePath("m/44'/60'/0'/0/0")
      .getWallet();
    const address = wallet.getAddressString();
    const privateKey = wallet.getPrivateKeyString();
    const privateKeyBytes = Uint8Array.from(
      web3.mainnetsidechain.utils.hexToBytes(privateKey),
    );

    const txData = contracts.mainnetsidechain[contractName].methods[method](
      ...args,
    );
    const data = txData.encodeABI();
    const gas = await txData.estimateGas({
      from: address,
    });
    let gasPrice = await web3.mainnetsidechain.eth.getGasPrice();
    gasPrice = parseInt(gasPrice, 10);

    await transactionQueue.lock();
    const nonce = await web3.mainnetsidechain.eth.getTransactionCount(address);
    const tx = Transaction.fromTxData(
      {
        to: contracts.mainnetsidechain[contractName]._address,
        nonce: '0x' + new web3.mainnetsidechain.utils.BN(nonce).toString(16),
        gas: '0x' + new web3.mainnetsidechain.utils.BN(gas).toString(16),
        gasPrice:
          '0x' + new web3.mainnetsidechain.utils.BN(gasPrice).toString(16),
        gasLimit:
          '0x' + new web3.mainnetsidechain.utils.BN(8000000).toString(16),
        data,
      },
      {
        common,
      },
    ).sign(privateKeyBytes);
    const rawTx = '0x' + tx.serialize().toString('hex');
    // console.log('signed tx', tx, rawTx);
    const receipt = await web3.mainnetsidechain.eth.sendSignedTransaction(
      rawTx,
    );
    transactionQueue.unlock();
    return receipt;
  };
const getTransactionSignature = async (
  chainName,
  contractName,
  transactionHash,
) => {
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

const runMainnetTransaction = async (contractName, method, ...args) => {
  const address = await getMainnetAddress();
  if (address) {
    const m = contracts.front[contractName].methods[method];
    m.apply(m, args).send({
      from: address,
    });
  } else {
    throw new Error('no addresses passed by web3');
  }
};

const _getWalletFromMnemonic = mnemonic =>
  hdkey
    .fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic))
    .derivePath("m/44'/60'/0'/0/0")
    .getWallet();
const getAddressFromMnemonic = mnemonic =>
  _getWalletFromMnemonic(mnemonic).getAddressString();

const networkNameEl = document.getElementById('network-name');
const bindInterface = () => {
  if (networkNameEl) {
    networkNameEl.innerText = networkName;
  }
};

export {
  web3,
  contracts,
  bindInterface,
  getNetworkName,
  getMainnetAddress,
  runSidechainTransaction,
  runMainnetTransaction,
  getTransactionSignature,
  getAddressFromMnemonic,
};
