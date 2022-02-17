
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world.js'
import game from '../../../../game.js'
import metaversefile from '../../../../metaversefile-api.js';

import styles from './world-objects-list.module.css';

//

export const WorldObjectsList = ({ app, opened, setOpened }) => {

    const [ apps, setApps ] = useState( world.appManager.getApps().slice() );
    const [ selectedApp, setSelectedApp ] = useState( null );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const selectApp = ( app, physicsId, position ) => {

        game.setMouseSelectedObject( app, physicsId, position );

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
        window.addEventListener( 'mousedown', handleOnFocusLost );

        return () => {

            world.appManager.removeEventListener( 'appadd', update );
            world.appManager.removeEventListener( 'appremove', update );
            window.removeEventListener( 'mousedown', handleOnFocusLost );

        };

    }, [] );

    //

    return (
        <div className={ styles.worldObjectListWrapper } onClick={ stopPropagation } >
            <div className={ classnames( styles.list, opened ? styles.opened : null ) } >
                <div className={ styles.header } >
                    <h1>Tokens</h1>
                </div>
                {
                    <div className={ styles.objects } >
                    {
                        apps.map( ( app, i ) => (
                            <div className={ classnames( styles.object, app === selectedApp ? styles.selected : null ) } key={ i } onMouseUp={ handleItemClick.bind( this, app ) } onMouseEnter={ handleItemMouseEnter.bind( this, app ) } onMouseLeave={ handleItemMouseLeave.bind( this, app ) } >
                                <img src="images/webpencil.svg" className={ classnames( styles.backgroundInner, styles.lime ) } />
                                <img src="images/object.jpg" className={ styles.img } />
                                <div className={ styles.wrap } >
                                    <div className={ styles.name } >{ app.contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1') }</div>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                }
                {
                    selectedApp ? (
                        <div className={styles.panel} key="right">
                            <div className={styles['panel-header']}>
                                <div className={classnames(styles.button, styles.back)} onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedApp(null);
                                }}>
                                <img src="images/webchevron.svg" className={styles.img} />
                            </div>
                            <h1>{_formatContentId(selectedApp.contentId)}</h1>
                        </div>
                        <div className={styles['panel-subheader']}>Position</div>
                        <div className={styles.inputs}>
                            <NumberInput input={px} />
                            <NumberInput input={py} />
                            <NumberInput input={pz} />
                        </div>
                        <div className={styles['panel-subheader']}>Rotation</div>
                        <div className={styles.inputs}>
                            <NumberInput input={rx} />
                            <NumberInput input={ry} />
                            <NumberInput input={rz} />
                        </div>
                        <div className={styles['panel-subheader']}>Scale</div>
                        <div className={styles.inputs}>
                            <NumberInput input={sx} />
                            <NumberInput input={sy} />
                            <NumberInput input={sz} />
                        </div>
                    </div>
                ) : null
            }
            </div>
        </div>
    );

};
