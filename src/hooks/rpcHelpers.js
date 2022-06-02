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
  try {
    switchChain(chainId);
  } catch (switchError) {
    // no chain in metamask
    if (switchError.code === 4902) {
      try {
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
        });
      } catch (addError) {
        console.log(`Error adding ${name} Network`);
      }
    }
  }
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
  });

  return rpc;
}

export async function getConnectedAccounts() {
  const {ethereum} = window;
  const accounts = await ethereum.request({
    method: RPC_METHODS.ACCOUNTS,
  });
  return accounts;
}

export async function requestAccounts(address) {
  const {ethereum} = window;
  const accounts = await ethereum.request({
    method: RPC_METHODS.REQUEST_ACCOUNTS,
  });
  return accounts;
}

export async function getChainId() {
  const {ethereum} = window;
  const chainId = await ethereum.request({
    method: RPC_METHODS.CHAIN_ID,
  });
  return chainId;
}

export async function switchChain(chainId) {
  const {ethereum} = window;
  await ethereum.request({
    method: RPC_METHODS.SWITCH_CHAIN,
    params: [{chainId}],
  });
}
