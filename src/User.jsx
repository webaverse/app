
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint, discordClientId, walletHost} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {jsonParse, parseQuery, handleDiscordLogin} from '../util.js';
import Modal from "./components/modal";

function useComponentVisible(initialIsVisible, fn) {
  const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
  const ref = useRef(null);

  const handleClickOutside = event => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsComponentVisible(false);
      fn();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  return {ref, isComponentVisible, setIsComponentVisible};
}
const User = ({address, setAddress, open, setOpen, toggleOpen}) => {

  const [show, setShow] = useState(false);

  const showModal = async e => {
    e.preventDefault();
    setShow(!show);
  } 

  const discordRef = useComponentVisible(false);
  const metaMaskRef = useComponentVisible(false);
  const emailRef = useComponentVisible(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginButtons, setLoginButtons] = useState(false);

  const [walletData, setWalletData] = useState([]);
  const [discordUrl, setDiscordUrl] = useState('');
  const [loginError, setLoginError] = useState(null);

  const userRef = useComponentVisible(false, ()=>{
    setLoginError(false);
    setDiscordUrl('');
  });

  useEffect(() => {
    if(address && sessionStorage.getItem('temp_token')) {
      fetchWalletData();
    }
  });

  var popUp = null;
  var iframe = null;
  var walletMessenger = null;

  const openPopup = async (token) => {
    popUp = window.open(walletHost, '', "height=800,width=600");

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      if(event.data == 'received') {
        sendMessage(token);
      }
    }, false);
  }

  const fetchWalletData = async () => {
    iframe = window.open(walletHost, 'wallet')

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      if(event.data == 'received') {
        getKeys();
      }
    }, false);
  }

  // function for sending data to wallet
  const sendDataToWallet = async (data) => {
    walletMessenger = window.open(walletHost, 'walletMessenger')

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      if(event.data == 'received') {
        sendData(data);
      }
    }, false);
  }

  const sendData = async (data) => {

    // data format
    // {'key': 'key-name', 'value': 'any-value'} 

    var message = JSON.stringify({'temp_token': sessionStorage.getItem('temp_token'), 'token': address,
    'data': data});
    walletMessenger.postMessage(message, walletHost);

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      if(event.data.temp_token) {
        sessionStorage.setItem("temp_token", event.data.temp_token);
      }
      window.removeEventListener('message', ()=>{});
      walletMessenger.close();

    }, false);
  }

  const getKeys = async () => {

    iframe.postMessage(JSON.stringify({'temp_token': sessionStorage.getItem('temp_token'), 'token': address}), walletHost);

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      setWalletData(event.data.data)

      if(event.data.temp_token) {
        sessionStorage.setItem("temp_token", event.data.temp_token);
      }
      window.removeEventListener('message', ()=>{});
      iframe.close();

    }, false);
  }

  const sendMessage = async (token) => {

    popUp.postMessage(JSON.stringify({'token': token}), walletHost);

    window.addEventListener("message", (event) => {
      if (event.origin !== walletHost)
        return;
    
      setWalletData(event.data.data);

      if(event.data.temp_token) {
        sessionStorage.setItem("temp_token", event.data.temp_token);
      }

      window.removeEventListener('message', ()=>{});
      popUp.close();

    }, false);
  }

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
          openPopup(address);
          setShow(false);

          userRef.setIsComponentVisible(false);
        } catch (err) {
          console.warn(err);
        } finally {
          setLoggingIn(false);
        }
      }
    }
  }

  const discordLogin = async e => {
    e.preventDefault();
    e.stopPropagation();
    setLoginButtons(false);
    discordRef.setIsComponentVisible(true);
  } 
  
  useEffect(async () => {

      const {
        error,
        error_description,
        code,
        id,
        play,
        realmId,
        twitter: arrivingFromTwitter,
      } = typeof window !== 'undefined' ? parseQuery(window.location.search) : {};
      if(code) {
        const {address, error} = await handleDiscordLogin(code, id);
        if(address) {
          setAddress(address);
          openPopup(address);
          setShow(false);
        }
        else {
          setLoginError(String(error).toLocaleUpperCase());
        }
      }
  }, [address, setAddress]);



  return (
    <div ref={userRef.ref}>
       <iframe name="wallet" width="0" height="0"></iframe>
       <iframe name="walletMessenger" width="0" height="0"></iframe>
      <div className={classnames(styles.user, loggingIn ? styles.loggingIn : null)}
        onClick={async e => {
          e.preventDefault();
          e.stopPropagation();
          if (address) {
            toggleOpen('user');
            userRef.setIsComponentVisible(false);
          }else{
            userRef.setIsComponentVisible(true);
            setLoginButtons(true);
            discordRef.setIsComponentVisible(false);
            metaMaskRef.setIsComponentVisible(false);
          }
        }}>
        <img src="images/soul.png" className={styles.icon} />
        <div className={styles.name} onClick={e => { showModal(e); }}>
          {loggingIn ? 'Logging in... ' : (address || (loginError || 'Log in'))}  

        </div>
      </div>
      { address ?
        <div className={styles.logoutBtn}
        onClick={e => {
         sessionStorage.removeItem('temp_token');
         setAddress(null)
        }}
        >Logout</div>
       : ''
      }
      {
        userRef.isComponentVisible
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
            {/* {
              discordRef.isComponentVisible
                ? <div className={styles.location}>
                  <div className={styles['input-wrap']}>
                    <div className={styles.location}>
                      <div className={styles.row}>
                        <div className={styles['button-wrap']}>
                          <button className={classnames(styles.button, styles.primary)} onClick={handleDiscordLogin}>
                            <img src="images/webarrow.svg" />
                          </button>
                        </div>
                        <div className={styles['input-wrap']}>
                          <input type="text" className={styles.input} placeholder="Enter Login Url" value={discordUrl}
                            onChange={e => setDiscordUrl(e.target.value)}
                            onKeyPress={
                              async event => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (event.key === 'Enter') {
                                  const {address, error} = await handleDiscordLogin(discordUrl);
                                  if(address)
                                    setAddress(address);
                                  else
                                    setLoginError(String(error).toLocaleUpperCase());
                                }
                               }
                            } />
                          <img src="images/webpencil.svg" className={classnames(styles.background, styles.green)} />
                        </div>
                      </div>

                    </div>
                  </div>
                </div> : ''
            } */}

          </div>
          : <div></div>}

    </div>
  );
};



export default User;
