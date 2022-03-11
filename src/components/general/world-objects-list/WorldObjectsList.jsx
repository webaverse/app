
import * as THREE from 'three';
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world.js'
import game from '../../../../game.js'
import metaversefile from '../../../../metaversefile-api.js';
import cameraManager from '../../../../camera-manager.js';
import ioManager from '../../../../io-manager.js';

import styles from './world-objects-list.module.css';

//

const _formatContentId = contentId => contentId.replace( /^[\s\S]*\/([^\/]+)$/, '$1' );

const NumberInput = ({ input }) => {

    const handleInputKeyDown = ( event ) => {

        if ( event.which === 13 ) {

            event.target.blur();

        }

    };

    //

    return (

        <input type="number" className={ styles.input } value={ input.value } onChange={ input.onChange } onKeyDown={ handleInputKeyDown } />

    );

};

//

export const WorldObjectsList = ({ opened, setOpened }) => {

    const componentName = 'WorldObjectsList';
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );
    const [ selectedApp, setSelectedApp ] = useState( null );

    let [ px, setPx ] = useState( 0 );
    let [ py, setPy ] = useState( 0 );
    let [ pz, setPz ] = useState( 0 );
    let [ rx, setRx ] = useState( 0 );
    let [ ry, setRy ] = useState( 0 );
    let [ rz, setRz ] = useState( 0 );
    let [ sx, setSx ] = useState( 1 );
    let [ sy, setSy ] = useState( 1 );
    let [ sz, setSz ] = useState( 1 );

    px = { value: px, onChange: e => { const v = e.target.value; selectedApp.position.x = v; selectedApp.updateMatrixWorld(); setPx( v ); } };
    py = { value: py, onChange: e => { const v = e.target.value; selectedApp.position.y = v; selectedApp.updateMatrixWorld(); setPy( v ); } };
    pz = { value: pz, onChange: e => { const v = e.target.value; selectedApp.position.z = v; selectedApp.updateMatrixWorld(); setPz( v ); } };
    rx = { value: rx, onChange: e => { const v = e.target.value; selectedApp.rotation.x = v; selectedApp.updateMatrixWorld(); setRx( v ); } };
    ry = { value: ry, onChange: e => { const v = e.target.value; selectedApp.rotation.y = v; selectedApp.updateMatrixWorld(); setRy( v ); } };
    rz = { value: rz, onChange: e => { const v = e.target.value; selectedApp.rotation.z = v; selectedApp.updateMatrixWorld(); setRz( v ); } };
    sx = { value: sx, onChange: e => { const v = e.target.value; selectedApp.scale.x = v; selectedApp.updateMatrixWorld(); setSx( v ); } };
    sy = { value: sy, onChange: e => { const v = e.target.value; selectedApp.scale.y = v; selectedApp.updateMatrixWorld(); setSy( v ); } };
    sz = { value: sz, onChange: e => { const v = e.target.value; selectedApp.scale.z = v; selectedApp.updateMatrixWorld(); setSz( v ); } };

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleKeyDown = ( event ) => {

        switch ( event.which ) {

            case 90: {   // Z

                if ( opened ) {

                    handleOnFocusLost();

                } else {

                    setOpened( true );

                }

                break;

            }

        }

    };

    const selectApp = ( targetApp, physicsId, position ) => {

        setSelectedApp( targetApp );
        game.setMouseSelectedObject( targetApp, physicsId, position );

    };

    const closeOtherWindows = () => {

        window.dispatchEvent( new CustomEvent( 'CloseAllMenus', { detail: { dispatcher: componentName } } ) );

    };

    const handleItemClick = ( targetApp ) => {

        const physicsObjects = targetApp.getPhysicsObjects();z
        const physicsObject = physicsObjects[0] || null;
        const physicsId = physicsObject ? physicsObject.physicsId : 0;
        selectApp( targetApp, physicsId );

        const localPlayer = metaversefile.useLocalPlayer();
        localPlayer.lookAt( targetApp.position );

    };

    const handleItemMouseEnter = ( targetApp ) => {

        const physicsObjects = targetApp.getPhysicsObjects();
        const physicsObject = physicsObjects[0] || null;
        const physicsId = physicsObject ? physicsObject.physicsId : 0;

        game.setMouseHoverObject( null );
        game.setMouseDomHoverObject( targetApp, physicsId );

    };

    const handleItemMouseLeave = () => {

        game.setMouseDomHoverObject( null );

    };

    const handleOnFocusLost = ( event ) => {

        event = event ?? {};

        if ( event.detail && event.detail.dispatcher === componentName ) return;

        if ( ! event.detail ) {

            ioManager.click( new MouseEvent('click') );
            cameraManager.requestPointerLock();

        }

        setOpened( false );

    };

    const handleBackBtn = () => {

        setSelectedApp( null );

    };

    //

    useEffect( () => {

        if ( opened ) {

            cameraManager.exitPointerLock();
            closeOtherWindows();

        }

        const update = () => {

            setApps( world.appManager.getApps().slice() );

        };

        world.appManager.addEventListener( 'appadd', update );
        world.appManager.addEventListener( 'appremove', update );
        window.addEventListener( 'click', handleOnFocusLost );
        window.addEventListener( 'keydown', handleKeyDown );
        window.addEventListener( 'CloseAllMenus', handleOnFocusLost );

        return () => {

            world.appManager.removeEventListener( 'appadd', update );
            world.appManager.removeEventListener( 'appremove', update );
            window.removeEventListener( 'click', handleOnFocusLost );
            window.removeEventListener( 'keydown', handleKeyDown );
            window.removeEventListener( 'CloseAllMenus', handleOnFocusLost );

        };

    }, [ opened ] );

    useEffect( () => {

        if ( ! selectedApp ) return;

        const localEuler = new THREE.Euler();
        const { position, quaternion, scale } = selectedApp;
        const rotation = localEuler.setFromQuaternion( quaternion, 'YXZ' );

        setPx( position.x );
        setPy( position.y );
        setPz( position.z );
        setRx( rotation.x );
        setRy( rotation.y );
        setRz( rotation.z );
        setSx( scale.x );
        setSy( scale.y );
        setSz( scale.z );

    }, [ selectedApp ] );

    //

    return (
        <div className={ classnames( styles.worldObjectListWrapper, opened ? styles.opened : null ) } onClick={ stopPropagation } >
            <div className={ classnames( styles.panel, ( ! selectedApp && opened ) ? styles.opened : null ) } >
                <div className={ styles.header } >
                    <h1>Tokens</h1>
                </div>
                {
                    <div className={ styles.objects } >
                    {
                        apps.map( ( app, i ) => (
                            <div className={ classnames( styles.object, app === selectedApp ? styles.selected : null ) } key={ i } onClick={ handleItemClick.bind( this, app ) } onMouseEnter={ handleItemMouseEnter.bind( this, app ) } onMouseLeave={ handleItemMouseLeave.bind( this, app ) } >
                                <img src="images/webpencil.svg" className={ classnames( styles.backgroundInner, styles.lime ) } />
                                <img src="images/object.jpg" className={ styles.img } />
                                <div className={ styles.wrap } >
                                    <div className={ styles.name } >{ app.name }</div>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                }
            </div>
            <div className={ classnames( styles.objectProperties, styles.panel, selectedApp ? styles.opened : null ) } >
                <div className={ styles.header } >
                    <div className={ classnames( styles.button, styles.back ) } onClick={ handleBackBtn } >
                        <img src="images/webchevron.svg" className={ styles.img } />
                    </div>
                    <h1>{ selectedApp ? _formatContentId( selectedApp.contentId ) : null } </h1>
                </div>
                <div className={ styles.clearfix } />
                <div className={ styles.subheader } >Position</div>
                <div className={ styles.inputs } >
                    <NumberInput input={ px } />
                    <NumberInput input={ py } />
                    <NumberInput input={ pz } />
                </div>
                <div className={ styles.subheader } >Rotation</div>
                <div className={ styles.inputs } >
                    <NumberInput input={ rx } />
                    <NumberInput input={ ry } />
                    <NumberInput input={ rz } />
                </div>
                <div className={ styles.subheader } >Scale</div>
                <div className={ styles.inputs } >
                    <NumberInput input={ sx } />
                    <NumberInput input={ sy } />
                    <NumberInput input={ sz } />
                </div>
            </div>
        </div>
    );

};
