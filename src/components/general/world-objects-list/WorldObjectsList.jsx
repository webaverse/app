
import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world.js'
import game from '../../../../game.js'
import metaversefile from '../../../../metaversefile-api.js';
import cameraManager from '../../../../camera-manager.js';

import { Spritesheet } from '../spritesheet';
import { AppContext } from '../../app';
import { registerIoEventHandler, unregisterIoEventHandler } from '../../general/io-handler';

import styles from './world-objects-list.module.css';

//

const NumberInput = ({ value, step, onChange, title }) => {

    const handleInputKeyUp = ( event ) => {

        if ( event.which === 13 ) { // enter

            event.preventDefault();
            event.stopPropagation();
            event.target.blur();

        }

    };

    //

    return (

        <div className={ styles.input } >
            <div className={ styles.inputTitle } >{ title }</div>
            <input type="number" className={ styles.inputText } value={ value } onChange={ onChange } onKeyUp={ handleInputKeyUp } step={ step } />
        </div>

    );

};

//

export const WorldObjectsList = () => {

    const { state, setState, setSelectedApp, selectedApp } = useContext( AppContext );
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );
    const [ rotationMode, setRotationMode ] = useState( 'euler' );
    const [ rotationEulerOrder, setRotationEulerOrder ] = useState( 'YXZ' );
    const [ needsUpdate, setNeedsUpdate ] = useState( false );

    let [ px, setPx ] = useState( 0 );
    let [ py, setPy ] = useState( 0 );
    let [ pz, setPz ] = useState( 0 );
    let [ rex, setREx ] = useState( 0 );
    let [ rey, setREy ] = useState( 0 );
    let [ rez, setREz ] = useState( 0 );
    let [ rqx, setRQx ] = useState( 0 );
    let [ rqy, setRQy ] = useState( 0 );
    let [ rqz, setRQz ] = useState( 0 );
    let [ rqw, setRQw ] = useState( 0 );
    let [ sx, setSx ] = useState( 1 );
    let [ sy, setSy ] = useState( 1 );
    let [ sz, setSz ] = useState( 1 );

    //

    const handleAppTransformChange = ( paramName, event ) => {

        const value = + event.target.value;

        switch ( paramName ) {

            case 'px':
                setPx( value );
                break;
            case 'py':
                setPy( value );
                break;
            case 'pz':
                setPz( value );
                break;

            case 'rex':
                setREx( value );
                break;
            case 'rey':
                setREy( value );
                break;
            case 'rez':
                setREz( value );
                break;

            case 'rqx':
                setRQx( value );
                break;
            case 'rqy':
                setRQy( value );
                break;
            case 'rqz':
                setRQz( value );
                break;
            case 'rqw':
                setRQw( value );
                break;

            case 'sx':
                setSx( value );
                break;
            case 'sy':
                setSy( value );
                break;
            case 'sz':
                setSz( value );
                break;

        }

        setNeedsUpdate( true );

    };

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleSetRotationMode = ( event ) => {

        setRotationMode( event.target.value );

    };

    const handleSetRotationEulerOrder = ( event ) => {

        setRotationEulerOrder( event.target.value );

        selectedApp.rotation.reorder( rotationEulerOrder );

        setREx( selectedApp.rotation.x );
        setREy( selectedApp.rotation.y );
        setREz( selectedApp.rotation.z );

    };

    const selectApp = ( targetApp, physicsId, position ) => {

        setSelectedApp( targetApp );
        game.setMouseSelectedObject( targetApp, physicsId, position );

    };

    const handleItemClick = ( targetApp ) => {

        const physicsObjects = targetApp.getPhysicsObjects();
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

    const handleBackBtn = () => {

        setSelectedApp( null );

    };

    const closePanel = () => {

        setState({ openedPanel: null });

    };

    //

    useEffect( () => {

        if ( ! selectedApp ) return;

        selectedApp.position.set( px, py, pz );
        selectedApp.scale.set( sx, sy, sz );

        if ( rotationMode === 'euler' ) {

            selectedApp.rotation.set( rex, rey, rez, rotationEulerOrder );

        } else {

            selectedApp.quaternion.set( rqx, rqy, rqz, rqw );
            selectedApp.quaternion.normalize();

        }

        selectedApp.updateMatrixWorld();

        //

        setREx( selectedApp.rotation.x );
        setREy( selectedApp.rotation.y );
        setREz( selectedApp.rotation.z );

        setRQx( selectedApp.quaternion.x );
        setRQy( selectedApp.quaternion.y );
        setRQz( selectedApp.quaternion.z );
        setRQw( selectedApp.quaternion.w );

        setNeedsUpdate( false );

    }, [ needsUpdate ] );

    useEffect( () => {

        const update = () => {

            setApps( world.appManager.getApps().slice() );

        };

        const handleKeyUp = ( event ) => {

            const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes( document.activeElement.nodeName );
            if ( inputFocused ) return true;

            switch ( event.which ) {

                case 90: {   // Z

                    if ( state.openedPanel === 'WorldPanel' ) {

                        if ( ! cameraManager.pointerLockElement ) {

                            cameraManager.requestPointerLock();

                        }

                        setState({ openedPanel: null });

                    } else if ( state.openedPanel !== 'SettingsPanel' ) {

                        if ( cameraManager.pointerLockElement ) {

                            cameraManager.exitPointerLock();

                        }

                        setState({ openedPanel: 'WorldPanel' });

                    }

                    return false;

                }

            }

            return true;

        };

        world.appManager.addEventListener( 'appadd', update );
        world.appManager.addEventListener( 'appremove', update );
        registerIoEventHandler( 'click', closePanel );
        registerIoEventHandler( 'keyup', handleKeyUp );

        return () => {

            world.appManager.removeEventListener( 'appadd', update );
            world.appManager.removeEventListener( 'appremove', update );
            unregisterIoEventHandler( 'click', closePanel );
            unregisterIoEventHandler( 'keyup', handleKeyUp );

        };

    }, [ state.openedPanel ] );

    useEffect( () => {

        if ( ! selectedApp ) return;

        const { position, quaternion, scale, rotation } = selectedApp;

        setPx( position.x );
        setPy( position.y );
        setPz( position.z );

        setREx( rotation.x );
        setREy( rotation.y );
        setREz( rotation.z );

        setRQx( quaternion.x );
        setRQy( quaternion.y );
        setRQz( quaternion.z );
        setRQw( quaternion.w );

        setSx( scale.x );
        setSy( scale.y );
        setSz( scale.z );

    }, [ selectedApp ] );

    //

    const appTypeIcons = { 'js': 'script', 'light': 'light' };

    //

    return (
        <div className={ classnames( styles.worldObjectListWrapper, state.openedPanel === 'WorldPanel' ? styles.opened : null ) } onClick={ stopPropagation } onMouseMove={ stopPropagation } >
            <div className={ classnames( styles.panel, ( ! selectedApp && state.openedPanel === 'WorldPanel' ) ? styles.opened : null ) } >
                <div className={ styles.header } >
                    World Tokens ({ apps.length })
                </div>
                {
                    <div className={ styles.objects } >
                    {
                        apps.map( ( app, i ) => (
                            <div className={ classnames( styles.object, app === selectedApp ? styles.selected : null ) } key={ i } onClick={ handleItemClick.bind( this, app ) } onMouseEnter={ handleItemMouseEnter.bind( this, app ) } onMouseLeave={ handleItemMouseLeave.bind( this, app ) } >
                                <img src="images/webpencil.svg" className={ classnames( styles.backgroundInner, styles.lime ) } />
                                {
                                    ( [ 'glb', 'html', 'gltf', 'gif', 'vrm' ].indexOf( app.appType ) !== -1 ) ? (
                                        <Spritesheet
                                            className={ styles.img }
                                            startUrl={ app.contentId }
                                            enabled={ true }
                                            size={ 2048 }
                                            numFrames={ 1 }
                                            animated={ false }
                                            background={ '#000' }
                                        />
                                    ) : (
                                        <img src={ `./images/ui/${ appTypeIcons[ app.appType ] ?? 'gears' }-icon.png` } className={ styles.gearsPlaceHolder } />
                                    )
                                }
                                <div className={ styles.wrap } >
                                    <div className={ styles.name } >{ app.name }</div>
                                    <div className={ styles.type }>{ app.appType }</div>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                }
            </div>
                <div className={ classnames( styles.objectProperties, styles.panel, selectedApp ? styles.opened : null ) } >
                    {
                        selectedApp ? (
                            <>
                                <div className={ styles.header } >
                                    <div className={ classnames( styles.button, styles.back ) } onClick={ handleBackBtn } >
                                        <img src="images/webchevron.svg" className={ styles.img } />
                                    </div>
                                    <div className={ styles.title } >{ selectedApp ? selectedApp.name : null } </div>
                                </div>
                                <div className={ styles.settingsBlock } >
                                    <div className={ styles.subheader } >Position</div>
                                    <div className={ classnames( styles.inputs, styles.pos ) } >
                                        <NumberInput title="X" value={ px } onChange={ handleAppTransformChange.bind( this, 'px' ) } step={ 1 } />
                                        <NumberInput title="Y" value={ py } onChange={ handleAppTransformChange.bind( this, 'py' ) } step={ 1 } />
                                        <NumberInput title="Z" value={ pz } onChange={ handleAppTransformChange.bind( this, 'pz' ) } step={ 1 } />
                                    </div>
                                    <div className={ styles.subheader } >Rotation</div>
                                    <div className={ styles.selectWrapper } >
                                        <div className={ styles.selectWrapperTitle } >Rotation type</div>
                                        <select value={ rotationMode } onChange={ handleSetRotationMode } >
                                            <option value="euler">Euler</option>
                                            <option value="quaternion">Quaternion</option>
                                        </select>
                                    </div>
                                    {
                                        rotationMode === 'euler' ? (
                                            <div className={ classnames( styles.inputs ) } >
                                                <div className={ styles.selectWrapper } >
                                                    <div className={ styles.selectWrapperTitle } >Euler order</div>
                                                    <select value={ rotationEulerOrder } onChange={ handleSetRotationEulerOrder } className={ styles.rotationEulerOrderSelect } >
                                                        <option value="YXZ">YXZ</option>
                                                        <option value="XYZ">XYZ</option>
                                                        <option value="YZX">YZX</option>
                                                        <option value="ZXY">ZXY</option>
                                                        <option value="XZY">XZY</option>
                                                        <option value="ZYX">ZYX</option>
                                                    </select>
                                                </div>
                                                {
                                                    ( rotationEulerOrder[0] === 'X' ) ? (
                                                        <NumberInput title="X" value={ rex.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rex' ) } step={ Math.PI / 2 } />
                                                    ) : ( rotationEulerOrder[0] === 'Y' ) ? (
                                                        <NumberInput title="Y" value={ rey.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rey' ) } step={ Math.PI / 2 } />
                                                    ) : (
                                                        <NumberInput title="Z" value={ rez.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rez' ) } step={ Math.PI / 2 } />
                                                    )
                                                }
                                                {
                                                    ( rotationEulerOrder[1] === 'X' ) ? (
                                                        <NumberInput title="X" value={ rex.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rex' ) } step={ Math.PI / 2 } />
                                                    ) : ( rotationEulerOrder[1] === 'Y' ) ? (
                                                        <NumberInput title="Y" value={ rey.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rey' ) } step={ Math.PI / 2 } />
                                                    ) : (
                                                        <NumberInput title="Z" alue={ rez.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rez' ) } step={ Math.PI / 2 } />
                                                    )
                                                }
                                                {
                                                    ( rotationEulerOrder[2] === 'X' ) ? (
                                                        <NumberInput title="X" value={ rex.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rex' ) } step={ Math.PI / 2 } />
                                                    ) : ( rotationEulerOrder[2] === 'Y' ) ? (
                                                        <NumberInput title="Y" value={ rey.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rey' ) } step={ Math.PI / 2 } />
                                                    ) : (
                                                        <NumberInput title="Z" value={ rez.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rez' ) } step={ Math.PI / 2 } />
                                                    )
                                                }
                                            </div>
                                        ) : (
                                            <div className={ classnames( styles.inputs ) } >
                                                <NumberInput title="X" value={ rqx.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rqx' ) } step={ 0.02 } />
                                                <NumberInput title="Y" value={ rqy.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rqy' ) } step={ 0.02 } />
                                                <NumberInput title="Z" value={ rqz.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rqz' ) } step={ 0.02 } />
                                                <NumberInput title="W" value={ rqw.toFixed( 4 ) } onChange={ handleAppTransformChange.bind( this, 'rqw' ) } step={ 0.02 } />
                                            </div>
                                        )
                                    }
                                    <div className={ styles.subheader } >Scale</div>
                                    <div className={ classnames( styles.inputs, styles.scale ) } >
                                        <NumberInput title="X" value={ sx } onChange={ handleAppTransformChange.bind( this, 'sx' ) } step={ 0.1 } />
                                        <NumberInput title="Y" value={ sy } onChange={ handleAppTransformChange.bind( this, 'sy' ) } step={ 0.1 } />
                                        <NumberInput title="Z" value={ sz } onChange={ handleAppTransformChange.bind( this, 'sz' ) } step={ 0.1 } />
                                    </div>
                                </div>
                                {
                                    ( [ 'glb', 'html', 'gltf', 'gif', 'vrm' ].indexOf( selectedApp.appType ) !== -1 ) ? (
                                        <Spritesheet
                                            className={ styles.objectPreview }
                                            startUrl={ selectedApp.contentId }
                                            enabled={ true }
                                            size={ 2048 }
                                            numFrames={ 128 }
                                            animated={ true }
                                            background={ '#000' }
                                        />
                                    ) : ''
                                }
                            </>
                        ) : null
                    }
                </div>
        </div>
    );

};
