
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import * as ceramicApi from '../../../../ceramic.js';
import wallet from '../../wallet';
import { discordClientId } from '../../../../constants';
import { parseQuery } from '../../../../util.js';
import WebaWallet from '../../wallet';
import { MetamaskManager } from '../../../../blockchain-lib';

import { AppContext } from '../../app';
import { HealthBar } from './HealthBar';

import styles from './user-bar.module.css';

//

export const UserBar = ({ userAddress, setUserAddress, setLoginMethod }) => {

    const { state, setState } = useContext( AppContext );
    const [ loginError, setLoginError ] = useState( null );

    const metamask = new MetamaskManager();

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCharacterBtnClick = () => {

        if ( ! userAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

        } else {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        }

    };

    const handleLoginBarClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'LoginPanel' ? null : 'LoginPanel' ) });

    };

    const handleLogoutBtnClick = () => {

        WebaWallet.logout();
        setUserAddress( null );

    };


    const sendWabawalletMessage = (method, data = {}) => {

        const message = { method, data };
        wallet.iframe.contentWindow.postMessage( JSON.stringify( message ), "*" );

    };

    const handleMaskLoginBtnClick = async () => {

        if ( userAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else {

            const metamask = new MetamaskManager();

            try {

                const signedMessage = await metamask.connect();
                const jwt = await metamask.login( signedMessage );
                sendWabawalletMessage('initiate_wallet', { jwt });
                sendWabawalletMessage('get_profile', {});

            } catch ( error ) {

                console.error( error.message );

            }

        }

    };

    const handleCancelBtnClick = () => {

        setState({ openedPanel: null });

    };

    //

    useEffect( () => {

        const receiveWebawalletMessage = ( event ) => {

            if ( ! event.data || event.origin + '/' !== wallet.src ) { // Adding '/' at the end to compare origin and src

                return;

            }

            const res = JSON.parse( event.data );
            const { type, method, data, error } = res;

            if ( error ) {

                console.error( error );
                return;

            }

            if ( type === 'event' ) {

                console.log( `Got event: ${ method }`, { data } );

            } else if ( type === 'response' ) {

                console.log( `Got response for: ${ method }`, { data } );

            }

        };

        window.addEventListener( 'message', receiveWebawalletMessage, false );

        //

        return () => {

            window.removeEventListener( 'message', receiveWebawalletMessage );

        };

    }, [] );

    // useEffect( () => {

    //     const { error, code, id, play, realmId, twitter: arrivingFromTwitter } = parseQuery( window.location.search );

    //     if ( ! autoLoginRequestMade ) {

    //         setAutoLoginRequestMade( true );

    //         if ( code ) {

    //             setLoggingIn( true );

    //             WebaWallet.waitForLaunch().then( async () => {

    //                 const { address, error } = await WebaWallet.loginDiscord( code, id );

    //                 if ( address ) {

    //                     setUserAddress( address );
    //                     setLoginMethod( 'discord' );
    //                     setState({ openedPanel: null });

    //                 } else if ( error ) {

    //                     setLoginError( String( error ).toLocaleUpperCase() );

    //                 }

    //                 window.history.pushState( {}, '', window.location.origin );
    //                 setLoggingIn( false );

    //             }); // it may occur that wallet loading is in progress already

    //         } else {

    //             WebaWallet.waitForLaunch().then( async () => {

    //                 const { address, error } = await WebaWallet.autoLogin();

    //                 if ( address ) {

    //                     setUserAddress( address );
    //                     setLoginMethod( 'discord' );
    //                     setState({ openedPanel: null });

    //                 } else if ( error ) {

    //                     setLoginError( String( error ).toLocaleUpperCase() );

    //                 }

    //             }); // it may occur that wallet loading is in progress already

    //         }

    //     }

    // }, [ userAddress ] );

    //

    return (
        <div className={ classnames( styles.userBar, ( state.openedPanel === 'CharacterPanel' ? styles.hide : null ) ) } onClick={ stopPropagation } >
            <div className={ styles.user } >
                <div className={ styles.userAvatar } onClick={ handleCharacterBtnClick } >
                    <img src="images/user.png" />
                </div>
                <div className={ classnames( styles.userName, styles.btn ) } onClick={ handleCharacterBtnClick } >
                    <div className={ styles.btnText } >{ userAddress ? userAddress : 'Anon  Lv.0' }</div>
                    <div className={ styles.btnBackground } />
                </div>
                {
                    userAddress ? (
                        <div className={ classnames( styles.loginBtn, styles.btn, styles.shaded ) } onClick={ handleLogoutBtnClick } >
                            <div className={ styles.btnText }>Logout</div>
                            <div className={ styles.btnBackground } />
                        </div>
                    ) : (
                        <div className={ classnames( styles.btn, styles.shaded ) } onClick={ handleLoginBarClick } >
                            <div className={ styles.btnText }>{ loginError || 'Log in' }</div>
                            <div className={ styles.btnBackground } />
                        </div>
                    )
                }
                <div className={ styles.tabHint } >TAB</div>
                <HealthBar />
            </div>

            <div className={ classnames( styles.userLoginMethodsModal, ( state.openedPanel === 'LoginPanel' ? styles.opened : null ) ) } >
                <div className={ styles.title } >
                    <span>Log in</span>
                    <div className={ styles.background } />
                </div>
                <div className={ styles.methodBtn } onClick={ handleMaskLoginBtnClick } >
                    <img src="images/metamask.png" alt="metamask" width="28px" />
                    <span className={ styles.methodBtnText } >MetaMask</span>
                </div>
                <a href={ `https://discord.com/api/oauth2/authorize?client_id=${ discordClientId }&redirect_uri=${ window.location.origin }%2Flogin&response_type=code&scope=identify` } >
                    <div className={ styles.methodBtn } >
                        <img src="images/discord.png" alt="discord" width="28px" />
                        <span className={ styles.methodBtnText } >Discord</span>
                    </div>
                </a>
                <div className={ styles.methodBtn } onClick={ handleCancelBtnClick } >
                    <span className={ styles.methodBtnText } >Cancel</span>
                </div>
            </div>
        </div>
    );

};
