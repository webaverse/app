import {useState, useEffect} from 'react';
import {
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
  const [currentAddress, setCurrentAddress] = useState('');
  const [wrongChain, setWrongChain] = useState(false);
  const [errorMessage, setErrorMessage] = useState([]);
  const [currentChain, setCurrentChain] = useState(NETWORK);

  const checkChain = (chainId) => {
    if (chainId === currentChain.chainId) {
      setWrongChain(false);
    } else {
      setWrongChain(true);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        return;
      }

      await connectToNetwork(currentChain);

      const accounts = getConnectedAccounts();

      if (accounts.length === 0) {
        setErrorMessage(p => [...p, 'No authorized account found']);
      }

      setAccounts(accounts);
      setCurrentAddress(accounts[0]);

      const chainId = await getChainId();

      checkChain(chainId); // checks the chain ID against the chain selected in metamask

      setErrorMessage([]);
    } catch (error) {
      console.log(error);
    }
  };

  const getAccounts = async () => {
    const accounts = await requestAccounts();
    setCurrentAddress(accounts[0]);
    return accounts[0];
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        return;
      }

      await connectToNetwork(currentChain);

      const accounts = await requestAccounts();

      setCurrentAddress(accounts[0]);
      setErrorMessage([]);

      return accounts[0];

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    const handleChainChanged = async chainId => {
      checkChain(chainId);
    };

    if (window.ethereum) {
      window.ethereum.on(EVENTS.CHAIN_CHANGED, handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(EVENTS.CHAIN_CHANGED, handleChainChanged);
      }
    };
  }, [currentAddress]);

  useEffect(() => {
    const accountChanged = e => {
      setCurrentAddress(e[0]);
    };

    if (window.ethereum) {
      window.ethereum.on(EVENTS.ACCOUNTS_CHANGE, accountChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(EVENTS.ACCOUNTS_CHANGE, accountChanged);
      }
    };
  }, [currentAddress]);

  function switchChain(chain) {
    setCurrentChain(chain);
    setWrongChain(false);
  }

  return {
    accounts,
    currentAddress,
    errorMessage,
    getAccounts,
    connectWallet,
    checkIfWalletIsConnected,
    wrongChain,
    addRPCToWallet,
    chains: CHAINS,
    switchChain,
  };
}
