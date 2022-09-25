import {useState, useEffect} from 'react';
import {CHAINS, DEFAULT_CHAIN, WEB3_EVENTS} from './web3-constants';

import {
  connectToNetwork,
  addRPCToWallet,
  requestAccounts,
} from './rpcHelpers';
import {ethers} from 'ethers';

const ACCOUNT_DATA = {
  EMAIL: 'email',
  AVATAR: 'avatar',
};

export default function useWeb3Account(currentChain = DEFAULT_CHAIN) {
  const [accounts, setAccounts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState([]);

  useEffect(() => {
    async function checkForAccounts() {
      const provider = getProvider();
      const connectedAccounts = await provider.listAccounts();
      if (connectedAccounts.length > 0) {
        const accounts = await requestAccounts();
        setAccounts(accounts);
        setCurrentAddress(accounts[0]);
      }
    }
    checkForAccounts();
  }, [currentChain]);

  const getProvider = () => {
    const {ethereum} = window;
    if (!ethereum) {
      setErrorMessage(p => [...p, 'Make sure you have metamask!']);
      return;
    }

    return new ethers.providers.Web3Provider(window.ethereum);
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

  const disconnectWallet = async () => {
    try {
      setCurrentAddress();
      setErrorMessage([]);

      return null;

    } catch (error) {
      console.log(error);
    }
  };

  const getAccountDetails = async (address) => {
    const provider = getProvider();
    const check = ethers.utils.getAddress(address);

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
    } catch (err) {
      console.warn(err.stack)
      return {};
    }
  };

  useEffect(() => {
    const accountChanged = e => {
      setCurrentAddress(e[0]);
    };

    if (window.ethereum) {
      window.ethereum.on(WEB3_EVENTS.ACCOUNTS_CHANGE, accountChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(WEB3_EVENTS.ACCOUNTS_CHANGE, accountChanged);
      }
    };
  }, [currentAddress]);

  const isConnected = Boolean(currentAddress);

  return {
    accounts,
    currentAddress,
    errorMessage,
    getAccounts,
    connectWallet,
    disconnectWallet,
    addRPCToWallet,
    chains: CHAINS,
    getAccountDetails,
    getProvider,
    isConnected,
  };
}
