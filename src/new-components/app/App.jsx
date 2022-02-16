
import React, { useState, useEffect, useRef } from 'react';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api.js';
import { defaultAvatarUrl } from '../../../constants';

import Header from '../../Header.jsx';
import Footer from '../../Footer.jsx';
import { Crosshair } from '../general/crosshair';

import styles from './App.module.css';
import { PlayMode } from '../play-mode/index.jsx';

//

const _startApp = async (weba, canvas) => {

    weba.setContentLoaded();

    weba.bindInput();
    weba.bindInterface();
    weba.bindCanvas(canvas);

    await weba.waitForLoad();
    universe.handleUrlUpdate();
    await weba.startLoop();

    const localPlayer = metaversefileApi.useLocalPlayer();
    await localPlayer.setAvatarUrl(defaultAvatarUrl);

};

export const App = () => {

    const canvasRef = useRef();
    const [ app, setApp ] = useState(() => new Webaverse());

    useEffect(() => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef.current ]);

    //

    return (
        <div className={ styles.App } id="app">
            <Header app={ app } />
            <Crosshair />
            <canvas className={ styles.canvas } ref={ canvasRef } />
            <PlayMode />
        </div>
    );

};
