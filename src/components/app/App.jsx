
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
const loadedBlocks = {};
const blockSize = 4.5;
const itemsPerBlock = 2;
const blocks = new Map();

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

    useEffect( () => {

        if ( ! contractId ) return;

        const loop = async () => {

            requestAnimationFrame( loop );
            if ( ! app.contentLoaded ) return;

            let x = Math.round( playerPos.x / blockSize );
            let z = Math.round( playerPos.z / blockSize );

            if ( x !== Math.round( localPlayer.position.x / blockSize ) || z !== Math.round( localPlayer.position.z / blockSize ) ) {

                playerPos.x = Math.round( localPlayer.position.x / blockSize );
                playerPos.z = Math.round( localPlayer.position.z / blockSize );

                x = playerPos.x;
                z = playerPos.z;

                for ( let bi = x - 1; bi <= x + 1; bi ++ ) {

                    for ( let bj = z - 1; bj <= z + 1; bj ++ ) {

                        if ( loadedBlocks[ bi + '=' + bj ] ) continue;

                        loadedBlocks[ bi + '=' + bj ] = true;

                        for ( let i = itemsPerBlock * bi; i < itemsPerBlock * bi + itemsPerBlock; i ++ ) {

                            for ( let j = itemsPerBlock * bj; j < itemsPerBlock * bj + itemsPerBlock; j ++ ) {

                                ( async () => {

                                    const app = await metaversefile.createAppAsync({
                                        start_url: '/@proxy/eth://' + contractId + '/' + ( 10 * i + j + 1000 )
                                    });

                                    app.position.set( i * ( blockSize / itemsPerBlock ) - 0.0 * blockSize + 100, 1, j * ( blockSize / itemsPerBlock ) - 0.0 * blockSize );
                                    app.userData.targetPos = { x: i * ( blockSize / itemsPerBlock ) - 0.5 * blockSize, z: j * ( blockSize / itemsPerBlock ) - 0.5 * blockSize };
                                    app.updateMatrixWorld( true );
                                    metaversefile.addApp( app );

                                    const block = blocks.get( bi + '=' + bj ) ?? [];
                                    block.push( app );
                                    blocks.set( bi + '=' + bj, block );

                                }) ();

                            }

                        }

                    }

                }

            }

            //

            blocks.forEach( ( block, blockId ) => {

                const dist = new THREE.Vector3( ( + blockId.split('=')[0] ) * blockSize, 0, ( + blockId.split('=')[1] ) * blockSize ).sub( localPlayer.position ).length();
                let hiden = ( dist > blockSize * 2 ) ? true : false;

                block.forEach( ( item ) => {

                    if ( dist > blockSize * 2 ) {

                        item.userData.targetPos.x = 100;

                        if ( item.position.x < 90 ) {

                            hiden = false;

                        }

                    }

                    item.position.x = 0.95 * item.position.x + 0.05 * item.userData.targetPos.x;
                    item.position.z = 0.95 * item.position.z + 0.05 * item.userData.targetPos.z;
                    item.updateMatrixWorld( true );

                });

                if ( hiden ) {

                    block.forEach( ( item ) => {

                        metaversefile.removeApp( item );

                    });

                    delete loadedBlocks[ blockId ];
                    blocks.delete( blockId );

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
