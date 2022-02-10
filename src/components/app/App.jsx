
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import { MagicMenu } from '../editor-mode/magic-menu';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api.js';
import ioManager from '../../../io-manager';
import * as ceramicApi from '../../../ceramic.js';
import WebaWallet from '../wallet';
import { parseQuery } from '../../../util.js';

import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
import { Crosshair } from '../general/crosshair';
import { LoginPopup } from '../general/login-popup';

import styles from './App.module.css';

//

const _startApp = async ( weba, canvas ) => {

    weba.setContentLoaded();

    weba.bindInput();
    weba.bindInterface();
    weba.bindCanvas( canvas );

    await weba.waitForLoad();
    universe.handleUrlUpdate();
    await weba.startLoop();

    const localPlayer = metaversefileApi.useLocalPlayer();
    await localPlayer.setAvatarUrl( defaultAvatarUrl );

};

//

export const App = () => {

    const canvasRef = useRef();
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ magicMenuOpened, setMagicMenuOpened ] = useState( false );

    const [ loginPopupOpened, setLoginOpenPopupOpened ] = useState( false );
    const [ loginInState, setLoginInState ] = useState('');
    const [ loginInMethod, setLoginInMethod ] = useState( null );
    const [ loginButtons, setLoginButtons ] = useState( false );
    const [ loginError, setLoginError ] = useState( null );
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState( false );
    const [ address, setAddress ] = useState( null );
    const [ username, setUserName ] = useState( 'Anonimus' );

    //

    async function auth () {

        const { error, code, id, play, realmId, twitter: arrivingFromTwitter } = parseQuery( window.location.search );

        if ( ! autoLoginRequestMade ) {

            setAutoLoginRequestMade( true );
            let user;

            try {

                user = await ceramicApi.login();

            } catch ( err ) {}

            if ( user && user.address ) {

                setAddress( user.address );
                setLoginInState( 'done' );
                return;

            }

            if ( code ) {

                setLoginInState( 'in-progress' );

                WebaWallet.waitForLaunch().then( async () => {

                    const user = await WebaWallet.loginDiscord( code, id );
                    console.log( user );

                    if ( address ) {

                        setAddress( address );
                        setLoginFrom( 'discord' );
                        setShow( 'done' );

                    } else if ( error ) {

                        setLoginError( String( error ).toLocaleUpperCase() );

                    }

                    console.log( address, error );
                    // window.history.pushState( {}, '', window.location.origin );
                    setLoginInState( 'done' );

                }); // it may occur that wallet loading is in progress already

            } else {

                // setLoginInState( 'in-progress' );

                // WebaWallet.waitForLaunch().then( async () => {

                //     const loginResult = await WebaWallet.autoLogin();

                //     if ( loginResult && address ) {

                //         setAddress( address );
                //         setLoginInState( 'done' );

                //     } else if ( error ) {

                //         setLoginError( String( error ).toLocaleUpperCase() );

                //     }

                // }); // it may occur that wallet loading is in progress already

            }

        }

    };

    async function getProfileInfo () {

        if ( ! address ) return;
        const res = await fetch(`https://nft.webaverse.com/account/${ address }`, {});
        const data = await res.json();

        setUserName( data.name || 'No username' );

    };

    const handleCanvasClick = ( event ) => {

        ioManager['click']( event );

    };

    //

    useEffect( async () => {

        auth();
        getProfileInfo();

    }, [ address ]);

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef.current ] );

    useEffect( () => {

        const _handleAnytimeKey = e => {

            return false;

        };

        const _handleNonInputKey = e => {

            switch ( e.which ) {

                case 191: { // /

                    if ( ! magicMenuOpened && ! ioManager.inputFocused() ) {

                        e.preventDefault();
                        e.stopPropagation();
                        setMagicMenuOpened( true );

                    }

                    return true;

                }

            }

            return false;

        };

        const keydown = e => {

            let handled = false;
            const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);

            if ( ! inputFocused ) {

                handled = _handleNonInputKey(e);

            }

            if ( ! handled ) {

                handled = _handleAnytimeKey(e);

            }

            if ( handled || inputFocused ) {

                // nothing

            } else {

                ioManager.keydown(e);

            }

        };

        window.addEventListener('keydown', keydown);

        return () => {

            window.removeEventListener('keydown', keydown);

        };

    }, [] );

    //

    return (
        <div className={ styles.App }>
            <MagicMenu open={ magicMenuOpened } setOpen={ setMagicMenuOpened } />
            <canvas className={ styles.canvas } ref={ canvasRef } onClick={ handleCanvasClick } />
            <Crosshair />
            <PlayMode username={ username } loginInState={ loginInState } setLoginOpenPopupOpened={ setLoginOpenPopupOpened } />
            <LoginPopup open={ loginPopupOpened } setOpen={ setLoginOpenPopupOpened } loginInState={ loginInState } setLoginInState={ setLoginInState } setAddress={ setAddress } />
        </div>
    );

};
