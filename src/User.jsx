
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

  const [discordUrl, setDiscordUrl] = useState('');
  const [loginError, setLoginError] = useState(null);

  const userRef = useComponentVisible(false, ()=>{
    setLoginError(false);
    setDiscordUrl('');
  });

  // var popUp = null;
  var iframe = null;
  var walletMessenger = null;

  // const openPopup = async (mnemonic) => {
  //   popUp = window.open(walletHost, '', "height=800,width=600");

  //   var f = function(event){
  //     if (event.origin !== walletHost)
  //       return;
    
  //     if(event.data == 'received') {
  //       sendMessage(mnemonic);
  //       window.removeEventListener("message", f, false);
  //     }      
  //   }
  //   window.addEventListener("message", f);

  // }

  // const sendMessage = async (mnemonic) => {

  //   popUp.postMessage(JSON.stringify({'p_mnemonic': mnemonic}), walletHost);

  //   var f = function(event){
  //     if (event.origin !== walletHost)
  //     return;
  
  //     if(event.data.mnemonic && event.data.Success) {
  //       sessionStorage.setItem("mnemonic", event.data.mnemonic);
  //       window.removeEventListener("message", f, false);
  //       popUp.close();
  //     }   
  //   }
  //   window.addEventListener("message", f);
  // }

  const fetchWalletData = async (key) => {
    iframe = window.open(walletHost, 'wallet')

    var f = function(event){
      if (`${event.origin}/weba-wallet` !== walletHost)
      return;

      if(event.data == 'received') {
        getKeys(key);
        window.removeEventListener("message", f, false);
      } 
    }
    window.addEventListener("message", f);
  }

  const getKeys = async (key) => {
    if(key) {
      iframe.postMessage(JSON.stringify({action: 'getKey', key: key}), walletHost);
    }
    else {
      iframe.postMessage(JSON.stringify({action: 'getAllKeys'}), walletHost);
    }

    var f = function(event){

      if (`${event.origin}/weba-wallet` !== walletHost)
      return;
  
      if(event.data.privateKey) {
        const address = getAddressFromMnemonic(event.data.privateKey);
        if(address) {
          setAddress(address);
        }
        window.removeEventListener("message", f, false);
        iframe.close();
      }
      else {
        window.removeEventListener("message", f, false);
        iframe.close();
      }
    }
    window.addEventListener("message", f);
  }

  // function for sending data to wallet
  const sendDataToWallet = async (key, value) => {

    walletMessenger = window.open(walletHost, 'walletMessenger')

    var f = function(event){
      if (`${event.origin}/weba-wallet` !== walletHost)
        return;

      if(event.data == 'received') {
        sendData(key, value);
        window.removeEventListener("message", f, false);
      }
    }
    window.addEventListener("message", f);
  }

  const sendData = async (key, value) => {
    var message = JSON.stringify({'action': 'storeKey', 'key': key, 'value': value});
    walletMessenger.postMessage(message, walletHost);

    var f = function(event){
      if (`${event.origin}/weba-wallet` !== walletHost)
        return;

      window.removeEventListener("message", f, false);
      walletMessenger.close();
      }
      window.addEventListener("message", f);
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
          // sendDataToWallet('privateKey', mnemonic)
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
        const {address, error, mnemonic} = await handleDiscordLogin(code, id);
        if(address) {
          setAddress(address);
          sendDataToWallet('privateKey', mnemonic)
          setShow(false);
        }
        else {
          setLoginError(String(error).toLocaleUpperCase());
        }
      }
      else {
        fetchWalletData('privateKey');
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
         sessionStorage.removeItem('mnemonic');
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
