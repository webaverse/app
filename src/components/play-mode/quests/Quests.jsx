// import * as THREE from 'three';
import React, {useState, useRef, useEffect} from 'react';
// import classnames from 'classnames';
import styles from './quests.module.css';
// import loadoutManager from '../../../../loadout-manager.js';
import {Spritesheet} from '../../general/spritesheet';
// import spritesheetManager from '../../../../spritesheet-manager.js';
// import alea from '../../../../procgen/alea.js';

const screenshotSize = 150;

const size = 2048;
const numFrames = 128;
const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
const frameSize = size / numFramesPerRow;
const frameLoopTime = 2000;
const frameTime = frameLoopTime / numFrames;

export const Drop = ({
    drop,
    enabled,
}) => {
    const {name, quantity, start_url} = drop;

    return (
        <div className={ styles.drop }>
            <Spritesheet
                className={styles.canvas}
                startUrl={start_url}
                enabled={enabled}
                size={size}
                numFrames={numFrames}
            />

            <div className={ styles.quantity }>{quantity}</div>
            <div className={ styles.name }>{name}</div>
        </div>
    );
};
export const Quest = ({
    quest,
    enabled,
}) => {
    const canvasRef = useRef();

    const {name, description, drops} = quest;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            /* const infoboxRenderer = loadoutManager.getInfoboxRenderer();
            infoboxRenderer.addCanvas(canvas); */

            return () => {
                // infoBoxRenderer.removeCanvas(canvas);
            };
        }
    }, [canvasRef]);

    return (
        <div className={ styles.quest } >
            <div className={ styles.background } />
            <canvas className={ styles.screenshot } width={screenshotSize} height={screenshotSize} ref={canvasRef} />
            <div className={ styles.content }>
                <h1 className={ styles.heading }>{name}</h1>
                <div className={ styles.description }>{description}</div>
                <div className={ styles.drops }>
                    {quest.drops.map((drop, i) => {
                        return (
                            <Drop
                                drop={drop}
                                enabled={enabled}
                                key={i}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );

};
export const Quests = () => {
    const [ enabled, setEnabled ] = useState(true);
    const [ quests, useQuests ] = useState([{
        name: 'Blob destruction',
        description: 'Destroy all blobs in the area',
        drops: [
            {
                name: 'Silk',
                quantity: 20,
                start_url: '../metaverse_modules/silk/',
            },
        ],
    }]);

    return (
        <div className={styles.quests}>
            {quests.map((quest, i) => {
                return (
                    <Quest
                        quest={quest}
                        enabled={enabled}
                        key={i}
                    />
                );
            })}
        </div>
    );
};