
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world'
import universe from '../../../../universe'
import voiceInput from '../../../../voice-input/voice-input';
import sceneNames from '../../../../scenes/scenes.json';

import { AppContext } from '../../app';

import styles from './scene-menu.module.css';

//

export const SceneMenu = ({ multiplayerConnected, selectedScene, setSelectedScene, selectedRoom, setSelectedRoom }) => {

    const { state, setState } = useContext( AppContext );
    const [ rooms, setRooms ] = useState([]);
    const [ micEnabled, setMicEnabled ] = useState( false );
    const [ speechEnabled, setSpeechEnabled ] = useState( false );

    //

    const refreshRooms = async () => {

        const res = await fetch( universe.getWorldsHost() );

        if ( res.ok ) {

            const rooms = await res.json();
            setRooms( rooms );

        } else {

            const text = await res.text();
            console.warn( 'failed to fetch', res.status, text );

        }

    };

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleSceneMenuOpen = ( value ) => {

        value = ( typeof value === 'boolean' ? value : ( state.openedPanel === 'SceneMenuPanel' ) );
        setState({ openedPanel: value ? null : 'SceneMenuPanel' });

    };

    const handleSceneSelect = ( event, sceneName ) => {

        setState({ openedPanel: null });

        sceneName = sceneName ?? event.target.value;
        setSelectedScene( sceneName );
        universe.pushUrl( `/?src=${ encodeURIComponent( './scenes/' + sceneName ) }` );

    };

    const handleRoomMenuOpen = ( value ) => {

        value = ( typeof value === 'boolean' ? value : ( state.openedPanel === 'RoomMenuPanel' ) );

        if ( ! multiplayerConnected ) {

            setState({ openedPanel: value ? null : 'RoomMenuPanel' });

        } else {

            universe.pushUrl( `/?src=${ encodeURIComponent( selectedScene ) }` );

        }

    };

    const handleRoomCreateBtnClick = async () => {

        alert( 'todo' );
        // const roomName = _makeName();
        // const data = null; // Z.encodeStateAsUpdate( world.getState( true ) );

        // const res = await fetch( universe.getWorldsHost() + roomName, { method: 'POST', body: data } );

        // if ( res.ok ) {

        //     refreshRooms();
        //     setSelectedRoom( roomName );
        //     universe.pushUrl( `/?src=${ encodeURIComponent( sceneName ) }&room=${ roomName }` );

        //     /* this.parent.sendMessage([
        //         MESSAGE.ROOMSTATE,
        //         data,
        //     ]); */

        // } else {

        //     const text = await res.text();
        //     console.warn( 'error creating room', res.status, text );

        // }

    };

    const handleRoomSelect = ( room ) => {

        setState({ openedPanel: null });

        if ( ! world.isConnected() ) {

            universe.pushUrl( `/?src=${ encodeURIComponent( selectedScene ) }&room=${ room.name }` );

            /* const isConnected = world.isConnected();
            setMultiplayerConnected(isConnected);
            if (isConnected) {
              setRoomName(room.name);
              setMultiplayerOpen(false);
            } */

        }

    };

    const handleDeleteRoomBtnClick = async ( room, event ) => {

        event.stopPropagation();

        const res = await fetch( universe.getWorldsHost() + room.name, { method: 'DELETE' } );

        if ( res.ok ) {

            refreshRooms();

        } else {

            const text = await res.text();
            console.warn( 'failed to fetch', res.status, text );

        }

    };

    const handleSceneInputKeyDown = ( event ) => {

        switch ( event.which ) {

            case 27: { // escape

                setState({ openedPanel: null });
                break;

            }

            case 13: { // enter

                universe.pushUrl( `/?src=${ encodeURIComponent( selectedScene ) }` );
                break;

            }

        }

    };

    const handleMicBtnClick = async () => {

        setState({ openedPanel: null });

        if ( ! voiceInput.micEnabled() ) {

            await voiceInput.enableMic();

        } else {

            voiceInput.disableMic();

        }

    };

    const handleSpeakBtnClick = async () => {

        setState({ openedPanel: null });

        if ( ! voiceInput.speechEnabled() ) {

            await voiceInput.enableSpeech();

        } else {

            voiceInput.disableSpeech();

        }

    };

    useEffect( () => {

        refreshRooms();

        function michange ( event ) {

            setMicEnabled( event.data.enabled );

        };

        function speechchange ( event ) {

            setSpeechEnabled( event.data.enabled );

        };

        voiceInput.addEventListener( 'micchange', michange );
        voiceInput.addEventListener( 'speechchange', speechchange );

        return () => {

            voiceInput.removeEventListener( 'micchange', michange );
            voiceInput.removeEventListener( 'speechchange', speechchange );

        };

    }, [] );

    //

    return (
        <div className={ styles.location } onClick={ stopPropagation } >
            <div className={ styles.row }>
                <div className={ styles.buttonWrap } onClick={ handleSceneMenuOpen.bind( this, null ) } >
                    <button className={ classnames( styles.button, styles.primary, state.openedPanel === 'SceneMenuPanel' ? null : styles.disabled ) } >
                        <img src="images/webarrow.svg" />
                    </button>
                </div>
                <div className={ styles.inputWrap } >
                    <input type="text" className={ styles.input } value={ multiplayerConnected ? selectedRoom : selectedScene } onFocus={ handleSceneMenuOpen.bind( this, false ) } onChange={ handleSceneSelect } disabled={ multiplayerConnected } onKeyDown={ handleSceneInputKeyDown } placeholder="Goto..." />
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.green ) } />
                </div>
                <div className={ styles.buttonWrap  } onClick={ handleRoomMenuOpen.bind( this, null ) } >
                    <div className={ classnames( styles.button, ( state.openedPanel === 'RoomsMenuPanel' || multiplayerConnected ) ? null : styles.disabled ) } >
                        <img src="images/wifi.svg" />
                    </div>
                </div>
                <div className={styles.buttonWrap } onClick={ handleMicBtnClick } >
                    <div className={ classnames( styles.button, micEnabled ? null : styles.disabled ) } >
                        <img src="images/microphone.svg" className={ classnames( micEnabled ? null : styles.hidden ) } />
                        <img src="images/microphone-slash.svg" className={ classnames( micEnabled ? styles.hidden : null ) } />
                    </div>
                </div>
                <div className={styles.buttonWrap } onClick={ handleSpeakBtnClick } >
                    <div className={ classnames( styles.button, speechEnabled ? null : styles.disabled ) } >
                        <img src="images/speak.svg" />
                    </div>
                </div>
            </div>

            {
                state.openedPanel === 'SceneMenuPanel' ? (
                    <div className={ styles.rooms }>
                    {
                        sceneNames.map( ( sceneName, i ) => (
                            <div className={ styles.room } onMouseDown={ ( e ) => { handleSceneSelect( e, sceneName ) } } key={ i } >
                                <img className={ styles.image } src="images/world.jpg" />
                                <div className={ styles.name } >{ sceneName }</div>
                            </div>
                        ))
                    }
                    </div>
                ) : null
            }

            {
                state.openedPanel === 'RoomMenuPanel' ? (
                    <div className={ styles.rooms } >
                        <div className={ styles.create } >
                            <button className={ styles.button } onClick={ handleRoomCreateBtnClick }>Create room</button>
                        </div>
                        {
                            rooms.map( ( room, i ) => (
                                <div className={ styles.room } onClick={ ( e ) => { handleRoomSelect( e, room ) } } key={ i } >
                                    <img className={ styles.image } src="images/world.jpg" />
                                    <div className={ styles.name } >{ room.name }</div>
                                    <div className={ styles.delete } >
                                        <button className={ classnames( styles.button, styles.warning ) } onClick={ handleDeleteRoomBtnClick.bind( this, room ) } >Delete</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                ) : null
            }

        </div>
    );

};
