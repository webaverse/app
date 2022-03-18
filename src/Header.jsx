
import React, { useEffect, useRef, useContext, useState } from 'react';
import classnames from 'classnames';

import CharacterHups from './CharacterHups.jsx';
import { world } from '../world.js'
import game from '../game.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
import ioManager from '../io-manager.js'

import { User } from './User';
import { MagicMenu } from './MagicMenu.jsx';
import { Character } from './components/general/character';
import { Tokens } from './tabs/tokens';
import { Inspector } from './Inspector.jsx';
import { Chat } from './Chat.jsx';
import { registerIoEventHandler, unregisterIoEventHandler } from './components/general/io-handler';
import { AppContext } from './components/app';

import styles from './Header.module.css';

//

export default function Header ({ setSelectedApp, selectedApp }) {

    const { state, setState } = useContext( AppContext );
    const localPlayer = metaversefile.useLocalPlayer();
    const _getWearActions = () => localPlayer.getActionsArray().filter(action => action.type === 'wear');

    const dioramaCanvasRef = useRef();
    const panelsRef = useRef();

    const [address, setAddress] = useState(false);
    const [nfts, setNfts] = useState(null);
    const [apps, setApps] = useState(world.appManager.getApps().slice());
    const [dragging, setDragging] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');
    const [wearActions, setWearActions] = useState(_getWearActions());

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const selectApp = ( app, physicsId, position ) => {

        game.setMouseSelectedObject( app, physicsId, position );

    };

    //

    useEffect( () => {

        const update = e => {

            setApps( world.appManager.getApps().slice() );

        };

        world.appManager.addEventListener( 'appadd', update );
        world.appManager.addEventListener( 'appremove', update );

    }, []);

    useEffect( () => {

        localPlayer.addEventListener('wearupdate', e => {

            const wearActions = _getWearActions();
            setWearActions( wearActions );

            const mouseDomEquipmentHoverObject = game.getMouseDomEquipmentHoverObject();

            if (mouseDomEquipmentHoverObject && !wearActions.some(action => action.type === 'wear' && action.instanceId === mouseDomEquipmentHoverObject.instanceId)) {

                game.setMouseDomEquipmentHoverObject(null);

            }

        });

    }, []);

    useEffect( () => {

        const pointerlockchange = e => {

            const { pointerLockElement } = e.data;

            if ( pointerLockElement && state.openedPanel !== null) {

                setState({ openedPanel: null });

            }

        };

        cameraManager.addEventListener( 'pointerlockchange', pointerlockchange );

        return () => {

            cameraManager.removeEventListener( 'pointerlockchange', pointerlockchange );

        };

    }, [ state.openedPanel ] );

    useEffect(() => {

        if ( selectedApp && panelsRef.current ) {

            panelsRef.current.scrollTo(0, 0);

        }

    }, [ selectedApp, panelsRef.current ] );

    useEffect( () => {

        const handleNonInputKey = ( event ) => {

            switch ( event.which ) {

                case 191: { // /

                    if ( ! state.openedPanel === 'MagicPanel' && ! ioManager.inputFocused() ) {

                        setState({ openedPanel: 'MagicPanel' });

                    }

                    return true;

                }

            }

            return false;

        };

        const handleAnytimeKey = ( event ) => {

            switch ( event.which ) {

                case 9: { // tab

                    setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

                    if ( state.openedPanel === 'CharacterPanel' && ! cameraManager.pointerLockElement ) {

                        cameraManager.requestPointerLock();

                    }

                    return true;

                }

            }

            return false;

        };

        const keydown = ( event ) => {

            let handled = false;
            const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes( document.activeElement.nodeName );

            if ( ! inputFocused )  {

                handled = handleNonInputKey( event );

            }

            if ( ! handled ) {

                handled = handleAnytimeKey( event );

            }

            if ( handled ) {

                return false;

            } else {

                return true;

            }

        };

        registerIoEventHandler( 'keydown', keydown );

        return () => {

            unregisterIoEventHandler( 'keydown', keydown );

        };

    }, [ state.openedPanel, selectedApp ] );

    useEffect( () => {

        window.addEventListener('click', e => {

            const hoverObject = game.getMouseHoverObject();

            if (hoverObject) {

                e.preventDefault();
                e.stopPropagation();

                const physicsId = game.getMouseHoverPhysicsId();
                const position = game.getMouseHoverPosition();
                selectApp(hoverObject, physicsId, position);

            }

        });

    }, [] );

    useEffect( () => {

        const dragchange = e => {

            const {dragging} = e.data;
            setDragging(dragging);

        };

        world.appManager.addEventListener('dragchange', dragchange);

        const selectchange = e => {

            setSelectedApp( e.data.app );

        };

        world.appManager.addEventListener('selectchange', selectchange);

        return () => {

            world.appManager.removeEventListener('dragchange', dragchange);
            world.appManager.removeEventListener('selectchange', selectchange);

        };

    }, [ dragging ] );

    const npcManager = metaversefile.useNpcManager();
    const [npcs, setNpcs] = useState(npcManager.npcs);

    useEffect( () => {

        npcManager.addEventListener('npcadd', e => {

            const {player} = e.data;
            const newNpcs = npcs.concat([player]);
            setNpcs(newNpcs);

        });

        npcManager.addEventListener('npcremove', e => {

            const {player} = e.data;
            const newNpcs = npcs.slice().splice(npcs.indexOf(player), 1);
            setNpcs(newNpcs);

        });

    }, []);

    //

	return (
        <div className={styles.container} onClick={ stopPropagation } >
            <Inspector selectedApp={selectedApp} dragging={dragging} />
            <Chat />
            <CharacterHups localPlayer={localPlayer} npcs={npcs} />
            <MagicMenu />
            <div className={styles.inner}>
				<header className={styles.header}>
                    <div className={styles.row}>
                        <a href="/" className={styles.logo}>
                            <img src="images/arrow-logo.svg" className={styles.image} />
                        </a>
                        <User
                            address={address}
                            setAddress={setAddress}
                            setLoginFrom={setLoginFrom}
                        />
                    </div>
				</header>
                <header className={classnames(styles.header, styles.subheader)}>
                    <div className={styles.row}>
                        <Character
                            panelsRef={panelsRef}
                            wearActions={wearActions}
                            dioramaCanvasRef={dioramaCanvasRef}
                            game={game}
                        />
                    </div>
                </header>
                <Tokens
                    nfts={nfts}
                    hacks={hacks}
                    address={address}
                    setNfts={setNfts}
                    loginFrom={loginFrom}
                />
            </div>
        </div>
    );

};