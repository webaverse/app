
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import WebaWallet from '../../wallet';
import { parseQuery } from '../../../../util.js';
import { LoginPopup } from '../login-popup';

import styles from './player-zone.module.css';

//

export const PlayerZone = () => {

    const [ loginPopupOpened, setLoginOpenPopupOpened ] = useState( false );
    const [ loggingIn, setLoggingIn ] = useState( false );
    const [ loginButtons, setLoginButtons ] = useState( false );
    const [ loginError, setLoginError ] = useState( null );
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState( false );
    const [ address, setAddress ] = useState( null );

    //

    const handleLoginBtnClick = ( event ) => {

        event.stopPropagation();
        setLoginOpenPopupOpened( true );

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

    }, [ address, setAddress ]);

    //

    return (
        <div className={ styles.playerZone } >

            {
                ( loggingIn ) ? (
                    'loggin in'
                ) : (
                    ( address ) ? (
                        <div className={ styles.avatar } />
                    ) : (
                        <div className={ styles.loginBtn } onClick={ handleLoginBtnClick }>Login</div>
                    )
                )
            }

            <div className={ classNames( styles.progressBar, styles.manaBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <div className={ classNames( styles.progressBar, styles.healthBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <LoginPopup open={ loginPopupOpened } setOpen={ setLoginOpenPopupOpened } />

        </div>
    );

};
