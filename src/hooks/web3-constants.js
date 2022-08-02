
export const isLocal = window.location.host.includes('local.webaverse.com');

export const WEB3_EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

export const CONTRACTS = {
  testnetpolygon: {
    Webaverse: '0x367292a403115995d68a7d467FeBdF144910c06A',
    FT: '0x34272c5c67FF76a5B6ff20624796AD961c14E8c8',
    NFT: '0xa625A80263F3CBAB0a1c060e718fFd981194A08e',
  },
  mainnetsidechain: {
    Webaverse: '0x367292a403115995d68a7d467FeBdF144910c06A',
    FT: '0x34272c5c67FF76a5B6ff20624796AD961c14E8c8',
    NFT: '0xa625A80263F3CBAB0a1c060e718fFd981194A08e',
  },
  mainnet: { // need to deploy for real, these are not deployed
    Webaverse: '0x367292a403115995d68a7d467FeBdF144910c06A',
    FT: '0x34272c5c67FF76a5B6ff20624796AD961c14E8c8',
    NFT: '0xa625A80263F3CBAB0a1c060e718fFd981194A08e',
  },
  polygon: {
    Webaverse: '0x2C50E626bFF88845ec2b150f0C044995AC101e87',
    FT: '0x5d4043C9b67627F57A36373210E03134681230fd',
    NFT: '0x6281a08fe28a733d2A906dC851878D9786F72F21',
  },
};

export const CHAIN_TYPE = {
  TEST: 'testnet',
  PRODUCTION: 'mainnet',
};

export const CHAINS = {
//   LOCALHOST: {
//     name: 'Localhost',
//     chainId: '0x539',
//     brandColor: '#5BE2A7',
//   },
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
  //   RINKBY: {
  //     chainName: 'Rinkeby Test Network',
  //     name: 'Rinkeby',
  //     chainId: '0x4',
  //     blockExplorerUrls: ['https://rinkeby.etherscan.io'],
  //     symbol: 'ETH',
  //     rpcUrls: ['https://rinkeby.infura.io/v3/'],
  //     contract_name: 'testnet',
  //     previewLink: 'https://rinkeby.etherscan.io/address/',
  //     brandColor: 'rgb(123,63,228)',
  //     type: CHAIN_TYPE.TEST,
  //   },
  ETHEREUM_MAIN: {
    chainName: 'Ethereum Mainnet',
    name: 'Ethereum',
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: '0x1',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/d9606cb27e59432190a37d607726eb09'],
    contract_name: 'mainnet',
    previewLink: 'https://etherscan.io/address/',
    brandColor: 'rgb(63,123,228)',
    type: CHAIN_TYPE.PRODUCTION,
  },
  //   AVALANCHE_MAIN: {
  //     chainName: 'Avalanche Network',
  //     name: 'Avalanche',
  //     blockExplorerUrls: ['https://snowtrace.io/'],
  //     chainId: '0xa86a',
  //     symbol: 'AVAX',
  //     decimals: 18,
  //     rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  //     brandColor: 'rgb(228,63,123)',
  //     type: CHAIN_TYPE.PRODUCTION,
  //   },
  //   AVALANCHE_TEST: {
  //     chainName: 'Avalanche Testnet',
  //     name: 'Fuji',
  //     blockExplorerUrls: ['https://testnet.snowtrace.io/'],
  //     chainId: '0xa869',
  //     symbol: 'AVAX',
  //     decimals: 18,
  //     rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  //     brandColor: 'rgb(228,63,123)',
  //     type: CHAIN_TYPE.TEST,
  //   },
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
export const DEFAULT_CHAIN = CHAINS.POLYGON_MAIN;
