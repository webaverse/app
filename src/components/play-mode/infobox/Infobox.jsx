import * as THREE from 'three';
import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './infobox.module.css';
// import metaversefileApi from 'metaversefile';
// import loadoutManager from '../../../../loadout-manager.js';
// import {hotbarSize} from '../../../../constants.js';
/* import {world} from '../../../../world.js';
import {getRenderer} from '../../../../renderer.js';
import easing from '../../../../easing.js';
import {createObjectSprite} from '../../../../object-spriter.js'; */
import loadoutManager from '../../../../loadout-manager.js';
import alea from '../../../../alea.js';

// const infoboxSize = new THREE.Vector3(600, 300);
const screenshotSize = 100;

export const Infobox = () => {
    const canvasRef = useRef();
    const [selectedApp, setSelectedApp] = useState(null);

    const rng = selectedApp ? alea(selectedApp.contentId) : null;
    const level = rng ? 1 + Math.floor((rng() ** 3) * 99) : 0;
    const dps = rng ? Math.floor((rng() ** 3) * 1000) : 0;
    const exp = rng ? Math.floor((rng() ** 3) * 100) : 0;

    let name = selectedApp ? selectedApp.name : '';
    if (name) {
        console.warn('app has no name', selectedApp);
        name = 'MissingNo.';
    }

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
    useEffect(() => {
        function selectedchange(e) {
            const {app} = e.data;
            if (app) {
              setSelectedApp(app);
            }
        }
        loadoutManager.addEventListener('selectedchange', selectedchange);
        return () => {
            loadoutManager.removeEventListener('selectedchange', selectedchange);
        };
    }, []);

    return (
        <div className={ classnames(styles.infobox, selectedApp ? styles.selected : null) } >
            <canvas width={screenshotSize} height={screenshotSize} className={ styles.screenshot } ref={canvasRef} />
            <div className={ styles.background }>
              <div className={ styles['background-1'] } />
              <div className={ styles['background-2'] } />
            </div>
            <div className={ styles.content }>
                {selectedApp ? <>
                    <div className={ styles.row }>
                        <h1>{name}</h1>
                        <h2>Lv. {level}</h2>
                    </div>
                    {/* <div className={ styles.row }>
                        <div className={ styles.pill }>
                            Weapon
                        </div>
                    </div> */}
                    <div className={ styles.row }>
                        <div className={ styles.stat }>
                            <div className={ styles.label }>DPS</div>
                            <div className={ styles.value }>{dps}</div>
                        </div>
                    </div>
                    <div className={ classnames(styles.row, styles.exp) }>
                        <div className={ styles.label }>EXP</div>
                        <progress className={ styles.progress } value={exp} max={100}></progress>
                    </div>
                </> : null}
            </div>
        </div>
    );

};
