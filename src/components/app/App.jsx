
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
import { Claims } from '../play-mode/claims';
import { Tokens } from '../play-mode/tokens';
import Header from '../../Header.jsx';

import styles from './App.module.css';
import { Login } from '../general/login/Login';

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
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );
    const [ loginMethod, setLoginMethod ] = useState( null );
    const [ loginAddress, setLoginAddress ] = useState( null );

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

        const pointerlockchange = ( event ) => {

            const { pointerLockElement } = event.data;

            if ( pointerLockElement && state.openedPanel !== null ) {

                setState({ openedPanel: null });

            }

        };

        cameraManager.addEventListener( 'pointerlockchange', pointerlockchange );

        return () => {

            cameraManager.removeEventListener( 'pointerlockchange', pointerlockchange );

        };

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
            <AppContext.Provider value={{ state, setState, app }} >
                <Header setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } />
                <canvas className={ styles.canvas } ref={ canvasRef } />
                <Crosshair />
                <Login
                    loginAddress={ loginAddress }
                    setLoginAddress={ setLoginAddress }
                    loginMethod={ loginMethod }
                    setLoginMethod={ setLoginMethod }
                />
                <ActionMenu />
                <Settings />
                <WorldObjectsList setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } />
                <PlayMode />
                <Claims />
                <EditorMode selectedScene={ selectedScene } setSelectedScene={ setSelectedScene } selectedRoom={ selectedRoom } setSelectedRoom={ setSelectedRoom } />
                <IoHandler />
                <ZoneTitleCard />
                <MapGen />
                <LoadingBox />
                <DragAndDrop />
                <Stats app={ app } />
                <Tokens
                    nfts={ nfts }
                    hacks={ hacks }
                    setNfts={ setNfts }
                    setLoginMethod={ setLoginMethod }
                    loginAddress={ loginAddress }
                />
            </AppContext.Provider>
        </div>
    );

};
