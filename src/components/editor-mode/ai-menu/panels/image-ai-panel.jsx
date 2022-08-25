import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';
// import { AppContext } from '../../../app';

import styles from './image-ai-panel.module.css';

const size = 512;

export function ImageAiPanel() {
    const canvasRef = useRef();

    //

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            
        }
    }, [canvasRef.current]);

    //

    const _generate = () => {
        /* const output = outputTextarea.current.value;
        const dataUri = metaversefile.createModule(output);

        (async () => {

            // XXX unlock this
            // await metaversefile.load(dataUri);

        })();

        setState({ openedPanel: null }); */
    };

    //
    
    return (
        <div className={classnames(styles.panel, styles.imageAiPanel)}>
            <textarea className={styles.textarea} placeholder="mysterious forest"></textarea>
            <canvas width={size} height={size} className={styles.canvas} ref={canvasRef} />
            <div className={styles.buttons}>
                <button className={styles.button} onClick={_generate}>Generate</button>
            </div>
        </div>
    );
}