// import * as THREE from 'three';
import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './infobox.module.css';
import loadoutManager from '../../../../loadout-manager.js';
import alea from '../../../../procgen/alea.js';

const screenshotSize = 100;

export const Infobox = ({ className }) => {
    const canvasRef = useRef();
    const [selectedApp, setSelectedApp] = useState(null);

    const rng = selectedApp ? alea(selectedApp.contentId) : null;
    const level = rng ? 1 + Math.floor((rng() ** 3) * 99) : 0;
    const dps = rng ? Math.floor((rng() ** 3) * 1000) : 0;
    const exp = rng ? Math.floor((rng() ** 3) * 100) : 0;

    let name = selectedApp ? selectedApp.name : '';
    if (selectedApp && !name) {
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
            const {index, app} = e.data;
            if (index === -1 || app) {
                setSelectedApp(app);
            }
        }
        loadoutManager.addEventListener('selectedchange', selectedchange);
        return () => {
            loadoutManager.removeEventListener('selectedchange', selectedchange);
        };
    }, []);

    return (
        <div className={ classnames( className, styles.infobox, selectedApp ? styles.selected : null) } >
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
            <div className={ styles.hints }>
                <div className={ styles.hint }>
                    <div className={ styles.key }>LMB</div>
                    <div className={ styles.label }>Use</div>
                </div>
                <div className={ styles.hint }>
                    <div className={ styles.key }>Q</div>
                    <div className={ styles.label }>Lore</div>
                </div>
                <div className={ styles.hint }>
                    <div className={ styles.key }>R</div>
                    <div className={ styles.label }>Drop</div>
                </div>
          </div>
        </div>
    );

};
