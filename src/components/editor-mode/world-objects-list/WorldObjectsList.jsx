
import React from 'react';
import classnames from 'classnames';

import metaversefile from '../../../../metaversefile-api.js';

import styles from './world-objects-list.module.css';

//

export const WorldObjectsList = ({  }) => {

    return (
        <div className={ styles.worldObjectListWrapper }>
            <div className={ styles.openBtn }>World objects</div>
            <div className={ styles.list }>
                <div className={ styles.header }>
                    <h1>Tokens</h1>
                </div>
                {/* <div className={ styles.objects }>
                    {
                        apps.map( ( app, i ) => (
                            <div className={classnames(styles.object, app === selectedApp ? styles.selected : null)} key={i} onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                const physicsObjects = app.getPhysicsObjects();
                                const physicsObject = physicsObjects[0] || null;
                                const physicsId = physicsObject ? physicsObject.physicsId : 0;
                                selectApp(app, physicsId);

                                const localPlayer = metaversefile.useLocalPlayer();
                                localPlayer.lookAt(app.position);
                            }} onMouseEnter={e => {
                                const physicsObjects = app.getPhysicsObjects();
                                const physicsObject = physicsObjects[0] || null;
                                const physicsId = physicsObject ? physicsObject.physicsId : 0;

                                game.setMouseHoverObject(null);
                                game.setMouseDomHoverObject(app, physicsId);
                                }} onMouseLeave={e => {
                                game.setMouseDomHoverObject(null);
                                }} onMouseMove={e => {
                                e.stopPropagation();
                                // game.setMouseSelectedObject(null);
                            }}>
                                <img src="images/webpencil.svg" className={classnames(styles['background-inner'], styles.lime)} />
                                <img src="images/object.jpg" className={styles.img} />
                                <div className={styles.wrap}>
                                    <div className={styles.name}>{app.contentId.replace(/^[\s\S]*\/([^\/]+)$/, '$1')}</div>
                                </div>
                            </div>
                        ))
                    }
                </div> */}
            </div>
        </div>
    );

};
