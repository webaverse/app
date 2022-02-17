
import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import logo from '../../logo.svg';
import MagicMenu from '../../MagicMenu.jsx';
import {defaultAvatarUrl} from '../../../constants';
import Header from '../../Header.jsx';
import Footer from '../../Footer.jsx';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';
const { useLocalPlayer } = metaversefileApi;

import { Crosshair } from '../general/crosshair';
import styles from './App.module.css';
import { PlayMode } from '../play-mode/index.jsx';
import dropManager from '../../../drop-manager.js';

//

const _startApp = async ( weba, canvas ) => {

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
            <canvas id="canvas" className={ styles.canvas } ref={ canvasRef } />
            <PlayMode />
        </div>
    );

};
