import React, { useEffect, useRef, useContext, useState } from 'react';

import CharacterHups from './CharacterHups.jsx';
import game from '../game.js'
import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
import ioManager from '../io-manager.js'

import { Character } from './components/general/character';
import { CharacterSelect } from './components/general/character-select';
import { Equipment } from './components/general/equipment';
import { Tokens } from './tabs/tokens';
import { registerIoEventHandler, unregisterIoEventHandler } from './components/general/io-handler';
import { AppContext } from './components/app';
import { AvatarIcon } from './AvatarIcon';
import { StoryTime } from './StoryTime';
import { User } from './User';
import {world} from '../world.js';
import {FaceTracker} from '../face-tracking.js';

import classnames from 'classnames';

import styles from './Header.module.css';

//

let arControl = false;


export default function Header() {

    const { state, setState, selectedApp } = useContext( AppContext );
    const localPlayer = metaversefile.useLocalPlayer();
    const _getWearActions = () => localPlayer.getActionsArray().filter(action => action.type === 'wear');

    const dioramaCanvasRef = useRef();
    const panelsRef = useRef();

    const [address, setAddress] = useState('');
    const [nfts, setNfts] = useState(null);
    // const [apps, setApps] = useState(world.appManager.getApps().slice());
    // const [claims, setClaims] = useState([]);
    // const [dragging, setDragging] = useState(false);
    const [loginFrom, setLoginFrom] = useState('');
    const [wearActions, setWearActions] = useState(_getWearActions());
    const [faceTrackingEnabled, setFaceTrackingEnabled] = useState(false);
    const [faceTrackingOpen, setFaceTrackingOpen] = useState(false);
    const [arAvatarEnabled, setArAvatarEnabled] = useState(false);
    const [arCameraEnabled, setArCameraEnabled] = useState(false);
    const [arPoseEnabled, setArPoseEnabled] = useState(false);
  
    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    //

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

    /* useEffect(() => {

        const pickup = e => {

            const {app} = e.data;
            const {contentId} = app;
            const newClaims = claims.slice();

            newClaims.push({ contentId });
            setClaims( newClaims );

        };

        world.appManager.addEventListener( 'pickup', pickup );

        return () => {

            world.appManager.removeEventListener( 'pickup', pickup );

        };

    }, [ claims ] ); */

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

                    if ( !event.repeat ) {

                        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

                        if ( state.openedPanel === 'CharacterPanel' && ! cameraManager.pointerLockElement ) {

                            cameraManager.requestPointerLock();

                        }

                    }

                    return true;

                }

            }

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

    // tmp code [will be remove in next PRs]

    const claimsOpen = ( state.openedPanel === 'ClaimsPanel' ? 'claims' : false );

    const toggleClaimsOpen = () => {

        if ( claimsOpen ) {

            setState({ openedPanel: null });

        } else {

            setState({ openedPanel: 'ClaimsPanel' });

        }

    };

    world.appManager.addEventListener('frame', () => {
        const faceTracker = ioManager.getFaceTracker();
        if (faceTracker) {
          const localPlayer = metaversefile.useLocalPlayer();
          if (arControl) {
            faceTracker.setAvatarPose(localPlayer);
          } else {
            faceTracker.setAvatarPose(localPlayer, null);
          }
          // console.log('set ar pose', localPlayer.arPose);
        }
      });
      const arUiContentRef = useRef();
    
      const _isSomeArOpen = () => arAvatarEnabled || arCameraEnabled || arPoseEnabled;
      useEffect(() => {
        if (faceTrackingEnabled && !_isSomeArOpen()) {
          _toggleFaceTracking();
        }
      }, [arAvatarEnabled, arCameraEnabled, arPoseEnabled]);
      const _toggleFaceTracking = () => {
        arControl = false;
    
        const newFaceTracking = !ioManager.getFaceTracking();
        ioManager.setFaceTracking(newFaceTracking);
        setFaceTrackingEnabled(newFaceTracking);
        setFaceTrackingOpen(false);
        setArAvatarEnabled(false);
        setArCameraEnabled(false);
        setArPoseEnabled(false);
        if (newFaceTracking) {
          _toggleArAvatar();
    
          const faceTracker = ioManager.getFaceTracker();
          faceTracker.addEventListener('open', e => {
            setFaceTrackingOpen(true);
          }, {once: true});
        }
      };
      const _toggleArAvatar = () => {
        const {domElement, videoCapture: {videoCanvas}} = ioManager.getFaceTracker();
        if (!domElement.parentElement) {
          const videoCanvasParent = videoCanvas.parentElement;
          if (videoCanvasParent) {
            videoCanvas.remove();
          }
    
          domElement.classList.add(styles['avatar-canvas']);
          arUiContentRef.current.appendChild(domElement);
    
          if (videoCanvasParent) {
            videoCanvasParent.appendChild(videoCanvas);
          }
        } else {
          domElement.remove();
        }
    
        setArAvatarEnabled(!!domElement.parentElement);
      };
      const _toggleArCamera = () => {
        const {domElement, videoCapture: {videoCanvas}} = ioManager.getFaceTracker();
        if (!videoCanvas.parentElement) {
          videoCanvas.classList.add(styles['camera-canvas']);
          arUiContentRef.current.appendChild(videoCanvas);
        } else {
          videoCanvas.remove();
        }
    
        setArCameraEnabled(!!videoCanvas.parentElement);
      };
      const _toggleArPose = () => {
        arControl = !arControl;
    
        setArPoseEnabled(!arPoseEnabled);
      };

    //

	return (
        <div className={styles.container} onClick={ stopPropagation } >
            <CharacterHups
              localPlayer={localPlayer}
              npcs={npcs}
            />
            <div style={{ position:'absolute', right: '10px', bottom: '10px', padding: '20px', zIndex: '1000', backgroundColor: 'red', margin: '20px' }} onClick={e => { _toggleFaceTracking(); }} >AR</div>
            <StoryTime />
            {/* <div className={styles.inner}> */}
                <AvatarIcon />
                <User
                    address={address}
                    setAddress={setAddress}
                    setLoginFrom={setLoginFrom}
                />
                <div className={styles.tabs}>
                    <Character
                        panelsRef={panelsRef}
                        wearActions={wearActions}
                        dioramaCanvasRef={dioramaCanvasRef}
                        game={game}
                    />
                    <CharacterSelect
                        
                    />
                    <Equipment />
                    {/* <Claims
                        open={ claimsOpen }
                        toggleOpen={ toggleClaimsOpen }
                        claims={claims}
                        panelsRef={panelsRef}
                    /> */}
                </div>
                <div className={styles.panels}>
                    <Tokens
                        nfts={nfts}
                        hacks={hacks}
                        address={address}
                        setNfts={setNfts}
                        loginFrom={loginFrom}
                    />
                </div>
                <div className={styles['ar-ui']}>
          {faceTrackingEnabled ? <div className={styles.switches}>
            <div className={classnames(styles.switch, arAvatarEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArAvatar();
            }}>AVA</div>
            <div className={classnames(styles.switch, arCameraEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArCamera();
            }}>CAM</div>
            <div className={classnames(styles.switch, arPoseEnabled ? styles.enabled : null)} onClick={e => {
              _toggleArPose();
            }}>POSE</div>
            <div className={styles.switch} onClick={e => {
              _toggleFaceTracking();
            }}>EXIT</div>
          </div> : null}
          <div className={classnames(styles['content-placeholder'], faceTrackingEnabled && !faceTrackingOpen ? styles.visible : null)}>
            <h1>Standby...</h1>
          </div>
          <div className={classnames(styles.content, faceTrackingEnabled && faceTrackingOpen ? styles.visible : null)} ref={arUiContentRef} />
        </div>
            {/* </div> */}
        </div>
    );

};