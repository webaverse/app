
import React, { useState, useEffect, useRef, createContext } from 'react';
import * as THREE from 'three';

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
import { Quests } from '../play-mode/quests';
import { MapGen } from '../general/map-gen/MapGen.jsx';
import { LoadingBox } from '../../LoadingBox.jsx';
import { FocusBar } from '../../FocusBar.jsx';
import { DragAndDrop } from '../../DragAndDrop.jsx';
import { Stats } from '../../Stats.jsx';
import { PlayMode } from '../play-mode';
import { EditorMode } from '../editor-mode';
import Header from '../../Header.jsx';
import QuickMenu from '../../QuickMenu.jsx';

import styles from './App.module.css';
import '../../fonts.css';

//

const _startApp = async ( weba, canvas ) => {

    weba.bindInput();
    weba.bindInterface();
    weba.bindCanvas( canvas );

    await weba.waitForLoad();
    universe.handleUrlUpdate();
    await weba.startLoop();

    const localPlayer = metaversefileApi.useLocalPlayer();
    await localPlayer.setAvatarUrl( defaultAvatarUrl );

    weba.setContentLoaded();

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

const _getCurrentContract = () => {

    const q = parseQuery( window.location.search );
    const { eth } = q;
    return eth || '';

};

export const AppContext = createContext();

const useWebaverseApp = (() => {
  let webaverse = null;
  return () => {
        if ( webaverse === null ) {
            webaverse = new Webaverse();
        }
        return webaverse;
  };
})();

const playerPos = { x: -1000, z: -1000 };
const gridCellSize = 1.5;
const appsGrid = new Map();
const loadedAppsPool = [];
const _vec3 = new THREE.Vector3();
let totalApps = 1;
let lastAppAddTime = 0;
let lastAppRemoveTime = 0;
const appAddDelay = 100;

const cubic = (P0, P1, P2, P3, t) => {

    const x0 = P0.x;
    const y0 = P0.y;

    const x1 = P1.x;
    const y1 = P1.y;

    const x2 = P2.x;
    const y2 = P2.y;

    const x3 = P3.x;
    const y3 = P3.y;

    const y = (t) =>
        Math.pow(1 - t, 3) * y0 +
        3 * Math.pow(1 - t, 2) * t * y1 +
        3 * (1 - t) * Math.pow(t, 2) * y2 +
        Math.pow(t, 3) * y3;

    const x = (t) =>
        Math.pow(1 - t, 3) * x0 +
        3 * Math.pow(1 - t, 2) * t * x1 +
        3 * (1 - t) * Math.pow(t, 2) * x2 +
        Math.pow(t, 3) * x3;

    // const valX = x(t);
    return y(t);

};

//

export const App = () => {

    const [ state, setState ] = useState({ openedPanel: null });

    const canvasRef = useRef( null );
    const app = useWebaverseApp();
    const [ selectedApp, setSelectedApp ] = useState( null );
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );
    const [ contractId, setContractId ] = useState( _getCurrentContract() );
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );

    const localPlayer = metaversefileApi.useLocalPlayer();

    //

    const selectApp = ( app, physicsId, position ) => {

        game.setMouseSelectedObject( app, physicsId, position );

    };

    const _loadUrlState = () => {

        const src = _getCurrentSceneSrc();
        setSelectedScene( src );

        const roomName = _getCurrentRoom();
        setSelectedRoom( roomName );

        const contractId = _getCurrentContract();
        setContractId( contractId );

    };

    const loadFewApps = () => {

        for ( let i = 0; i < 6; i ++ ) {

            ( async () => {

                const app = await metaversefile.createAppAsync({
                    start_url: '/@proxy/eth://' + contractId + '/' + totalApps
                });

                loadedAppsPool.push( app );

            }) ();

            totalApps ++;

        }

    };

    useEffect( () => {

        if ( ! contractId ) return;

        const loop = async () => {

            requestAnimationFrame( loop );
            if ( ! app.contentLoaded ) return;

            let x = Math.round( playerPos.x / gridCellSize );
            let z = Math.round( playerPos.z / gridCellSize );

            if ( x !== Math.round( localPlayer.position.x / gridCellSize ) || z !== Math.round( localPlayer.position.z / gridCellSize ) ) {

                playerPos.x = Math.round( localPlayer.position.x / gridCellSize );
                playerPos.z = Math.round( localPlayer.position.z / gridCellSize );

                const cellX = playerPos.x;
                const cellZ = playerPos.z;

                const loadBlockSize = 1;

                for ( let bi = cellX - loadBlockSize; bi <= cellX + loadBlockSize; bi ++ ) {

                    for ( let bj = cellZ - loadBlockSize; bj <= cellZ + loadBlockSize; bj ++ ) {

                        if ( appsGrid.has( bi + '=' + bj ) ) continue;

                        if ( ! loadedAppsPool.length ) {

                            appsGrid.set( bi + '=' + bj, { app: null, state: 'loading', animation: '', animationProgress: 0 } );
                            loadFewApps();

                        } else {

                            appsGrid.set( bi + '=' + bj, { app: loadedAppsPool.pop(), state: 'prepared', animation: '', animationProgress: 0 } );

                        }

                    }

                }

            }

            //

            appsGrid.forEach( ( item, blockId ) => {

                let app = item.app;
                const x = ( + blockId.split('=')[0] ) * gridCellSize;
                const z = ( + blockId.split('=')[1] ) * gridCellSize;

                _vec3.set( x, 0, z );
                const dist = _vec3.sub( localPlayer.position ).length();

                if ( dist > 3 * gridCellSize ) {

                    // app needs to be hidden

                    if ( item.state !== 'hidden' && Date.now() - lastAppRemoveTime > appAddDelay && item.animation !== 'hiding' ) {

                        app.userData.targetPos = { x: x - 100, z: z };
                        item.state = 'hidden';
                        item.animation = 'hiding';
                        lastAppRemoveTime = Date.now();
                        item.animationProgress = 0;
                        console.log('remove');

                    }

                } else {

                    if ( item.state === 'loading' && loadedAppsPool.length ) {

                        item.app = loadedAppsPool.pop();
                        item.state = 'prepared';
                        app = item.app;

                    }

                    if ( Date.now() - lastAppAddTime > appAddDelay && item.animation !== 'showing' ) {

                        if ( item.state === 'prepared' ) {

                            app.position.set( x + 100, 1, z );
                            app.updateMatrixWorld( true );
                            lastAppAddTime = Date.now();
                            console.log('add');

                        }

                        if ( item.state === 'prepared' || item.state === 'hidden' ) {

                            app.userData.targetPos = { x: x, z: z };
                            metaversefile.addApp( item.app );
                            item.animation = 'showing';
                            item.state = 'visible';
                            item.animationProgress = 0;

                        }

                    }

                }

                if ( ! item.app ) return;

                if ( item.animation === 'showing' || item.animation === 'hiding' ) {

                    item.animationProgress += 0.005;
                    let coef = 0;

                    if ( item.animation === 'showing' ) {

                        coef = cubic( { x: 0, y: 0 }, { x: 0.85, y: 0.0 }, { x: 0.15, y: 1 }, { x: 1, y: 1 }, item.animationProgress );

                    } else {

                        coef = 1 - cubic( { x: 1, y: 1 }, { x: 0.15, y: 1 }, { x: 0.85, y: 0.0 }, { x: 0, y: 0 }, item.animationProgress );

                    }

                    app.position.x = app.userData.targetPos.x * coef + ( 1 - coef ) * app.position.x;
                    app.position.z = app.userData.targetPos.z * coef + ( 1 - coef ) * app.position.z;
                    app.updateMatrixWorld( true );

                }

                if ( item.animationProgress >= 1 ) {

                    item.animationProgress = 0;
                    item.animation = '';

                    if ( item.state === 'hidden' ) {

                        metaversefile.removeApp( item.app );

                    }

                }

            });

        };

        loop();

        //

        return () => {

            cancelAnimationFrame( loop );

        };

    }, [] );

    //

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

    const onDragOver = e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const onDragStart = e => {
        // console.log('drag start', e);
    };
    const onDragEnd = e => {
        // console.log('drag end', e);
    };

    return (
        <div
            className={ styles.App }
            id="app"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
        >
            <AppContext.Provider value={{ state, setState, app, setSelectedApp, selectedApp }}>
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
                <QuickMenu />
                <ZoneTitleCard />
                <MapGen />
                <Quests />
                <LoadingBox />
                <FocusBar />
                <DragAndDrop />
                <Stats app={ app } />
            </AppContext.Provider>
        </div>
    );

};
