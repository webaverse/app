import * as THREE from 'three';
import React, {useState, useRef, useEffect} from 'react';
import styles from './infobox.module.css';
// import metaversefileApi from 'metaversefile';
// import loadoutManager from '../../../../loadout-manager.js';
// import {hotbarSize} from '../../../../constants.js';
import {world} from '../../../../world.js';
import {getRenderer} from '../../../../renderer.js';
import easing from '../../../../easing.js';
import {createObjectSprite} from '../../../../object-spriter.js';
import loadoutManager from '../../../../loadout-manager.js';

const infoboxSize = new THREE.Vector3(600, 300);
const screenshotSize = 100;

export const Infobox = () => {
    const canvasRef = useRef();

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const infoboxRenderer = loadoutManager.getInfoboxRenderer();
            infoboxRenderer.addCanvas(canvas);

            return () => {
                infoBoxRenderer.removeCanvas(canvas);
            };
        }
    }, [canvasRef]);

    return (
        <div className={ styles.infobox } >
            <canvas width={screenshotSize} height={screenshotSize} className={ styles.screenshot } ref={canvasRef} />
            <div className={ styles.background }>
              <div className={ styles['background-1'] } />
              <div className={ styles['background-2'] } />
            </div>
            <div className={ styles.content }>
                <div className={ styles.row }>
                    <h1>
                        SilSword
                    </h1>
                    <h2>
                        Lv. 3
                    </h2>
                </div>
                {/* <div className={ styles.row }>
                    <div className={ styles.pill }>
                        Weapon
                    </div>
                </div> */}
                <div className={ styles.row }>
                    <div className={ styles.stat }>
                        <div className={ styles.label }>
                            DPS
                        </div>
                        <div className={ styles.value }>
                            130
                        </div>
                    </div>
                </div>
                <div className={ styles.exp }>
                    <div className={ styles.label }>
                        EXP
                    </div>
                    <progress className={ styles.progress } value={0.83}></progress>
                </div>
            </div>
        </div>
    );

};
