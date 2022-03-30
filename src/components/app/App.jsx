
import React, { useState, useEffect, useRef, createContext } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import metaversefile from 'metaversefile';
import game from '../../../game';
import sceneNames from '../../../scenes/scenes.json';
import { parseQuery } from '../../../util.js'
import Webaverse from '../../../webaverse.js';
import universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';
import cameraManager from '../../../camera-manager';
import { world } from '../../../world';

import { ActionMenu } from '../general/action-menu';
import { Crosshair } from '../general/crosshair';
import { Settings } from '../general/settings';
import { WorldObjectsList } from '../general/world-objects-list';
import { IoHandler, registerIoEventHandler, unregisterIoEventHandler } from '../general/io-handler';
import { ZoneTitleCard } from '../general/zone-title-card';
import { MapGen } from '../general/map-gen/MapGen.jsx';
import { LoadingBox } from '../general/loading-box';
import { DragAndDrop } from '../general/drag-and-drop';
import { Stats } from '../general/stats/Stats.jsx';
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

    const [ state, setState ] = useState({ openedPanel: null });

    const canvasRef = useRef( null );
    const npcManager = metaversefile.useNpcManager();
    const [ app, setApp ] = useState( () => new Webaverse() );
    const [ selectedApp, setSelectedApp ] = useState( null );
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );
    const [ npcs, setNpcs ] = useState( npcManager.npcs );

    //

    const selectApp = ( app, physicsId, position ) => {

        game.setMouseSelectedObject( app, physicsId, position );

    };

    const _loadUrlState = () => {

        const src = _getCurrentSceneSrc();
        setSelectedScene( src );

        const roomName = _getCurrentRoom();
        setSelectedRoom( roomName );

    };

    useEffect( () => {

        npcManager.addEventListener( 'npcadd', ( event ) => {

            const { player } = event.data;
            const newNpcs = npcs.concat([ player ]);
            setNpcs( newNpcs );

        });

        npcManager.addEventListener('npcremove', ( event ) => {

            const { player } = event.data;
            const newNpcs = npcs.slice().splice( npcs.indexOf( player ), 1 );
            setNpcs( newNpcs );

        });

    }, []);


    useEffect( () => {

        if ( state.openedPanel && state.openedPanel !== 'ChatPanel' && cameraManager.pointerLockElement ) {

            cameraManager.exitPointerLock();

        }

    }, [ state.openedPanel ] );

    useEffect( () => {

        const handleClick = () => {

            const hoverObject = game.getMouseHoverObject();

            if ( hoverObject ) {

                const physicsId = game.getMouseHoverPhysicsId();
                const position = game.getMouseHoverPosition();
                selectApp( hoverObject, physicsId, position );
                return false;

            }

            return true;

        };

        registerIoEventHandler( 'click', handleClick );

        return () => {

            unregisterIoEventHandler( 'click', handleClick );

        };

    }, [] );

    useEffect( () => {

        const update = e => {

            setApps( world.appManager.getApps().slice() );

        };

        world.appManager.addEventListener( 'appadd', update );
        world.appManager.addEventListener( 'appremove', update );

    }, [] );

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

    const onDragOver = ( event ) => {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

    };

    const onDragStart = ( event ) => {

        // console.log( 'drag start', event );

    };

    const onDragEnd = ( event ) => {

        // console.log( 'drag end', event );

    };

    //

    return (
        <div className={ styles.App } id="app" onDragStart={ onDragStart } onDragEnd={ onDragEnd } onDragOver={ onDragOver } >
            <AppContext.Provider value={{ state, setState, app, setSelectedApp, selectedApp, npcs }} >
                <Header setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } />
                <canvas className={ styles.canvas } ref={ canvasRef } />
                <Crosshair />
                <ActionMenu />
                <Settings />
                <WorldObjectsList
                    setSelectedApp={ setSelectedApp }
                    selectedApp={ selectedApp }
                />
                <PlayMode />
                <EditorMode
                    selectedScene={ selectedScene }
                    setSelectedScene={ setSelectedScene }
                    selectedRoom={ selectedRoom }
                    setSelectedRoom={ setSelectedRoom }
                />
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
