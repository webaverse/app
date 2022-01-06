
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
import {discordClientId} from '../constants';
import {parseQuery} from '../util.js';
import Modal from './components/modal';
import WebaWallet from './components/wallet';

const User = ({address, setAddress, open, setOpen, toggleOpen, setLoginFrom}) => {
  const [show, setShow] = useState(false);

  const showModal = async e => {
    e.preventDefault();
    setShow(!show);
  };

  const [loggingIn, setLoggingIn] = useState(false);
  const [loginButtons, setLoginButtons] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [autoLoginRequestMade, setAutoLoginRequestMade] = useState(false);

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
          setLoginFrom('metamask');
          setShow(false);
          // setLoginFrom('metamask');
        } catch (err) {
          console.warn(err);
        } finally {
          setLoggingIn(false);
        }
      }
    }
  };

  useEffect(async () => {
    const {
      error,
      code,
      id,
      play,
      realmId,
      twitter: arrivingFromTwitter,
    } = parseQuery(window.location.search);
    if (!autoLoginRequestMade) {
      setAutoLoginRequestMade(true);
      if (code) {
        setLoggingIn(true);
        await WebaWallet.waitForLoad(); // it may occur that wallet loading is in progress already
        const {address, error} = await WebaWallet.loginDiscord(code, id);

        if (address) {
          setAddress(address);
          // setLoginFrom('discord');
          setShow(false);
        } else if (error) {
          setLoginError(String(error).toLocaleUpperCase());
        }
        setLoggingIn(false);
      } else {
        await WebaWallet.waitForLoad(); // it may occur that wallet loading is in progress already
        const {address, error} = await WebaWallet.autoLogin();

        if (address) {
          setAddress(address);
          // setLoginFrom('discord');
          setShow(false);
        } else if (error) {
          setLoginError(String(error).toLocaleUpperCase());
        }
      }
    }
  }, [address, setAddress]);

  return (
    <div>
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
            e.preventDefault();
            e.stopPropagation();
            WebaWallet.logout();
            setAddress(null);
          }}
        >Logout</div>
        : ''
      }
      {
        open === 'login'
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
