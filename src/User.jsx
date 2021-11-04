
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {jsonParse, parseQuery, handleDiscordLogin} from '../util.js';

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
      if(code && id) {
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
        <div className={styles.name}>{loggingIn ? 'Logging in... ' : (address || (loginError || 'Log in'))}
        </div>
      </div>
      {
        userRef.isComponentVisible
          ? <div className={styles.login_options}>
            {
              loginButtons ? <>
                <a className={styles.metamask} onClick={ metaMaskLogin }>
                  <img src="./images/metamask.png" width="30px" alt="" />
                  <span className={styles.metamask_text}
                  >MetaMask</span>
                </a>
                <a className={styles.discord} 
                target="_blank"
                href="https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fstaging.webaverse.com%2Flogin&response_type=code&scope=identify"
                // onClick={discordLogin}
                >
                  <img src="./images/discord.png" width="30px" alt="" />
                  <span className={styles.discord_text}>Discord</span>
                </a></> : ''
            }
            {
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
            }

          </div>
          : <div></div>}

    </div>
  );
};



export default User;
