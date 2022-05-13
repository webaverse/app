
import classNames from 'classnames';
import React, {useState, useRef, useEffect, useContext} from 'react';

import minimapManager from '../../../../minimap.js';
import { AppContext } from '../../app/index.jsx';

import styles from './minimap.module.css';

//

let minimap = null;
const canvasSize = 180 * window.devicePixelRatio;
const minimapSize = 2048*3;
const minimapWorldSize = 400;
const minimapMinZoom = 0.1;
const minimapBaseSpeed = 30;

export const Minimap = () => {

    const { uiMode } = useContext( AppContext );
    const canvasRef = useRef();

    useEffect(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;

          if (!minimap) {
            minimap = minimapManager.createMiniMap(
                minimapSize, minimapSize,
                minimapWorldSize, minimapWorldSize,
                minimapMinZoom,
                minimapBaseSpeed
            );
          }
          minimap.resetCanvases();
          minimap.addCanvas(canvas);
        }
      }, [canvasRef.current]);

    return (
        <div className={ classNames( styles.locationMenu, uiMode === 'none' ? styles.hiddenUI : null ) } >

            <canvas width={canvasSize} height={canvasSize} className={ styles.map } ref={canvasRef} />

        </div>
    );

};