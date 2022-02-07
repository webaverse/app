
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import { MagicMenu } from '../editor-mode/magic-menu';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api.js';

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

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef.current ] );

    //

    return (
        <div className={styles.App} id="app">
            <MagicMenu open={ false } />
            <canvas id="canvas" className={ styles.canvas } ref={ canvasRef } />
            <Crosshair />
            <PlayMode />
        </div>
    );

};
