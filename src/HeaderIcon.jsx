import * as THREE from 'three';
import React, { useEffect, useRef, useContext, useState } from 'react';
import classnames from 'classnames';

// import CharacterHups from './CharacterHups.jsx';
// import game from '../game.js'
// import * as hacks from '../hacks.js'
import cameraManager from '../camera-manager.js'
import metaversefile from '../metaversefile-api.js'
// import ioManager from '../io-manager.js'

// import { Character } from './components/general/character';
// import { CharacterSelect } from './components/general/character-select';
// import { Inventory } from './components/general/inventory';
// import { Tokens } from './tabs/tokens';
// import { registerIoEventHandler, unregisterIoEventHandler } from './components/general/io-handler';
import { AppContext } from './components/app';
// import { User } from './User';
import {emotions} from './components/general/character/Emotions';
import {screenshotPlayer} from '../avatar-screenshotter.js';
import npcManager from '../npc-manager.js';
import {
  hp,
  mp,
  xp,
  level,
} from '../player-stats.js';

import styles from './HeaderIcon.module.css';

const pixelRatio = window.devicePixelRatio;
const characterIconSize = 80;
const cameraOffset = new THREE.Vector3(0, 0.05, -0.35);

const allEmotions = [''].concat(emotions);

const CharacterIcon = () => {
    const canvasRefs = [];
    const canvases = (() => {
        const result = [];
        for (let i = 0; i < allEmotions.length; i++) {
            const canvasRef = useRef();
            const canvas = (
                <canvas
                    className={styles.canvas}
                    width={characterIconSize * pixelRatio}
                    height={characterIconSize * pixelRatio}
                    ref={canvasRef}
                    key={i}
                />
            );
            result.push(canvas);
            canvasRefs.push(canvasRef);
        }
        return result;
    })();

    useEffect(() => {
        if (canvasRefs.every(ref => !!ref.current)) {
            (async () => {
                const avatarApp = await metaversefile.createAppAsync({
                    start_url: `./avatars/scillia_drophunter_v15_vian.vrm`, // XXX use the current avatar contentId
                });
                const player = npcManager.createNpc({
                    name: 'character-icon-npc',
                    avatarApp,
                    detached: true,
                });

                for (let i = 0; i < allEmotions.length; i++) {
                    const emotion = allEmotions[i];
                    const canvas = canvasRefs[i].current;
                    await screenshotPlayer({
                        player,
                        canvas,
                        cameraOffset,
                        emotion,
                    });
                }
            })()
        }
    }, canvasRefs.map(ref => ref.current));

    return (
        <div className={styles.characterIcon}>
            <div className={styles.main}>
                {canvases}
                <div className={styles.meta}>
                    <div className={styles.text}>
                        <div className={styles.background} />
                        <span className={styles.name}>Anon</span>
                        <span className={styles.level}>Lv. {level}</span>
                    </div>
                    <div className={classnames(styles.stat, styles.hp)}>
                        <div className={styles.label}>HP</div>
                        <progress className={styles.progress} value={hp} max={100} />
                        <div className={styles.value}>{hp}</div>
                    </div>
                    <div className={classnames(styles.stat, styles.mp)}>
                        <div className={styles.label}>MP</div>
                        <progress className={styles.progress} value={mp} max={100} />
                        <div className={styles.value}>{mp}</div>
                    </div>
                    <div className={classnames(styles.stat, styles.xp)}>
                        <img className={styles.barImg} src={`./images/xp-bar.svg`} />
                        <div className={styles.label}>XP</div>
                        <div className={styles.value}>{xp}</div>
                        <progress className={styles.progress} value={xp} max={100} />
                    </div>
                    <div className={styles.limitBar}>
                        <div className={styles.inner} />
                        <div className={styles.label}>Limit</div>
                    </div>
                </div>
            </div>
            <div className={styles.sub}>
                <div className={styles.buttonWrap}>
                    <div className={styles.button}>Tab</div>
                </div>
            </div>
        </div>
    );
};

export const HeaderIcon = () => {
    const { state, setState } = useContext( AppContext );

    const handleCharacterBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

        if ( state.openedPanel === 'CharacterPanel' ) {

            cameraManager.requestPointerLock();

        }

    };

    return (
        <div
            className={styles.headerIcon}
            onClick={handleCharacterBtnClick}
        >
            {/* <a href="/" className={styles.logo}>
                <img src="images/arrow-logo.svg" className={styles.image} />
            </a> */}
            <CharacterIcon />
        </div>
    );
};