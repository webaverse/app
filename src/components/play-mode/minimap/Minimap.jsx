
import React, {useState, useRef, useEffect} from 'react';
import minimapManager from '../../../../minimap.js';

import styles from './minimap.module.css';

//

let minimap = null;
const minimapSize = 128;
const minimapWorldSize = 50;

export const Minimap = () => {
    const canvasRef = useRef();

    useEffect(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;

          if (!minimap) {
            minimap = minimapManager.createMiniMap(minimapSize, minimapSize, minimapWorldSize, minimapWorldSize);
          }
          minimap.resetCanvases();
          minimap.addCanvas(canvas);
        }
      }, [canvasRef.current]);

    return (
        <div className={ styles.locationMenu } >

            <canvas width={minimapSize} height={minimapSize} className={ styles.map } ref={canvasRef} />

        </div>
    );

};