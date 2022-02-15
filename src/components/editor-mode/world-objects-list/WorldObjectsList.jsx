
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world.js'
import game from '../../../../game.js'
import metaversefile from '../../../../metaversefile-api.js';

import styles from './world-objects-list.module.css';

//

export const WorldObjectsList = ({ app }) => {

    const [ opened, setOpened ] = useState( false );
    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );
    const [ selectedApp, setSelectedApp ] = useState( null );

    //

    const selectApp = ( app, physicsId, position ) => {

        game.setMouseSelectedObject( app, physicsId, position );

    };

    const handleWorldObjectsBtnClick = ( event ) => {

        event.stopPropagation();
        setOpened( true );

    };

    const handleItemClick = () => {

        e.preventDefault();
        e.stopPropagation();

        const physicsObjects = app.getPhysicsObjects();
        const physicsObject = physicsObjects[0] || null;
        const physicsId = physicsObject ? physicsObject.physicsId : 0;
        selectApp( app, physicsId );

        const localPlayer = metaversefile.useLocalPlayer();
        localPlayer.lookAt( app.position );

    };

    const handleItemMouseEnter = () => {

        const physicsObjects = app.getPhysicsObjects();
        const physicsObject = physicsObjects[0] || null;
        const physicsId = physicsObject ? physicsObject.physicsId : 0;

        game.setMouseHoverObject( null );
        game.setMouseDomHoverObject( app, physicsId );

    };

    const handleItemMouseLeave = () => {

        game.setMouseDomHoverObject( null );

    };

    const handleOnFocusLost = () => {

        setOpened( false );

    };

    //

    useEffect(() => {

        const update = () => {

            setApps( world.appManager.getApps().slice() );

        };

        world.appManager.addEventListener( 'appadd', update );
        world.appManager.addEventListener( 'appremove', update );
        window.addEventListener( 'click', handleOnFocusLost );

        return () => {

            world.appManager.removeEventListener( 'appadd', update );
            world.appManager.removeEventListener( 'appremove', update );
            window.removeEventListener( 'click', handleOnFocusLost );

        };

    }, [] );

    //

    return (
        <div className={ styles.worldObjectListWrapper }>
            <div className={ styles.worldObjectsBtn } onClick={ handleWorldObjectsBtnClick }>World objects</div>
            <div className={ classnames( styles.list, opened ? styles.opened : null ) }>
                <div className={ styles.header }>
                    <h1>Tokens</h1>
                </div>
                {
                    <div className={ styles.objects }>
                    {
                        apps.map( ( app, i ) => (
                            <div className={ classnames( styles.object, app === selectedApp ? styles.selected : null ) } key={ i } onClick={ handleItemClick } onMouseEnter={ handleItemMouseEnter } onMouseLeave={ handleItemMouseLeave }>
                                <img src="images/webpencil.svg" className={ classnames( styles.backgroundInner, styles.lime ) } />
                                <img src="images/object.jpg" className={ styles.img } />
                                <div className={ styles.wrap }>
                                    <div className={ styles.name }>{ app.contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1') }</div>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                }
            </div>
        </div>
    );

};
