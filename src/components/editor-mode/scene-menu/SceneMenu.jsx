
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import * as Z from 'zjs';

import { world } from '../../../../world'
import universe from '../../../../universe.js'
import sceneNames from '../../../../scenes/scenes.json';

import styles from './scene-menu.module.css';

//

export const SceneMenu = ({ multiplayerConnected, selectedScene, setSelectedScene, selectedRoom, setSelectedRoom }) => {

    const componentName = 'SceneMenu';
    const [ rooms, setRooms ] = useState([]);
    const [ scenesMenuOpened, setScenesMenuOpened ] = useState( false );
    const [ roomsMenuOpened, setRoomsMenuOpened ] = useState( false );
    const [ micEnabled, setMicEnabled ] = useState( false );

    //

    const _makeName = ( N = 8 ) => ( Math.random().toString(36) + '00000000000000000' ).slice( 2, N + 2 );

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

    const closeOtherWindows = () => {

        window.dispatchEvent( new CustomEvent( 'CloseAllMenus', { detail: { dispatcher: componentName } } ) );

    };

    const handleOnFocusLost = ( event ) => {

        if ( event.detail && event.detail.dispatcher === componentName ) return;
        setScenesMenuOpened( false );
        setRoomsMenuOpened( false );

    };

    const handleSceneMenuOpen = ( value ) => {

        value = ( typeof value === 'boolean' ? value : ( ! scenesMenuOpened ) );
        setScenesMenuOpened( value );
        setRoomsMenuOpened( false );

    };

    const handleSceneSelect = ( event, sceneName ) => {

        setScenesMenuOpened( false );
        setRoomsMenuOpened( false );

        sceneName = sceneName ?? event.target.value;
        setSelectedScene( sceneName );
        universe.pushUrl( `/?src=${ encodeURIComponent( './scenes/' + sceneName ) }` );

    };

    const handleRoomMenuOpen = ( value ) => {

        value = ( typeof value === 'boolean' ? value : ( ! roomsMenuOpened ) );
        setScenesMenuOpened( false );

        if ( ! multiplayerConnected ) {

            setRoomsMenuOpened( value );

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

        setScenesMenuOpened( false );
        setRoomsMenuOpened( false );

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

                setScenesMenuOpened( false );
                setRoomsMenuOpened( false );
                break;

            }

            case 13: { // enter

                universe.pushUrl( `/?src=${ encodeURIComponent( selectedScene ) }` );
                break;

            }

        }

    };

    const handleMicBtnClick = async () => {

        if ( ! world.micEnabled() ) {

            await world.enableMic();
            setMicEnabled( true );

        } else {

            world.disableMic();
            setMicEnabled( false );

        }

    };

    useEffect( () => {

        refreshRooms();
        window.addEventListener( 'CloseAllMenus', handleOnFocusLost );
        window.addEventListener( 'click', handleOnFocusLost );

        return () => {

            window.removeEventListener( 'CloseAllMenus', handleOnFocusLost );
            window.removeEventListener( 'click', handleOnFocusLost );

        };

    }, [] );

    useEffect( () => {

        if ( scenesMenuOpened || roomsMenuOpened ) {

            closeOtherWindows();

        }

    }, [ scenesMenuOpened, roomsMenuOpened ] );

    //

    return (
        <div className={ styles.location } onClick={ stopPropagation } >
            <div className={ styles.row }>
                <div className={ styles.buttonWrap } onClick={ handleSceneMenuOpen.bind( this, null ) } >
                    <button className={ classnames( styles.button, styles.primary, scenesMenuOpened ? null : styles.disabled ) } >
                        <img src="images/webarrow.svg" />
                    </button>
                </div>
                <div className={ styles.inputWrap } >
                    <input type="text" className={ styles.input } value={ multiplayerConnected ? selectedRoom : selectedScene } onFocus={ handleSceneMenuOpen.bind( this, false ) } onChange={ handleSceneSelect } disabled={ multiplayerConnected } onKeyDown={ handleSceneInputKeyDown } placeholder="Goto..." />
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.green ) } />
                </div>
                <div className={ styles.buttonWrap  } onClick={ handleRoomMenuOpen.bind( this, null ) } >
                    <button className={ classnames( styles.button, ( roomsMenuOpened || multiplayerConnected ) ? null : styles.disabled ) } >
                        <img src="images/wifi.svg" />
                    </button>
                </div>
                <div className={styles.buttonWrap } onClick={ handleMicBtnClick } >
                    <button className={ classnames( styles.button, micEnabled ? null : styles.disabled ) } >
                        <img src="images/microphone.svg" className={ classnames( micEnabled ? null : styles.hidden ) } />
                        <img src="images/microphone-slash.svg" className={ classnames( micEnabled ? styles.hidden : null ) } />
                    </button>
                </div>
            </div>

            {
                scenesMenuOpened ? (
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
                roomsMenuOpened ? (
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
