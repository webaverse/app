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
import {ethers} from 'ethers';

const EVENTS = {
  CHAIN_CHANGED: 'chainChanged',
  ACCOUNTS_CHANGE: 'accountsChanged',
};

const ACCOUNT_DATA = {
  EMAIL: 'email',
  AVATAR: 'avatar',
};

export default function useWeb3Account(NETWORK = DEFAULT_CHAIN) {
  const [accounts, setAccounts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [wrongChain, setWrongChain] = useState(false);
  const [errorMessage, setErrorMessage] = useState([]);
  const [currentChain, setCurrentChain] = useState(NETWORK);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkForAccounts() {
      const accounts = await requestAccounts();
      if (accounts.length > 0) {
        setAccounts(accounts);
        setCurrentAddress(accounts[0]);
        setIsConnected(true);
      }
    }
    checkForAccounts();
  }, []);

  const getProvider = () => {
    const {ethereum} = window;
    if (!ethereum) {
      setErrorMessage(p => [...p, 'Make sure you have metamask!']);
      return;
    }

    return new ethers.providers.Web3Provider(window.ethereum);
  };

  const checkChain = chainId => {
    if (chainId === currentChain.chainId) {
      setWrongChain(false);
    } else {
      setWrongChain(true);
    }
  };

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

  const getAccountDetails = async (address = currentAddress) => {
    const provider = getProvider();
    var check = ethers.utils.getAddress(address);
    try {
      const name = await provider.lookupAddress(check);
      if (!name) return {};

      const resolver = await provider.getResolver(name);

      const accountDetails = {};

      await Promise.all(
        Object.keys(ACCOUNT_DATA).map(async key => {
          const data = await resolver.getText(ACCOUNT_DATA[key]);
          accountDetails[ACCOUNT_DATA[key]] = data;
        }),
      );

      return {...accountDetails, name};
    } catch (error) {
      return {};
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
    getAccountDetails,
    getProvider,
    isConnected,
  };
}
