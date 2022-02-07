
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import { MagicMenu } from '../editor-mode/magic-menu';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api.js';
import ioManager from '../../../io-manager';

import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
import { Crosshair } from '../play-mode/crosshair';

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

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef.current ] );

    //

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
        <div className={styles.App} id="app">
            <MagicMenu open={ magicMenuOpened } setOpen={ setMagicMenuOpened } />
            <canvas id="canvas" className={ styles.canvas } ref={ canvasRef } />
            <Crosshair />
            <PlayMode />
        </div>
    );

};
