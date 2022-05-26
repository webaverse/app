import {useState, useEffect} from 'react';
import {
  CHAIN,
  CHAINS,
  DEFAULT_CHAIN,
} from './web3-constants';

import {
  connectToNetwork,
  addRPCToWallet,
  getChainId,
  getConnectedAccounts,
  requestAccounts,
} from './rpcHelpers';

const EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

export default function useWeb3Account(NETWORK = DEFAULT_CHAIN) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState('');
  const [wrongChain, setWrongChain] = useState(false);
  const [errorMessage, setErrorMessage] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        return;
      }

      await connectToNetwork(CHAIN[NETWORK]);

      const accounts = getConnectedAccounts();

      if (accounts.length === 0) {
        setErrorMessage(p => [...p, 'No authorized account found']);
      }

      setAccounts(accounts);
      setCurrentAccount(accounts[0]);

      const chainId = await getChainId();

      if (chainId === CHAIN[NETWORK].chainId) {
        setWrongChain(false);
      } else {
        setWrongChain(true);
      }

      setErrorMessage([]);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        return;
      }

      const accounts = requestAccounts();
      setCurrentAccount(accounts[0]);
      setErrorMessage([]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    const handleChainChanged = async chainId => {
      if (chainId === CHAIN_ID) {
        setWrongChain(false);
      } else {
        setWrongChain(true);
      }
    };

    if (window.ethereum) {
      window.ethereum.on(EVENTS.CHAIN_CHANGED, handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(EVENTS.CHAIN_CHANGED, handleChainChanged);
      }
    };
  }, [currentAccount]);

  useEffect(() => {
    const accountChanged = e => {
      setCurrentAccount(e[0]);
    };

    if (window.ethereum) {
      window.ethereum.on(EVENTS.ACCOUNTS_CHANGE, accountChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(EVENTS.ACCOUNTS_CHANGE, accountChanged);
      }
    };
  }, [currentAccount]);

  return {
    accounts,
    currentAccount,
    errorMessage,
    connectWallet,
    checkIfWalletIsConnected,
    wrongChain,
    addRPCToWallet,
    chains: CHAINS
  };
}
