export const isLocal = window.location.host.includes('localhost');

import _CONTRACTS from 'https://contracts.webaverse.com/config/addresses.js';
import _CONTRACT_ABIS from 'https://contracts.webaverse.com/config/abi.js';

export const CONTRACTS = _CONTRACTS;
export const CONTRACT_ABIS = _CONTRACT_ABIS;

export const CHAIN = {
  LOCALHOST: {
    name: 'Localhost',
    chainId: '0x539',
  },
  RINKBY: {
    chainName: 'RinkyBy Test Network',
    name: 'RinkyBy',
    chainId: 0x4,
    blockExplorerUrls: ['https://rinkeby.etherscan.io'],
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
  },
  ETHEREUM_MAIN: {
    chainName: 'Ethereum Mainnet',
    name: 'Ethereum Mainnet',
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: 0x1,
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
  },
  AVALANCHE_MAIN: {
    chainName: 'Avalanche Network',
    name: 'Avalanche',
    blockExplorerUrls: ['https://snowtrace.io/'],
    chainId: '0xa86a',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  },
  POLYGON_MAIN: {
    chainName: 'Polygon Mainnet',
    name: 'Polygon',
    blockExplorerUrls: ['https://polygonscan.com/'],
    chainId: '0x137',
    symbol: 'MATIC',
    rpcUrls: ['https://polygon-rpc.com'],
  },
};

export const CHAINS = Object.keys(CHAIN);
export const DEFAULT_CHAIN = CHAIN.ETHEREUM_MAIN;
export const CHAIN_IN_USE = CHAIN[DEFAULT_CHAIN];