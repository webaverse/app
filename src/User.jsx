
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint, discordClientId, walletHost} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {pullUserObject, parseQuery, handleDiscordLogin} from '../util.js';
import Modal from './components/modal';

const User = ({address, setAddress, open, setOpen, toggleOpen, setUserData}) => {
  const [show, setShow] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  const showModal = async e => {
    e.preventDefault();
    setShow(!show);
  };

  const [loggingIn, setLoggingIn] = useState(false);
  const [loginButtons, setLoginButtons] = useState(false);

  const [discordUrl, setDiscordUrl] = useState('');
  const [loginError, setLoginError] = useState(null);

  var iframe = null;
  var walletMessenger = null;

  const launchWallet = () => {
    return new Promise((resolve, reject) => {
      iframe = document.querySelector(`iframe[src^="${walletHost}"]`);

      // else create new iframe
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.width = '0px';
        iframe.height = '0px';
        document.body.appendChild(iframe);
        iframe.src = walletHost;
      } else {
        resolve();
        console.log('...........Resolving...............');
      }
      const t = setTimeout(() => {
        reject('Failed to load wallet in 30 seconds');
      }, 30 * 1000);

      const f = event => {
        if (`${event.origin}` !== walletHost) { return; }
        if (event.data.method === 'wallet_launched') {
          console.log('...........Resolving...............');
          window.removeEventListener('message', f, false);
          clearTimeout(t);
          resolve();
        }
      };
      window.addEventListener('message', f);
    });
  };

  const fetchWalletData = async key => {
    console.log('About to fetch the wallet data');
    // check for existing iframe
    await launchWallet();
    getKeys(key);
  };

  const getKeys = async key => {
    console.log('Trying to fetch the key');
    if (key) {
      console.log('Posting the message to the weba wallet');
      console.log('Do we have the iframe ?', iframe);
      window.abeersIframe = iframe;
      iframe.contentWindow.postMessage({action: 'getKey', key: key}, walletHost);
    } else {
      iframe.contentWindow.postMessage({action: 'getAllKeys'}, walletHost);
    }

    var f = async (event) => {
      if (event.origin !== walletHost) { return; }
      console.log('event.data', event.data);
      if (event.data.pk) {
        const data = await pullUserObject(event.data.pk);
        data.loadout = {
          tokens: [{
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }, {
            instanceId: 'blah',
          }],
        };
        setUserData(data);
        const {address, error, mnemonic} = data;
        if (address) {
          setAddress(address);
        }
        window.removeEventListener('message', f, false);
      }
    };
    window.addEventListener('message', f);
  };

  window.getKeys = getKeys;

  const sendData = async (key, value) => {
    await launchWallet();
    var message = {action: 'storeKey', key: key, value: value};
    iframe.contentWindow.postMessage(message, walletHost);
  };

  useEffect(async () => {
    const {
      error,
      code,
      id,
      play,
      realmId,
      twitter: arrivingFromTwitter,
    } = typeof window !== 'undefined' ? parseQuery(window.location.search) : {};
    if (code) {
      const data = await handleDiscordLogin(code, id);
      /** Dummy modify data here to think that we are getting inventory */
      data.loadout = {
        tokens: [{
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }, {
          instanceId: 'blah',
        }],
      };
      setUserData(data);
      const {address, error, mnemonic} = data;

      if (address) {
        setAddress(address);
        sendData('pk', mnemonic);
        setShow(false);
      } else {
        setLoginError(String(error).toLocaleUpperCase());
      }
    } else {
      if (!loginInProgress) {
        setLoginInProgress(true);
        console.log('***********************.....................*****************************');
        fetchWalletData('pk');
      }
    }
  }, [address, setAddress]);

  return (
    <></>
  );
};

export default User;
