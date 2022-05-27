
import React, { useState, useEffect, useRef, createContext } from 'react';

import { defaultAvatarUrl } from '../../../constants';

import game from '../../../game';
import sceneNames from '../../../scenes/scenes.json';
import { parseQuery } from '../../../util.js'
import Webaverse from '../../../webaverse.js';
import universe from '../../../universe.js';
import metaversefileApi from '../../../metaversefile-api';
import cameraManager from '../../../camera-manager';
import { world } from '../../../world';
import { handleStoryKeyControls } from '../../../story';

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
import { UIMode } from '../general/ui-mode';

import styles from './App.module.css';
import '../../fonts.css';

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

const useWebaverseApp = (() => {

    let webaverse = null;

    return () => {

        if ( webaverse === null ) {

            webaverse = new Webaverse();

        }

        return webaverse;

    };

})();

export const App = () => {

    const [ state, setState ] = useState({ openedPanel: null });
    const [ uiMode, setUIMode ] = useState( 'normal' );

    const canvasRef = useRef( null );
    const app = useWebaverseApp();
    const [ selectedApp, setSelectedApp ] = useState( null );
    const [ selectedScene, setSelectedScene ] = useState( _getCurrentSceneSrc() );
    const [ selectedRoom, setSelectedRoom ] = useState( _getCurrentRoom() );
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );

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

        if ( state.openedPanel && state.openedPanel !== 'ChatPanel' && cameraManager.pointerLockElement ) {

            cameraManager.exitPointerLock();

        }

        if ( state.openedPanel ) {

            setUIMode( 'normal' );

        }

    }, [ state.openedPanel ] );

    useEffect( () => {

        const handleStoryKeyUp = ( event ) => {

            if ( game.inputFocused() ) {

                return;

            }

            handleStoryKeyControls( event );

        };

        registerIoEventHandler( 'keyup', handleStoryKeyUp );

        return () => {

            unregisterIoEventHandler( 'keyup', handleStoryKeyUp );

        };

    }, [] );

    useEffect( () => {

        if ( uiMode === 'none' ) {

            setState({ openedPanel: null });

        }

        const handleKeyDown = ( event ) => {

            if ( event.ctrlKey && event.code === 'KeyH' ) {

                setUIMode( uiMode === 'normal' ? 'none' : 'normal' );
                return false;

            }

            return true;

        };

        registerIoEventHandler( 'keydown', handleKeyDown );

        return () => {

            unregisterIoEventHandler( 'keydown', handleKeyDown );

        };

    }, [ uiMode ] );

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
            <AppContext.Provider value={{ state, setState, app, setSelectedApp, selectedApp, uiMode }}>
                <Header setSelectedApp={ setSelectedApp } selectedApp={ selectedApp } />
                <canvas className={ styles.canvas } ref={ canvasRef } />
                <Crosshair />
                <UIMode hideDirection='right'>
                    <ActionMenu setUIMode={ setUIMode } />
                </UIMode>
                <Settings />
                <WorldObjectsList />
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
