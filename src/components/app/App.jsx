
import React, { useState, useEffect, useRef, createContext } from 'react';

// import MagicMenu from '../../MagicMenu.jsx';
import { defaultAvatarUrl } from '../../../constants';
// import dropManager from '../../../drop-manager.js';
import {ZoneTitleCard} from '../general/zone-title-card/ZoneTitleCard.jsx';

import sceneNames from '../../../scenes/scenes.json';
import { parseQuery } from '../../../util.js'
import Webaverse from '../../../webaverse.js';
import universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';
import cameraManager from '../../../camera-manager';
import gameManager from '../../../game';

import { ActionMenu } from '../general/action-menu';
import { Crosshair } from '../general/crosshair';
import { Settings } from '../general/settings';
import { WorldObjectsList } from '../general/world-objects-list';
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

export const AppContext = createContext();

export const App = () => {

    const [ state, setState ] = useState({
        settings: {
            opened:     false,
            activeTab:  'general'
        },
        world: {
            opened:     false
        },
        diorama: {
            opened:     false
        }
    });

    const canvasRef = useRef( null );
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );

    //

    const _loadUrlState = () => {

        const src = _getCurrentSceneSrc();
        setSelectedScene( src );

        const roomName = _getCurrentRoom();
        setSelectedRoom( roomName );

    };

    useEffect( () => {

        const closeAll = () => {

            setState( state => ({
                ...state,
                settings:   { ...state.settings, opened: false },
                world:      { ...state.world, opened: false },
                diorama:    { ...state.diorama, opened: false },
            }) );

        };

        gameManager.addEventListener( 'CloseAllPanels', closeAll );

        return () => {

            gameManager.addEventListener( 'CloseAllPanels', closeAll );

        };

    }, [] );

    useEffect( () => {

        const pushstate = e => {

            _loadUrlState();

        };

        const popstate = e => {

            _loadUrlState();
            universe.handleUrlUpdate();

        };

        _loadUrlState();

        window.addEventListener( 'pushstate', pushstate );
        window.addEventListener( 'popstate', popstate );

        return () => {

            window.removeEventListener( 'pushstate', pushstate );
            window.removeEventListener( 'popstate', popstate );

        };

    }, [] );

    useEffect( () => {

        if ( canvasRef.current ) {

            _startApp( app, canvasRef.current );

        }

    }, [ canvasRef ] );

    //

    useEffect( () => {

        const toggleOpen = () => {

            if ( state.settings.opened ) return;
            gameManager.dispatchEvent( new CustomEvent( 'CloseAllPanels' ) );

            const newValue = ! state.world.opened;

            if ( newValue ) {

                cameraManager.exitPointerLock();

            } else {

                cameraManager.requestPointerLock();

            }

            setState({ ...state, world: { ...state.world, opened: newValue } });

        };

        gameManager.addEventListener( 'ToggleWorldPanel', toggleOpen );

        return () => {

            gameManager.removeEventListener( 'ToggleWorldPanel', toggleOpen );

        };

    }, [ state ] );

    //

    return (
        <div className={ styles.App } id="app" >
            <AppContext.Provider value={{ state, setState }} >
                <Header app={ app } />
                <canvas className={ styles.canvas } ref={ canvasRef } id="canvas" />
                <Crosshair />
                <ActionMenu app={ app } />
                <Settings />
                <WorldObjectsList />
                <PlayMode />
                <EditorMode selectedScene={ selectedScene } setSelectedScene={ setSelectedScene } selectedRoom={ selectedRoom } setSelectedRoom={ setSelectedRoom } />
                <ZoneTitleCard app={ app } />
            </AppContext.Provider>
        </div>
    );

};
