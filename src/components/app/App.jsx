
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
import { Stats } from '../../Stats.jsx';
import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
import Header from '../../Header.jsx';

import styles from './App.module.css';

// Called immediately on this page load, assuming canvas set
const _startApp = async ( weba, canvas ) => {
    // Bind input to the internal ioManager
    weba.bindInput();
    // Bind interfaces, handles no-ui mode for iframe and show blockchain network name
    weba.bindInterface();
    // Set the current main scene canvas, bind diorama and post processing
    weba.bindCanvas( canvas );
    // Parse the URL and join world based on current scene / room
    universe.handleUrlUpdate();
    // Wait until physics, avatar, audio, etc are ready
    await weba.waitForLoad();
    // Set content loaded
    weba.setContentLoaded();
    // Start the game loop
    await weba.startLoop();
    // Get local player and set
    const localPlayer = metaversefileApi.useLocalPlayer();
    await localPlayer.setAvatarUrl( defaultAvatarUrl );

};

// The current scene the user is in is determined by the URL
const _getCurrentSceneSrc = () => {

    let { src } = parseQuery( window.location.search );

    return src ?? './scenes/' + sceneNames[0];

};

// The current room the user is in is determined by the URL
const _getCurrentRoom = () => {

    const q = parseQuery( window.location.search );
    const { room } = q;
    return room || '';

};

// Main app entry point for the front end
export const App = () => {
    // Reference to the main canvas used to render the scene
    const canvasRef = useRef( null );
    // Reference to the Webaverse app, used everywhere
    const [ app, setApp ] = useState( () => new Webaverse() );
    // Reference to the current scene, can be changed from scene selection menu
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    // Reference to the current room, can be changed from room selection menu
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );

    const [ settingsOpened, setSettingsOpened ] = useState( false );
    const [ worldObjectsListOpened, setWorldObjectsListOpened ] = useState( false );
    const [ mapGenOpened, setMapGenOpened ] = useState( false );

    const _loadUrlState = () => {

        const src = _getCurrentSceneSrc();
        setSelectedScene( src );

        const roomName = _getCurrentRoom();
        setSelectedRoom( roomName );

    };

    // Listen for canvas change and start app when it does
    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef ] );

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
            <MapGen app={ app } opened={ mapGenOpened } />
            <Stats app={ app } />
        </div>
    );

};