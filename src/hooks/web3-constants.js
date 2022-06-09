import _CONTRACTS from 'https://contracts.webaverse.com/config/addresses.js';
import _CONTRACT_ABIS from 'https://contracts.webaverse.com/config/abi.js';

export const isLocal = window.location.host.includes('localhost');

export const WEB3_EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

export const CONTRACTS = {
  testnetpolygon: {
    Account : "0xD91998D6F80E6eFc12195604e690E430c5AA237C",
    FT : "0xFD0b398F6543C48D2be6ab7841894c3EcbA40b48",
    FTProxy: "0x7C50614bc990E13B02fD9B223F80070537ee4cA4",
    NFT : "0xAd1191F49f7f2488Fd88b52C9B31e66C36d5E75C",
    NFTProxy : "0xc49bec0b28cB9fD5B6040BF0e8139Ea7C6baA1cb",
    LAND : "0x3345bBb53b1a7D0cD0B0f2a794520c8f8B9B544f",
    LANDProxy : "0x7A5243f2da98c2ADF7855F600Fc8C59ca007358f",
    Trade : "0xF96DEA1Df62440385Ee5dBBc7e8BA213706D5E82"
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
