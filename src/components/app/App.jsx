
import React, { useState, useEffect, useRef } from 'react';

import MagicMenu from '../../MagicMenu.jsx';
import { defaultAvatarUrl } from '../../../constants';
import dropManager from '../../../drop-manager.js';

import Webaverse from '../../../webaverse.js';
import * as universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';

import { ActionMenu } from '../general/action-menu';
import { Crosshair } from '../general/crosshair';
import { Settings } from '../general/settings';
import { WorldObjectsList } from '../general/world-objects-list';
import { PlayMode } from '../play-mode';
import Header from '../../Header.jsx';

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

export const App = () => {

    const canvasRef = useRef( null );
    const [ app, setApp ] = useState( () => new Webaverse() );

    const [ settingsOpened, setSettingsOpened ] = useState( false );
    const [ worldObjectsListOpened, setWorldObjectsListOpened ] = useState( false );

    //

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef ] );

    //

    return (
        <div className={ styles.App } id="app" >
            <Header app={ app } />
            <ActionMenu app={ app } setSettingsOpened={ setSettingsOpened } setWorldObjectsListOpened={ setWorldObjectsListOpened } />
            <Crosshair />
            <canvas className={ styles.canvas } ref={ canvasRef } id="canvas" />
            <PlayMode />
            <Settings opened={ settingsOpened } setOpened={ setSettingsOpened } />
            <WorldObjectsList opened={ worldObjectsListOpened } setOpened={ setWorldObjectsListOpened } />
        </div>
    );

};
