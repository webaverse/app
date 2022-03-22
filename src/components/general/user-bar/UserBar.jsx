
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import * as ceramicApi from '../../../../ceramic.js';
import { discordClientId } from '../../../../constants';
import { parseQuery } from '../../../../util.js';
import WebaWallet from '../../wallet';

import { AppContext } from '../../app';

import styles from './user-bar.module.css';

//

export const UserBar = ({ userAddress, setUserAddress, setLoginMethod }) => {

    const { state, setState } = useContext( AppContext );
    const [ loggingIn, setLoggingIn ] = useState( false );
    const [ loginError, setLoginError ] = useState( null );
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState( false );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCharacterBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

    };

    const handleLoginBarClick = () => {

        if ( userAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else {

            setState({ openedPanel: ( state.openedPanel === 'LoginPanel' ? null : 'LoginPanel' ) });

        }

    };

    const handleLogoutBtnClick = () => {

        WebaWallet.logout();
        setUserAddress( null );

    };

    const handleMaskLoginBtnClick = async ( event ) => {

        if ( userAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else {

            if ( ! loggingIn ) {

                setLoggingIn( true );

                try {

                    const { address, profile } = await ceramicApi.login();
                    setUserAddress( address );
                    setLoginMethod('metamask');
                    setState({ openedPanel: null });

                } catch ( err ) {

                    console.warn( err );

                } finally {

                    setLoggingIn( false );

                }

            }

        }

    };

    useEffect( () => {

        const { error, code, id, play, realmId, twitter: arrivingFromTwitter } = parseQuery( window.location.search );

        if ( ! autoLoginRequestMade ) {

            setAutoLoginRequestMade( true );

            if ( code ) {

                setLoggingIn( true );

                WebaWallet.waitForLaunch().then( async () => {

                    const { address, error } = await WebaWallet.loginDiscord( code, id );

                    if ( address ) {

                        setUserAddress( address );
                        setLoginMethod( 'discord' );
                        setState({ openedPanel: null });

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                    window.history.pushState( {}, '', window.location.origin );
                    setLoggingIn( false );

                }); // it may occur that wallet loading is in progress already

            } else {

                WebaWallet.waitForLaunch().then( async () => {

                    const { address, error } = await WebaWallet.autoLogin();

                    if ( address ) {

                        setUserAddress( address );
                        setLoginMethod( 'discord' );
                        setState({ openedPanel: null });

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                }); // it may occur that wallet loading is in progress already

            }

        }

    }, [ userAddress ] );

    //

    return (
        <div className={ classnames( styles.userBar, ( state.openedPanel === 'CharacterPanel' ? styles.hide : null ) ) } onClick={ stopPropagation } >
            <div className={ classnames( styles.user, loggingIn ? styles.loggingIn : null ) } >
                <div className={ styles.userAvatar } onClick={ handleCharacterBtnClick } >
                    <img src="images/user.png" />
                </div>
                <div className={ classnames( styles.userName, styles.btn ) } onClick={ handleCharacterBtnClick } >
                    <div className={ styles.btnText } >Anon  Lv.0</div>
                    <div className={ styles.btnBackground } />
                </div>
                <div className={ classnames( styles.login, styles.btn ) } onClick={ handleLoginBarClick } >
                    <div className={ styles.btnText }>{ loggingIn ? 'Logging in... ' : ( userAddress || ( loginError || 'Log in' ) ) }</div>
                    <div className={ styles.btnBackground } />
                </div>
                <div className={ styles.tabHint } >TAB</div>
                { userAddress ? ( <div className={ styles.logoutBtn } onClick={ handleLogoutBtnClick } >Logout</div> ) : '' }
            </div>

            <div className={ classnames( styles.userLoginMethodsModal, ( state.openedPanel === 'LoginPanel' ? styles.opened : null ) ) } >
                <div className={ styles.methodBtn } onClick={ handleMaskLoginBtnClick } >
                    <div className={ styles.btnText } >
                        <img src="images/metamask.png" alt="metamask" width="28px" />
                        <span>MetaMask</span>
                    </div>
                </div>
                <a href={ `https://discord.com/api/oauth2/authorize?client_id=${ discordClientId }&redirect_uri=${ window.location.origin }%2Flogin&response_type=code&scope=identify` } >
                    <div className={ styles.methodBtn } >
                        <div className={ styles.btnText } >
                            <img src="images/discord-dark.png" alt="discord" width="28px" />
                            <span>Discord</span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );

};
