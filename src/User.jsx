import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import { discordClientId } from '../constants';
import { parseQuery } from '../util.js';

// import Modal from './components/modal';
import WebaWallet from './components/wallet';

import blockchainManager from '../blockchain-manager.js';
import { AppContext } from './components/app';

import styles from './User.module.css';

import * as sounds from '../sounds.js';
import Chains from './components/web3/chains';

//

export const User = ({ setLoginFrom }) => {

    const { state, setState, account, chain } = useContext( AppContext );
    const [ensName, setEnsName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [ loggingIn, setLoggingIn ] = useState(false);
    const [ loginError, setLoginError ] = useState(null);
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState(false);
    const { isConnected, currentAddress, connectWallet, errorMessage, wrongChain, getAccounts, getAccountDetails } = account;
    const { selectedChain } = chain;
    const [address, setAddress] = useState();
    async function _setAddress(address) {
        await handleAddress(address);
        setAddress(address);
    }

    /* const showModal = ( event ) => {

        event.preventDefault();
        // setShow( ! show );

        setState({ openedPanel: 'LoginPanel' });

    }; */

    const openUserPanel = e => {

        setState({ openedPanel: 'UserPanel' });
    
    };

    const handleCancelBtnClick = () => {

        setState({ openedPanel: null });

        sounds.playSoundName('menuBack');

    };

    async function handleAddress(address) {
        const {name, avatar} = await getAccountDetails();

        if(name) setEnsName(name);
        if(avatar) setAvatarUrl(avatar);

    }

    useEffect(()=>{
        if(!currentAddress) return;
        handleAddress(currentAddress);
    }, [currentAddress, selectedChain])

    const metaMaskLogin = async ( event ) => {

        event.preventDefault();
        event.stopPropagation();

        /* if ( address ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else { */

            if ( ! loggingIn ) {

                setLoggingIn( true );

                try {

                    const address = await connectWallet();
                    setLoginFrom('metamask');
                    // setShow(false);
                    // setLoginFrom('metamask');

                } catch (err) {

                    console.warn(err);

                } finally {

                    setState({ openedPanel: null });

                    setLoggingIn(false);

                }

            }

        // }

    };
    
    useEffect( () => {

        const { error, code, id, play, realmId } = parseQuery( window.location.search );

        //

        const discordAutoLogin = async () => {

            const { address, error } = await WebaWallet.loginDiscord( code, id );

            if ( address ) {

                await _setAddress( address );
                // setAddress( address );
                setLoginFrom( 'discord' );
                // setShow( false );

            } else if ( error ) {

                setLoginError( String( error ).toLocaleUpperCase() );

            }

            window.history.pushState( {}, '', window.location.origin );
            setLoggingIn( false );

        };

        const metamaskAutoLogin = async () => {

            const address = await getAccounts();

            if ( address ) {

                setLoginFrom( 'metamask' );

            } else if ( error ) {

                setLoginError( String( error ).toLocaleUpperCase() );

            }

        };

        //
        if ( ! autoLoginRequestMade ) {
            setAutoLoginRequestMade( true );

            if ( code ) {

                setLoggingIn( true );

                if ( WebaWallet.launched ) {

                    discordAutoLogin();

                } else {

                    WebaWallet.waitForLaunch().then( discordAutoLogin );

                }

            } else {

                if ( WebaWallet.launched ) {

                    metamaskAutoLogin();

                } else {

                    WebaWallet.waitForLaunch().then( metamaskAutoLogin );

                }

            }

        }

    }, [ currentAddress ] );

    //

    const _triggerClickSound = () => {

        sounds.playSoundName('menuClick');

    };
    
    //

    const open = state.openedPanel === 'LoginPanel';
    const loggedIn = isConnected;

    //

    return (
        <div
            className={ classnames(
                styles.user,
                open ? styles.open : null,
                loggedIn ? styles.loggedIn : null,
                loggingIn ? styles.loggingIn : null,
            ) }
        >
            <div className={styles.keyWrap} onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                if (!loggedIn) {

                    if ( !open ) {

                        setState({ openedPanel: 'LoginPanel' });

                    } else {
                        setState({ openedPanel: null });
                    }

                    sounds.playSoundName('menuNext');

                }
            }} onMouseEnter={e => {
                
                _triggerClickSound();
            
            }}>
                <div className={styles.key}>
                    <div className={styles.bow}>
                        <img className={styles.icon} src="./images/log-in.svg" />
                    </div>
                    <div className={styles.blade}>
                        <div className={styles.background} />
                        <div className={styles.text}>ログイン Log in</div>
                    </div>
                </div>
            </div>

            <div className={styles.loggingInPlaceholder}>Logging in</div>

            <div
                className={styles.userWrap}
            >   
                {loggedIn && <Chains />}
                <div
                    className={styles.userBar}
                    onClick={openUserPanel}
                >
                    {avatarUrl ? (
                        <div className={styles.avatarUrl}>
                            <img className={styles.img} src={avatarUrl} crossOrigin='Anonymous' />
                        </div>
                    ) : null}
                    <div
                        className={[styles.address, avatarUrl ? styles.avatarPadRight : undefined].join(' ')}
                    >{ensName || address || currentAddress || ''} <img className={styles.verifiedIcon} src="./images/verified.svg" /></div>
                </div>
                {/* <div className={styles.logoutBtn}
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        WebaWallet.logout();
                        _setAddress(null);
                    }}
                >Logout</div> */}
            </div>

            <div className={ classnames(
                styles.userLoginMethodsModal,
                open ? styles.opened : null,
            ) } >
                <div className={ styles.title } >
                    <span>Log in</span>
                    {/* <div className={ styles.background } /> */}
                </div>
                <div className={ styles.methodBtn } onClick={ metaMaskLogin } onMouseEnter={ _triggerClickSound } >
                    <img src="images/metamask.png" alt="metamask" width="28px" />
                    <span className={ styles.methodBtnText } >MetaMask</span>
                </div>
            </div>
                {/* <a
                    href={ `https://discord.com/api/oauth2/authorize?client_id=${ discordClientId }&redirect_uri=${ window.location.origin }%2Flogin&response_type=code&scope=identify` }
                    onMouseEnter={ _triggerClickSound }
                >
                    <div className={ styles.methodBtn } >
                        <img src="images/discord.png" alt="discord" width="28px" />
                        <span className={ styles.methodBtnText } >Discord</span>
                    </div>
                </a>
                <div className={ styles.methodBtn } onClick={ handleCancelBtnClick } onMouseEnter={ _triggerClickSound } >
                    <span className={ styles.methodBtnText } >Cancel</span>
                </div>
            </div>

            {/* <Modal onClose={ showModal } show={open && !loggingIn}>
                <div className={styles.login_options}>
                
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
                </div>
            </Modal> */}
        </div>
    );

};
