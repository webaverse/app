
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
import {discordClientId} from '../constants';
import {parseQuery} from '../util.js';
import Modal from './components/modal';
import WebaWallet from './components/wallet';

const User = ({address, setAddress, open, setOpen, toggleOpen, setLoginFrom, setUserData}) => {
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
          setLoginFrom('metamask');
        } catch (err) {
          console.warn(err);
        } finally {
          setLoggingIn(false);
        }
      }
    }
  };

  useEffect(() => {
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
        WebaWallet.waitForLaunch().then(async () => {
          WebaWallet.loginDiscord(code, id).then(userData => {
            const {address, error} = userData;
            if (address) {
              setAddress(address);
              setLoginFrom('discord');
              setShow(false);
              setUserData(userData);
            } else if (error) {
              setLoginError(String(error).toLocaleUpperCase());
            }
            window.history.pushState({}, '', window.location.origin);
            setLoggingIn(false);
          });
        }); // it may occur that wallet loading is in progress already
      } else {
        WebaWallet.waitForLaunch().then(async () => {
          WebaWallet.autoLogin().then(userData => {
            const {address, error} = userData;
            if (address) {
              setAddress(address);
              setLoginFrom('discord');
              setShow(false);
              setUserData(userData);
            } else if (error) {
              setLoginError(String(error).toLocaleUpperCase());
            }
            window.history.pushState({}, '', window.location.origin);
            setLoggingIn(false);
          });
        }); // it may occur that wallet loading is in progress already
      }
    }
  }, [address, setAddress]);

  return (
    <></>
  );
};

export default User;
