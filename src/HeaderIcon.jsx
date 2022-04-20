import React, { useEffect, useRef, useContext, useState } from 'react';
import classnames from 'classnames';

import { AppContext } from './components/app';
import {world} from '../world.js';
import {
  hp,
  mp,
  xp,
  level,
} from '../player-stats.js';

import styles from './HeaderIcon.module.css';
import { localPlayer } from '../players.js';
import { AvatarIconer } from '../avatar-iconer.js';
import cameraManager from '../camera-manager.js'

const characterIconSize = 80;
const pixelRatio = window.devicePixelRatio;

const CharacterIcon = () => {
  const [arrowLogoImage, setArrowlogoImage] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const avatarIconer = new AvatarIconer(localPlayer, {
        width: characterIconSize * pixelRatio,
        height: characterIconSize * pixelRatio,
      });
      avatarIconer.addCanvas(canvas);

      const frame = () => {
        if (avatarIconer.enabled) {
          avatarIconer.update();
        } else if (arrowLogoImage) {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(arrowLogoImage, 0, 0);
        }
      };
      world.appManager.addEventListener('frame', frame);

      return () => {
        avatarIconer.destroy();
        world.appManager.removeEventListener('frame', frame);
      };
    }
  }, [canvasRef.current]);

  return (
      <div className={styles.characterIcon}>
          <div className={styles.main}>
              <canvas
                className={styles.canvas}
                width={characterIconSize * pixelRatio}
                height={characterIconSize * pixelRatio}
                ref={canvasRef}
              />
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