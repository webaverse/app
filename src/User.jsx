
import React, {useState, Component, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './Header.module.css';
import * as ceramicApi from '../ceramic.js';
// import styles from './User.module.css';
import {storageHost, accountsHost, tokensHost, loginEndpoint} from '../constants';
import {contracts, getAddressFromMnemonic} from '../blockchain.js';
import {jsonParse, parseQuery} from '../util.js';

let userObject;

function useComponentVisible(initialIsVisible) {
  const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
  const ref = useRef(null);

  const handleClickOutside = event => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsComponentVisible(false);
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

async function contentIdToStorageUrl(id) {
  if (typeof id === 'number') {
    const hash = await contracts.mainnetsidechain.NFT.methods.getHash(id + '').call();
    return `${storageHost}/${hash}`;
  } else if (typeof id === 'string') {
    return id;
  } else {
    return null;
  }
}

async function pullUserObject(loginToken) {
  const address = getAddressFromMnemonic(loginToken.mnemonic);
  const res = await fetch(`${accountsHost}/${address}`);
  const result = await res.json();
  // console.log('pull user object', result);
  let {name, avatarId, avatarName, avatarExt, avatarPreview, loadout, homeSpaceId, homeSpaceName, homeSpaceExt, homeSpaceFileName, homeSpacePreview, ftu} = result;
  loadout = jsonParse(loadout, Array(8).fill(null));

  const avatarNumber = parseInt(avatarId);
  const avatarUrl = await contentIdToStorageUrl(!isNaN(avatarNumber) ? avatarNumber : avatarId);
  const homeSpaceNumber = parseInt(homeSpaceId);
  const homeSpaceUrl = await contentIdToStorageUrl(!isNaN(homeSpaceNumber) ? homeSpaceNumber : homeSpaceId);

  const inventory = await (async () => {
    const res = await fetch(`${tokensHost}/${address}`);
    const tokens = await res.json();
    return tokens;
  })();

  // menuActions.setInventory(inventory);

  userObject = {
    name,
    avatar: {
      id: avatarId,
      name: avatarName,
      ext: avatarExt,
      preview: avatarPreview,
      url: avatarUrl,
    },
    loadout,
    inventory,
    homespace: {
      id: homeSpaceId,
      name: homeSpaceName,
      ext: homeSpaceExt,
      preview: homeSpacePreview,
      url: homeSpaceUrl,
    },
    ftu,
  };
  return userObject;
}

const handleDiscordLogin = async discordUrl => {
  if (!discordUrl) {
    return;
  }
  const urlSearchParams = new URLSearchParams(new URL(discordUrl).search);
  const {id, code} = Object.fromEntries(urlSearchParams.entries());
  let res = await fetch(loginEndpoint + `?discordid=${encodeURIComponent(id)}&discordcode=${encodeURIComponent(code)}`, {
    method: 'POST',
  });

  res = await res.json();
  if (!res.error) {
    return await pullUserObject(res);
  } else {
    console.warn('Unable to login ', res.error);
  }

  // debugger;
};

const User = ({address, setAddress, open, setOpen, toggleOpen}) => {
  const userRef = useComponentVisible(false);
  const discordRef = useComponentVisible(false);
  const metaMaskRef = useComponentVisible(false);
  const emailRef = useComponentVisible(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginButtons, setLoginButtons] = useState(false);

  const [discordUrl, setDiscordUrl] = useState('');

  return (
    <div ref={userRef.ref}>
      <div className={classnames(styles.user, loggingIn ? styles.loggingIn : null)}
        onClick={async e => {
          e.preventDefault();
          e.stopPropagation();
          userRef.setIsComponentVisible(true);
          setLoginButtons(true);
          discordRef.setIsComponentVisible(false);
          metaMaskRef.setIsComponentVisible(false);
        }}>
        <img src="images/soul.png" className={styles.icon} />
        <div className={styles.name}>{loggingIn ? 'Logging in... ' : (address || 'Log in')}
        </div>
      </div>
      {
        userRef.isComponentVisible
          ? <div className={styles.login_options}>
            {
              loginButtons ? <>
                <a className={styles.metamask} onClick={async e => {
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
                      } catch (err) {
                        console.warn(err);
                      } finally {
                        setLoggingIn(false);
                      }
                    }
                  }
                } }>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/2048px-MetaMask_Fox.svg.png" width="30px" alt="" />
                  <span className={styles.metamask_text}
                  >MetaMask</span>
                </a>
                <a className={styles.discord} onClick={async e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLoginButtons(false);
                  discordRef.setIsComponentVisible(true);
                } }>
                  <img src="https://www.freepnglogos.com/uploads/discord-logo-png/concours-discord-cartes-voeux-fortnite-france-6.png" width="30px" alt="" />
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
                                  const {address} = await handleDiscordLogin(discordUrl);
                                  setAddress(address);
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
