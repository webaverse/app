import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
// import { AppContext } from '../../../app';

import styles from './model-ai-panel.module.css';

const size = 512;

export function ModelAiPanel() {
    const canvasRef = useRef();

    //

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            
        }
    }, [canvasRef.current]);
  
    //
  
    const _generate = () => {
      // XXX
    };
  
    //
    
    return (
          <div className={classnames(styles.panel, styles.modelAiPanel)}>
                <textarea className={styles.textarea} placeholder="mysterious forest"></textarea>
                <canvas width={size} height={size} className={styles.canvas} ref={canvasRef} />
                <div className={styles.buttons}>
                    <button className={styles.button} onClick={_generate}>Generate</button>
                </div>
          </div>
      );
  }