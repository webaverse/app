import { useState, useEffect } from 'react';
import { CHAINS, DEFAULT_CHAIN, WEB3_EVENTS } from './web3-constants';

import { connectToNetwork, addRPCToWallet, requestAccounts } from './rpcHelpers';
import { ethers } from 'ethers';

const ACCOUNT_DATA = {
  EMAIL: 'email',
  AVATAR: 'avatar',
};

export default function useWeb3Account(currentChain = DEFAULT_CHAIN) {
  const [accounts, setAccounts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [walletType, setWalletType] = useState('metamask');          // metamask or phantom
  const [currentPhantomAddress, setCurrentPhantomAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState([]);

  useEffect(() => {
    async function checkForAccounts() {
      const { ethereum } = window;
      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    const { ethereum } = window;
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
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setErrorMessage(p => [...p, 'Make sure you have metamask!']);
        alert('Make sure you have metamask!'); // TODO: notification using errorMessage
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

  const getAccountDetails = async address => {
    const provider = new ethers.getDefaultProvider('mainnet');
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

      return { ...accountDetails, name };
    } catch (err) {
      console.warn(err.stack);
      return {};
    }
  };

  const getPhantomProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    setErrorMessage(p => [...p, 'Make sure you have phantom wallet!']);
    return;
  };

  const connectPhantomWallet = async () => {
    const provider = getPhantomProvider(); // see "Detecting the Provider"
    try {
      const resp = await provider.connect();
      // setCurrentPhantomAddress(resp.publicKey.toString());
      setCurrentAddress(resp.publicKey.toString());
      setErrorMessage([]);
      return resp.publicKey.toString();
    } catch (err) {
      console.log(err)
      // { code: 4001, message: 'User rejected the request.' }
    }
  }

  const disconnectPhantomWallet = async () => {
    try {
      const provider = getPhantomProvider();
      provider.on("disconnect", () => {
        setCurrentAddress(null);
      });
      return null;

    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const accountChanged = e => {
      setCurrentAddress(e[0]);
    };

    if (window.ethereum) {
      window.ethereum.on(WEB3_EVENTS.ACCOUNTS_CHANGE, accountChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          WEB3_EVENTS.ACCOUNTS_CHANGE,
          accountChanged,
        );
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
    getPhantomProvider,
    connectPhantomWallet,
    disconnectPhantomWallet,
    walletType,
    setWalletType
  };
}
