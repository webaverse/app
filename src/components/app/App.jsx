
import React, { useState, useEffect, useRef } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import sceneNames from '../../../scenes/scenes.json';
import { parseQuery } from '../../../util.js'
import Webaverse from '../../../webaverse.js';
import universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';

import { ActionMenu } from '../general/action-menu';
import { Crosshair } from '../general/crosshair';
import { Settings } from '../general/settings';
import { WorldObjectsList } from '../general/world-objects-list';
import { IoHandler } from '../../IoHandler.jsx';
import { ZoneTitleCard } from '../general/zone-title-card';
import { MapGen } from '../general/map-gen/MapGen.jsx';
import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
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

const _getCurrentSceneSrc = () => {

    const q = parseQuery( window.location.search );
    let { src } = q;

    if ( src === undefined ) {

        src = './scenes/' + sceneNames[0];

    }

    return src;

};

const _getCurrentRoom = () => {

    const q = parseQuery( window.location.search );
    const { room } = q;
    return room || '';

};

export const App = () => {

    const canvasRef = useRef( null );
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );

    const [ settingsOpened, setSettingsOpened ] = useState( false );
    const [ worldObjectsListOpened, setWorldObjectsListOpened ] = useState( false );

    //

    const _loadUrlState = () => {

        const src = _getCurrentSceneSrc();
        setSelectedScene( src );

        const roomName = _getCurrentRoom();
        setSelectedRoom( roomName );

    };

    useEffect( () => {

        const pushstate = e => {

            _loadUrlState();

        };

        const popstate = e => {

            _loadUrlState();
            universe.handleUrlUpdate();

        };

        window.addEventListener('pushstate', pushstate);
        window.addEventListener('popstate', popstate);

        return () => {
            window.removeEventListener('pushstate', pushstate);
            window.removeEventListener('popstate', popstate);
        };

    }, [] );

    useEffect( _loadUrlState, [] );

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef ] );

    //

    return (
        <div className={ styles.App } id="app" >
            <Header app={ app } />
            <canvas className={ styles.canvas } ref={ canvasRef } id="canvas" />
            <Crosshair />
            <ActionMenu app={ app } setSettingsOpened={ setSettingsOpened } setWorldObjectsListOpened={ setWorldObjectsListOpened } />
            <Settings opened={ settingsOpened } setOpened={ setSettingsOpened } />
            <WorldObjectsList opened={ worldObjectsListOpened } setOpened={ setWorldObjectsListOpened } />
            <PlayMode />
            <EditorMode selectedScene={ selectedScene } setSelectedScene={ setSelectedScene } selectedRoom={ selectedRoom } setSelectedRoom={ setSelectedRoom } />
            <IoHandler />
            <ZoneTitleCard app={ app } />
            <MapGen app={ app } />
        </div>
    );

};
