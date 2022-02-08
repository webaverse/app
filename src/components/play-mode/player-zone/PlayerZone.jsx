
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import * as ceramicApi from '../../../../ceramic.js';
import WebaWallet from '../../wallet';
import { parseQuery } from '../../../../util.js';
import { LoginPopup } from '../login-popup';

import styles from './player-zone.module.css';

//

export const PlayerZone = () => {

    const [ loginPopupOpened, setLoginOpenPopupOpened ] = useState( false );
    const [ loginInState, setLoginInState ] = useState('');
    const [ loginInMethod, setLoginInMethod ] = useState( null );
    const [ loginButtons, setLoginButtons ] = useState( false );
    const [ loginError, setLoginError ] = useState( null );
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState( false );
    const [ address, setAddress ] = useState( null );
    const [ username, setUserName ] = useState( 'Anonimus' );

    //

    const handleLoginBtnClick = ( event ) => {

        event.stopPropagation();
        setLoginOpenPopupOpened( true );

    };

    useEffect( async () => {

        const { error, code, id, play, realmId, twitter: arrivingFromTwitter } = parseQuery( window.location.search );

        if ( ! autoLoginRequestMade ) {

            setAutoLoginRequestMade( true );

            const user = await ceramicApi.login();

            if ( user && user.address ) {

                setUserName( user.address );
                setAddress( user.address );
                setLoginInState( false );
                return;

            }

            if ( code ) {

                setLoginInState( 'in-progress' );

                WebaWallet.waitForLaunch().then( async () => {

                    const { address, error } = await WebaWallet.loginDiscord( code, id );

                    if ( address ) {

                        setAddress( address );
                        setLoginFrom( 'discord' );
                        setShow( false );

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                    // window.history.pushState( {}, '', window.location.origin );
                    setLoginInState( 'done' );

                }); // it may occur that wallet loading is in progress already

            } else {

                setLoginInState( 'in-progress' );

                WebaWallet.waitForLaunch().then( async () => {

                    const loginResult = await WebaWallet.autoLogin();

                    if ( loginResult && address ) {

                        setAddress( address );
                        setLoginInState( 'done' );

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                }); // it may occur that wallet loading is in progress already

            }

        }

    }, [ address ]);

    //

    return (
        <div className={ styles.playerZone } >

            {
                ( loginInState === 'in-progress' ) ?(
                    <div className={ styles.loginBtn }>Login in...</div>
                ) : (
                    ( address ) ? (
                        <div className={ styles.avatar } />
                    ) : (
                        <div className={ styles.loginBtn } onClick={ handleLoginBtnClick }>Login</div>
                    )
                )
            }

            <div className={ styles.username }>{ username }</div>

            <div className={ classNames( styles.progressBar, styles.manaBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <div className={ classNames( styles.progressBar, styles.healthBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <LoginPopup open={ loginPopupOpened } setOpen={ setLoginOpenPopupOpened } loginInState={ loginInState } setLoginInState={ setLoginInState } setAddress={ setAddress } />

        </div>
    );

};
