
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint, discordClientId, walletHost} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {jsonParse, parseQuery, handleDiscordLogin} from '../util.js';
import Modal from './components/modal';

const User = ({address, setAddress, open, setOpen, toggleOpen}) => {
  const [show, setShow] = useState(false);

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
    if (key) {
      iframe.contentWindow.postMessage({action: 'getKey', key: key}, walletHost);
    } else {
      iframe.contentWindow.postMessage({action: 'getAllKeys'}, walletHost);
    }

    var f = async event => {
      if (event.origin !== walletHost) { return; }
      if (event.data.pk) {
        console.log('memonic', event.data.pk);
        const data = await pullUserObject(event.data.pk);
        const {address, error} = data;
        if (address) {
          console.log('User Data', data);
          setAddress(address);
          setShow(false);
        } else {
          setLoginError(String(error).toLocaleUpperCase());
        }
        window.removeEventListener('message', f, false);
      }
    };
    window.addEventListener('message', f);
  };

  const sendDataToWallet = async (key, value) => {
    await launchWallet();
    var message = {action: 'storeKey', key: key, value: value};
    iframe.contentWindow.postMessage(message, walletHost);
  };

  const metaMaskLogin = async e => {
    e.preventDefault();
    e.stopPropagation();
    if (address) {
      toggleOpen('user');
    } else {
      if (!loggingIn) {
        setLoggingIn(true);
        try {
          const {address, profile} = await ceramicApi.login();
          setAddress(address);
          setShow(false);
        } catch (err) {
          console.warn(err);
        } finally {
          setLoggingIn(false);
        }
      }
    }
  };

  const discordLogin = async e => {
    e.preventDefault();
    e.stopPropagation();
    setLoginButtons(false);
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
      const {address, error, mnemonic} = await handleDiscordLogin(code, id);
      if (address) {
        setAddress(address);
        sendDataToWallet('privateKey', mnemonic);
        setShow(false);
      } else {
        setLoginError(String(error).toLocaleUpperCase());
      }
    } else {
      fetchWalletData('privateKey');
    }
  }, [address, setAddress]);

  return (
    <div>
      <iframe name="wallet" width="0" height="0"></iframe>
      <iframe name="walletMessenger" width="0" height="0"></iframe>
      <div className={classnames(styles.user, loggingIn ? styles.loggingIn : null)}
        onClick={async e => {
          e.preventDefault();
          e.stopPropagation();
          if (address) {
            toggleOpen('user');
          } else {
            setLoginButtons(true);
            setOpen(null);
            setOpen('login');
          }
        }}>
        <img src="images/soul.png" className={styles.icon} />
        <div className={styles.name} onClick={e => { showModal(e); }}>
          {loggingIn ? 'Logging in... ' : (address || (loginError || 'Log in'))}

        </div>
      </div>
      { address
        ? <div className={styles.logoutBtn}
          onClick={e => {
            sessionStorage.removeItem('mnemonic');
            setAddress(null);
          }}
        >Logout</div>
        : ''
      }
      {
        open == 'login'
          ? <div className={styles.login_options}>
            {
              loginButtons ? <>
                <Modal onClose={ showModal } show={show}>
                  <div className={styles.loginDiv}>
                    <div className={styles.loginBtn} onClick={ metaMaskLogin }>
                      <div className={styles.loginBtnText}>
                        <img className={styles.loginBtnImg} src="images/metamask.png" alt="metamask" width="28px"/>
                        <span>MetaMask</span>
                      </div>
                    </div>
                    <a href={`https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${window.location.origin}%2Flogin&response_type=code&scope=identify`}>
                      <div className={styles.loginBtn} style={{marginTop: '10px'}}>
                        <div className={styles.loginBtnText}>
                          <img className={styles.loginBtnImg} src="images/discord-dark.png" alt="discord" width="28px"/>
                          <span>Discord</span>
                        </div>
                      </div>
                    </a>
                  </div>
                </Modal>
              </> : ''
            }
          </div>
          : <div></div>}

    </div>
  );
};

export default User;
