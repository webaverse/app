
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import { MagicMenu } from '../editor-mode/magic-menu';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api.js';

import { Inventory } from '../play-mode/inventory';
import { Hotbar } from '../play-mode/hotbar';
import { ActionMenu } from '../play-mode/action-menu';
import { LocationMenu } from '../play-mode/location-menu';
import { PlayerZone } from '../play-mode/player-zone';
import { CharacterOverview } from '../play-mode/character-overview';
import { Crosshair } from '../play-mode/crosshair';
import { Settings } from '../play-mode/settings';

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
    const [ characterOverviewOpen, setCharacterOverviewOpen ] = useState( false );
    const [ settingsOpen, setSettingsOpen ] = useState( false );

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
            <ActionMenu openSettings={ setSettingsOpen } />
            <LocationMenu />
            <Inventory openCharacterOverview={ setCharacterOverviewOpen } />
            <Hotbar />
            <PlayerZone />
            <Crosshair />
            <CharacterOverview open={ characterOverviewOpen } setOpen={ setCharacterOverviewOpen } />
            <Settings open={ settingsOpen } setOpen={ setSettingsOpen } />
        </div>
    );

};
