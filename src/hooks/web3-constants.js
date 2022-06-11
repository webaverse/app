import _CONTRACTS from 'https://contracts.webaverse.com/config/addresses.js';
import _CONTRACT_ABIS from 'https://contracts.webaverse.com/config/abi.js';

export const isLocal = window.location.host.includes('localhost');

export const WEB3_EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

export const CONTRACTS = {
  testnetpolygon: {
    Account: "0x7ceBaA0512869217A1bcAAD9D6F9999eF459E419",
    FT: "0x356d3996ce51312E6E29BD9993D4F23BBa2a57aB",
    FTProxy: "0xc5B61637Deb1e37f60725DFB0d3F0ACE1622f092",
    NFT: "0x8DB7cCC7B91AF9CF361eD2AB241A33BDD321FB78",
    NFTProxy: "0xBC4014e263Fc63A1c909F90F6d7d49C2B427fF52",
    LAND: "0x3B055090745c894aD6B769cf3772ab48ACb4bB39",
    LANDProxy: "0x5B75a9Ca90F8eC6b1ab3C1F68C48637F50C1D130",
    Trade: "0x054393481F08026161785B4b63c9890cC725D1c7",
  },
  mainnetsidechain: {
    Account: '0xa9A8417bcb1F0957110b2B8876827C9400a5F16E',
    FT: '0xa0220Cc38Ec4693b3Ccc901fdea7bF9F6A6e7EA0',
    FTProxy: '0xD8861A993e06B730117ee2CcD797d3552D192A57',
    NFT: '0x226aedB52AA7E7505BD89756680403E81ad75A46',
    NFTProxy: '0x4dC1be8466a8e3AB97a0eF8873a6A64A9f77D0FB',
    LAND: '0x12049fE8b58930f9A170dC6F48cC6778C4c1126a',
    LANDProxy: '0x5Ae6AB9F8c6A1BF2E6172659438f1f135e7b7Dd9',
    Trade: '0x7e03Ca37526f4b4F4C03E61A8535a2f6B5F25207',
  },
};

export const CONTRACT_ABIS = _CONTRACT_ABIS;

export const CHAIN_TYPE = {
  TEST: 'testnet',
  PRODUCTION: 'mainnet',
}

export const CHAINS = {
  LOCALHOST: {
    name: 'Localhost',
    chainId: '0x539',
    brandColor: '#5BE2A7',
  },
  WEBAVERSE: {
    chainName: 'Webaverse Side Chain',
    name: 'Webaverse',
    chainId: '0x53a',
    blockExplorerUrls: ['https://app.webaverse.com/'],
    symbol: 'SILK',
    decimals: 18,
    rpcUrls: ['https://mainnetsidechain.exokit.org/'],
    contract_name: 'mainnetsidechain',
    previewLink: '',
    brandColor: '#5BE2A7',
    type: CHAIN_TYPE.PRODUCTION,
  },
  RINKBY: {
    chainName: 'RinkyBy Test Network',
    name: 'RinkyBy',
    chainId: '0x4',
    blockExplorerUrls: ['https://rinkeby.etherscan.io'],
    symbol: 'ETH',
    rpcUrls: ['https://rinkeby.infura.io/v3/'],
    contract_name: 'testnet',
    previewLink: 'https://rinkeby.etherscan.io/address/',
    brandColor: 'rgb(123,63,228)',
    type: CHAIN_TYPE.TEST,
  },
  ETHEREUM_MAIN: {
    chainName: 'Ethereum Mainnet',
    name: 'Ethereum',
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: '0x1',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    contract_name: 'mainnet',
    previewLink: 'https://etherscan.io/address/',
    brandColor: 'rgb(63,123,228)',
    type: CHAIN_TYPE.PRODUCTION,
  },
  AVALANCHE_MAIN: {
    chainName: 'Avalanche Network',
    name: 'Avalanche',
    blockExplorerUrls: ['https://snowtrace.io/'],
    chainId: '0xa86a',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    brandColor: 'rgb(228,63,123)',
    type: CHAIN_TYPE.PRODUCTION,
  },
  AVALANCHE_TEST: {
    chainName: 'Avalanche Testnet',
    name: 'Fuji',
    blockExplorerUrls: ['https://testnet.snowtrace.io/'],
    chainId: '0xa869',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    brandColor: 'rgb(228,63,123)',
    type: CHAIN_TYPE.TEST,
  },
  POLYGON_MAIN: {
    chainName: 'Polygon Mainnet',
    name: 'Polygon',
    blockExplorerUrls: ['https://polygonscan.com/'],
    chainId: '0x89',
    symbol: 'MATIC',
    rpcUrls: ['https://polygon-rpc.com'],
    decimals: 18,
    contract_name: 'polygon',
    previewLink: 'https://polygonscan.com/address/',
    brandColor: 'rgb(123,63,228)',
    type: CHAIN_TYPE.PRODUCTION,
  },
  MUMBAI: {
    chainName: 'Mumbai Testnet',
    name: 'Mumbai',
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
    chainId: '0x13881',
    symbol: 'MATIC',
    rpcUrls: [
      // 'https://rpc-mumbai.matic.today/',
      'https://matic-mumbai.chainstacklabs.com'],
    decimals: 18,
    contract_name: 'testnetpolygon',
    previewLink: 'https://polygonscan.com/address/',
    brandColor: 'rgb(123,63,228)',
    type: CHAIN_TYPE.TEST,
  },
};

export const CHAIN_ID_MAP = Object.keys(CHAINS).reduce((acc, key) => {
  acc[CHAINS[key].chainId] = key;
  return acc;
}, {});

export const NETWORK_KEYS = Object.keys(CHAINS);
export const DEFAULT_CHAIN = CHAINS.MUMBAI;
