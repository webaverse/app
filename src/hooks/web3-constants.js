import _CONTRACTS from 'https://contracts.webaverse.com/config/addresses.js';
import _CONTRACT_ABIS from 'https://contracts.webaverse.com/config/abi.js';

export const isLocal = window.location.host.includes('local.webaverse.com');

export const WEB3_EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

export const CONTRACTS = {
  testnetpolygon: {
    Account: "0x4FA8201f2C74564C664DF5c7FD4FC6E89a19525f",
    FT: "0x78bE5624B6359FFe9e87995c645893443b9aeF74",
    FTProxy: "0x8eBc5c614e6376d5185489275A6EaA1AE8763439",
    NFT: "0x045cAe49860e924e22bc893B122A0f40007e4565",
    NFTProxy: "0xFf3dD9A50199B33E79a7929d5ad53BdD7d57c108",
    LAND: "0x59701Cccf9A583B7829925AE32a35FBAA828496f",
    LANDProxy: "0xA46c41901e6f04416eF93071cDbbC9D403dbe855",
    Trade: "0x25B2950803BaaB55daD11C2039331f783dae6069",
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
    brandColor: 'black',
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