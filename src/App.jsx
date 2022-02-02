
import React, { useState, useEffect, useRef } from 'react';

import MagicMenu from './MagicMenu.jsx';
import { defaultAvatarUrl } from '../constants';

import Webaverse from '../webaverse.js';
import * as universe from '../universe.js';
import metaversefileApi from '../metaversefile-api.js';

import { Inventory } from './components/inventory';
import { Hotbar } from './components/hotbar/Hotbar.jsx';
import { ActionMenu } from './components/action-menu';
import { LocationMenu } from './components/location-menu';

import styles from './App.module.css';
import { PlayerZone } from './components/player-zone/PlayerZone.jsx';

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

const Crosshair = () => (

    <div className={styles.crosshair} id="crosshair">
        <img src="./assets/crosshair.svg" width={ 30 } height={ 30 } />
    </div>

);

function RootNode () {

    const canvasRef = useRef();
    const [app, setApp] = useState( () => new Webaverse() );

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
            <ActionMenu />
            <LocationMenu />
            <Inventory />
            <Hotbar />
            <PlayerZone />
            {/* <Crosshair /> */ }
        </div>
    );

};

export default RootNode;
