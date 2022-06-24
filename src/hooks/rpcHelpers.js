const RPC_METHODS = {
  SWITCH_CHAIN: 'wallet_switchEthereumChain',
  ADD_CHAIN: 'wallet_addEthereumChain',
  WATCH_ASSET: 'wallet_watchAsset',
  SCAN_QR: 'wallet_scanQRCode',
  GET_PUBLIC_KEY: 'eth_getEncryptionPublicKey',
  REQUEST_PERMISSIONS: 'wallet_requestPermissions',
  GET_PERMISSIONS: 'wallet_getPermissions',
  DECRYPT: 'eth_decrypt',
  ACCOUNTS: 'eth_accounts',
  REQUEST_ACCOUNTS: 'eth_requestAccounts',
  BALANCE: 'eth_getBalance',
  TRANSFER: 'eth_sendTransaction',
  SIGN: 'eth_signTransaction',
  CHAIN_ID: 'eth_chainId',
};

export async function connectToNetwork({
  chainName = '',
  name = '',
  blockExplorerUrls = [''],
  chainId = '',
  symbol = '',
  decimals = 0,
  rpcUrls = [''],
}) {
  return switchChain(chainId).catch(async switchError => {
    if (switchError.code === 4902) {
      await addRPCToWallet({
        chainId,
        rpcUrls,
        chainName,
        blockExplorerUrls,
        nativeCurrency: {
          name,
          symbol,
          decimals,
        },
      }).catch(error => {
        console.warn('cant add chain', error);
      });
    }
  });
}

export async function addRPCToWallet({
  chainId = '',
  chainName = '',
  nativeCurrency = {
    name: '',
    symbol: '',
    decimals: 0,
  },
  rpcUrls = [''],
  blockExplorerUrls = [''],
  iconUrls = [''],
}) {
  const {ethereum} = window;
  const rpc = await ethereum.request({
    method: RPC_METHODS.ADD_CHAIN,
    params: [{
      chainId,
      chainName,
      nativeCurrency,
      rpcUrls,
      blockExplorerUrls,
      iconUrls,
    }],
  }).catch(error => {
    console.warn('cant add RPC to wallet', error);
  });

  return rpc;
}

export async function getConnectedAccounts() {
  const {ethereum} = window;
  const accounts = await ethereum.request({
    method: RPC_METHODS.ACCOUNTS,
  }).catch(error => {
    console.warn('cant get connected accounts', error);
  });
  return accounts;
}

export async function requestAccounts() {
  const {ethereum} = window;
  const accounts = await ethereum.request({
    method: RPC_METHODS.REQUEST_ACCOUNTS,
  }).catch(error => {
    console.warn('cant request accounts', error);
  });
  return accounts;
}

export async function getChainId() {
  const {ethereum} = window;
  const chainId = await ethereum.request({
    method: RPC_METHODS.CHAIN_ID,
  }).catch(error => {
    console.warn('cant get chain id', error);
  });
  return chainId;
}

export async function switchChain(chainId) {
  const {ethereum} = window;
  return await ethereum.request({
    method: RPC_METHODS.SWITCH_CHAIN,
    params: [{chainId}],
  }).catch(error => {
    console.warn('cant switch chain', error);
  });
}
