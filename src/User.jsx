
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint, discordAuthUrl} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {jsonParse, parseQuery, handleDiscordLogin} from '../util.js';
import Modal from "./components/modal";

let userObject;

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
          // console.log('login', {address, profile});
          setAddress(address);
          localStorage.setItem('loginToken', address);

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

    const storedLoginToken = localStorage.getItem("loginToken");

    if(storedLoginToken) {  
      setAddress(storedLoginToken);
    }

    else {
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
          console.log('address', address)
          setAddress(address);
          localStorage.setItem('loginToken', address);
        }
        else {
          setLoginError(String(error).toLocaleUpperCase());
        }

        // debugger;
      }


      // handleDiscordLogin(code, id)
      // console.log(code,id);
      // debugger;
    }
  }, [address, setAddress]);



  return (
    <div ref={userRef.ref}>
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
        <div className={styles.name} onClick={e => { showModal(e); }}>{loggingIn ? 'Logging in... ' : (address || (loginError || 'Log in'))}
        </div>
      </div>
      {
        userRef.isComponentVisible
          ? <div className={styles.login_options}>
            {
              loginButtons ? <>
                <Modal onClose={ showModal } show={show}>
                  <div style={{display: 'flex'}}>
                    {/* <h2 style={{color: '#e1aad9'}}>Webaverse Logo</h2> */}
                    <img src="https://webaverse.com/webaverse.png" alt="" width="80px"/>
                    <p style={{marginLeft: '20px', color: '#d70060', fontSize: '24px'}}>Webaverse</p>
                  </div>
                  <div style={{width: '100%', display: 'flex', marginTop: '30px'}}>
                    <div style={{width: '40%'}}>
                    <div className={styles.specialBtnDiv2}>
                      <div className={styles.specialBtnDiv}>
                        <button className={styles.specialBtn} onClick={ metaMaskLogin }>MetaMask</button>
                      </div>              
                    </div>
                    <div style={{marginTop: '10px'}} className={styles.specialBtnDiv2}>
                      <div className={styles.specialBtnDiv}>
                        <a href={discordAuthUrl}>
                        <button className={styles.specialBtn}>Discord</button>
                        </a>
                      </div>              
                    </div>
                    </div>
                    <div style={{width: '60%', marginLeft: '40px', color: '#e1aad9'}}>
                      Log in and experience our emmersive 3D universe.
                    </div>
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
