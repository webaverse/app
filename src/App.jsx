
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../constants';

import { MagicMenu } from './components/magic-menu';
import Webaverse from '../webaverse.js';
import * as universe from '../universe.js';
import metaversefileApi from '../metaversefile-api.js';

import { Inventory } from './components/inventory';
import { Hotbar } from './components/hotbar';
import { ActionMenu } from './components/action-menu';
import { LocationMenu } from './components/location-menu';
import { PlayerZone } from './components/player-zone';
import { CharacterOverview } from './components/character-overview';
import { Crosshair } from './components/crosshair';

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

function RootNode () {

    const canvasRef = useRef();
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ characterOverviewOpen, setCharacterOverviewOpen ] = useState( false );

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
            <Inventory openCharacterOverview={ setCharacterOverviewOpen } />
            <Hotbar />
            <PlayerZone />
            <Crosshair />
            <CharacterOverview open={ characterOverviewOpen } setOpen={ setCharacterOverviewOpen } />
        </div>
    );

};

export default RootNode;
