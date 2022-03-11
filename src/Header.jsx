
import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';

import Inspector from './Inspector.jsx';
import Chat from './Chat.jsx';
import CharacterHups from './CharacterHups.jsx';
import MagicMenu from './MagicMenu.jsx';
import {world} from '../world.js'
import game from '../game.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
import User from './User';
import {Character} from './tabs/character';
import {Claims} from './tabs/claims';
import {Tokens} from './tabs/tokens';
import { AppContext } from './components/app';
import { registerIoEventHandler, unregisterIoEventHandler } from './components/io-handler';

import styles from './Header.module.css';

//

export default function Header({ app }) {

    const { openedPanel, setOpenedPanel } = useContext( AppContext );

    const localPlayer = metaversefile.useLocalPlayer();
    const _getWearActions = () => localPlayer.getActionsArray().filter(action => action.type === 'wear');

    const dioramaCanvasRef = useRef();
    const panelsRef = useRef();

    const [selectedApp, setSelectedApp] = useState(null);
    const [address, setAddress] = useState(false);
    const [nfts, setNfts] = useState(null);
    const [apps, setApps] = useState(world.appManager.getApps().slice());
    const [claims, setClaims] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');

    const [wearActions, setWearActions] = useState(_getWearActions());

    const userOpen = openedPanel === 'user';
    const chatOpen = openedPanel === 'ChatPanel';
    const characterOpen = openedPanel === 'CharacterPanel';
    const magicMenuOpen = openedPanel === 'magicMenu';

    const toggleOpen = newOpen => {
        setOpenedPanel(newOpen === openedPanel ? null : newOpen);
    };

    useEffect(() => {

        const update = e => {
            setApps(world.appManager.getApps().slice());
        };

        world.appManager.addEventListener('appadd', update);
        world.appManager.addEventListener('appremove', update);

    }, []);

    useEffect( () => {

        const handleKeyPress = ( event ) => {

            if ( event.which === 9 ) { // tab

                if ( openedPanel !== 'CharacterPanel' ) {

                    cameraManager.exitPointerLock();

                } else {

                    cameraManager.requestPointerLock();

                }

                setOpenedPanel( openedPanel === 'CharacterPanel' ? '' : 'CharacterPanel' );
                return false;

            }

            if ( event.which === 13 && openedPanel !== 'ChatPanel' ) { // enter

                setOpenedPanel( 'ChatPanel' );
                return false;

            }

            return true;

        };

        registerIoEventHandler( 'keyup', handleKeyPress );

        return () => {

            unregisterIoEventHandler( 'keyup', handleKeyPress );

        };

    }, [ openedPanel ] );

    useEffect(() => {

        localPlayer.addEventListener('wearupdate', e => {

            const wearActions = _getWearActions();
            setWearActions(wearActions);

            const mouseDomEquipmentHoverObject = game.getMouseDomEquipmentHoverObject();

            if (mouseDomEquipmentHoverObject && !wearActions.some(action => action.type === 'wear' && action.instanceId === mouseDomEquipmentHoverObject.instanceId)) {

                game.setMouseDomEquipmentHoverObject(null);

            }

        });

    }, []);

    useEffect(() => {

        if (game.playerDiorama) {

            game.playerDiorama.enabled = characterOpen;

        }

    }, [ openedPanel ]);

    useEffect(() => {

        const pickup = e => {

            const {app} = e.data;
            const {contentId} = app;
            const newClaims = claims.slice();
            newClaims.push({ contentId });
            setClaims(newClaims);

        };

        world.appManager.addEventListener('pickup', pickup);

        return () => {

            world.appManager.removeEventListener('pickup', pickup);

        };

    }, [claims]);

    useEffect(() => {

        if (dioramaCanvasRef.current && !game.playerDiorama) {

            app.bindDioramaCanvas(dioramaCanvasRef.current);

        }

    }, [dioramaCanvasRef.current]);

    useEffect(() => {

        if (selectedApp && panelsRef.current) {

            panelsRef.current.scrollTo(0, 0);

        }

    }, [selectedApp, panelsRef.current]);

    useEffect( () => {

        const dragchange = e => {

            const { dragging } = e.data;
            setDragging( dragging );

        };

        world.appManager.addEventListener( 'dragchange', dragchange );

        return () => {

            world.appManager.removeEventListener( 'dragchange', dragchange );

        };

    }, [ dragging ] );

    //

    const npcManager = metaversefile.useNpcManager();
    const [ npcs, setNpcs ] = useState( npcManager.npcs );

    useEffect( () => {

        npcManager.addEventListener('npcadd', e => {

            const { player } = e.data;
            const newNpcs = npcs.concat([ player ]);
            setNpcs( newNpcs );

        });

        npcManager.addEventListener('npcremove', e => {

            const { player } = e.data;
            const newNpcs = npcs.slice().splice( npcs.indexOf( player ), 1 );
            setNpcs( newNpcs );

        });

    }, []);

    //

	return (
        <div className={styles.container} onClick={e => { e.stopPropagation(); }}>
        <Inspector open={ openedPanel } setOpen={ setOpenedPanel } selectedApp={selectedApp} dragging={dragging} />
        <Chat open={ openedPanel } setOpen={ setOpenedPanel } />
        <CharacterHups localPlayer={localPlayer} npcs={npcs} />
        <MagicMenu open={ openedPanel } setOpen={ setOpenedPanel } />
        <div className={styles.inner}>
            <header className={styles.header}>
                <div className={styles.row}>
                    <a href="/" className={styles.logo}>
                    <img src="images/arrow-logo.svg" className={styles.image} />
                    </a>
                    <User
                        address={address}
                        setAddress={setAddress}
                        open={ openedPanel }
                        setOpen={ setOpenedPanel }
                        toggleOpen={toggleOpen}
                        setLoginFrom={setLoginFrom}
                    />
                </div>
                </header>
                <header className={classnames(styles.header, styles.subheader)}>
                    <div className={styles.row}>
                        <Character
                            open={ openedPanel }
                            setOpen={ setOpenedPanel }
                            toggleOpen={toggleOpen}
                            panelsRef={panelsRef}
                            wearActions={wearActions}
                            dioramaCanvasRef={dioramaCanvasRef}
                            game={game}
                        />
                        <Claims
                            claims={claims}
                            open={ openedPanel }
                            toggleOpen={toggleOpen}
                            panelsRef={panelsRef}
                        />
                    </div>
                </header>
                <Tokens
                    userOpen={userOpen}
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
