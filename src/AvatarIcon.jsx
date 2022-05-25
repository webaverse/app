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

import styles from './AvatarIcon.module.css';
import { localPlayer } from '../players.js';
import { AvatarIconer } from '../avatar-iconer.js';
import cameraManager from '../camera-manager.js'
import * as sounds from '../sounds.js'

const characterIconSize = 100;
const pixelRatio = window.devicePixelRatio;

const CharacterIcon = () => {
  const [loaded, setLoaded] = useState(false);
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
        }
      };
      world.appManager.addEventListener('frame', frame);

      const enabledchange = e => {
        setLoaded(e.data.enabled);
      };
      avatarIconer.addEventListener('enabledchange', enabledchange);

      return () => {
        avatarIconer.destroy();
        world.appManager.removeEventListener('frame', frame);
        avatarIconer.removeEventListener('enabledchange', enabledchange);
      };
    }
  }, [canvasRef.current]);

  return (
      <div
        className={classnames(
          styles.characterIcon,
          loaded ? styles.loaded : null,
        )}
        onMouseEnter={e => {
          sounds.playSoundName('menuClick');
        }}
      >
          <div className={styles.main}>
              <canvas
                className={styles.canvas}
                width={characterIconSize * pixelRatio}
                height={characterIconSize * pixelRatio}
                ref={canvasRef}
              />
              <img className={styles.placeholderImg} src="./images/arc.svg" />
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

export const AvatarIcon = ({ className }) => {
    const { state, setState } = useContext( AppContext );

    const handleCharacterBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

        if ( state.openedPanel === 'CharacterPanel' ) {

            cameraManager.requestPointerLock();

        }

    };

    return (
        <div
            className={ classnames( className, styles.avatarIcon ) }
            onClick={handleCharacterBtnClick}
        >
            {/* <a href="/" className={styles.logo}>
                <img src="images/arrow-logo.svg" className={styles.image} />
            </a> */}
            <CharacterIcon />
        </div>
    );
};
