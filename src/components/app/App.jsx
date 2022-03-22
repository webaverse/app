
import React, { useState, useEffect, useRef, createContext } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import sceneNames from '../../../scenes/scenes.json';
import { parseQuery } from '../../../util.js'
import Webaverse from '../../../webaverse.js';
import universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';
import cameraManager from '../../../camera-manager';

import { ActionMenu } from '../general/action-menu';
import { Crosshair } from '../general/crosshair';
import { Settings } from '../general/settings';
import { WorldObjectsList } from '../general/world-objects-list';
import { IoHandler } from '../general/io-handler';
import { ZoneTitleCard } from '../general/zone-title-card';
import { MapGen } from '../general/map-gen/MapGen.jsx';
import { LoadingBox } from '../../LoadingBox.jsx';
import { DragAndDrop } from '../../DragAndDrop.jsx';
import { Stats } from '../../Stats.jsx';
import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
import Header from '../../Header.jsx';

import styles from './App.module.css';
import { UserBar } from '../general/user-bar/UserBar';

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

    const [ state, setState ] = useState({ openedPanel: null });

    const canvasRef = useRef( null );
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ selectedApp, setSelectedApp ] = useState( null );
    const [ userAddress, setUserAddress ] = useState( null );
    const [ loginMethod, setLoginMethod ] = useState( null );
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

        if ( state.openedPanel && state.openedPanel !== 'ChatPanel' && cameraManager.pointerLockElement ) {

            cameraManager.exitPointerLock();

        }

    }, [ state.openedPanel ] );

    useEffect( () => {

        const pushstate = e => {

            _loadUrlState();

        };

        const popstate = e => {

            _loadUrlState();
            universe.handleUrlUpdate();

        };

        window.addEventListener( 'pushstate', pushstate );
        window.addEventListener( 'popstate', popstate );

        return () => {

            window.removeEventListener( 'pushstate', pushstate );
            window.removeEventListener( 'popstate', popstate );

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
            <AppContext.Provider value={{ state, setState, app }}>
                <Header setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } userAddress={ userAddress } loginMethod={ loginMethod } />
                <canvas className={ styles.canvas } ref={ canvasRef } />
                <UserBar userAddress={ userAddress } setUserAddress={ setUserAddress } setLoginMethod={ setLoginMethod } />
                <Crosshair />
                <ActionMenu />
                <Settings />
                <WorldObjectsList setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } />
                <PlayMode />
                <EditorMode selectedScene={ selectedScene } setSelectedScene={ setSelectedScene } selectedRoom={ selectedRoom } setSelectedRoom={ setSelectedRoom } />
                <IoHandler />
                <ZoneTitleCard />
                <MapGen />
                <LoadingBox />
                <DragAndDrop />
                <Stats app={ app } />
            </AppContext.Provider>
        </div>
    );

};
