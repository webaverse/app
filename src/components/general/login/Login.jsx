
import React, { useEffect, useState, useContext } from 'react';

import { AppContext } from '../../app';

import styles from './login.module.css';

//

export const Login = ({ loginAddress, setLoginAddress, setLoginSource }) => {

    const { state } = useContext( AppContext );
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState( false );
    const [ loginError, setLoginError ] = useState( null );
    const [ loggingIn, setLoggingIn ] = useState( false );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleLoginBtnClick = () => {

        if ( loginAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else {

            setState({ openedPanel: 'LoginPanel' });

        }

    };

    const handleLogoutBtnClick = () => {

        WebaWallet.logout();
        setLoginAddress( null );

    };

    const handleMetamaskLoginBtn = async () => {

        if ( loginAddress ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else {

            if ( ! loggingIn ) {

                setLoggingIn( true );

                try {

                    const { address, profile } = await ceramicApi.login();
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

    useEffect( () => {

        const { error, code, id, play, realmId, twitter: arrivingFromTwitter } = parseQuery( window.location.search );

        if ( ! autoLoginRequestMade ) {

            setAutoLoginRequestMade( true );

            if ( code ) {

                setLoggingIn( true );

                WebaWallet.waitForLaunch().then( async () => {

                    const { address, error } = await WebaWallet.loginDiscord( code, id );

                    if ( address ) {

                        setAddress( address );
                        setLoginFrom( 'discord' );
                        setShow( false );

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

                        setAddress( address );
                        setLoginFrom( 'discord' );
                        setShow( false );

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                }); // it may occur that wallet loading is in progress already

            }

        }

    }, [ loginAddress ] );

    //

    return (
        <div onClick={ stopPropagation } >
            <div className={ classnames( styles.user, loggingIn ? styles.loggingIn : null ) } onClick={ handleLoginBtnClick } >
                <img src="images/soul.png" className={ styles.userIcon } />
                <div className={ styles.name } >
                    { loggingIn ? 'Logging in... ' : ( loginAddress || ( loginError || 'Log in' ) ) }
                </div>
            </div>

            { loginAddress ? ( <div className={ styles.logoutBtn } onClick={ handleLogoutBtnClick } >Logout</div> ) : '' }

            <div className={ classnames( styles.loginBtnsMenu, ( state.openedPanel === 'LoginPanel' ) ) } >
                <div className={styles.loginDiv}>
                    <div className={styles.loginBtn} onClick={ handleMetamaskLoginBtn }>
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
        </div>
    );

};
