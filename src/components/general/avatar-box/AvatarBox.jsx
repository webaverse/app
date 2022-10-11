import React, {useEffect, useRef, useContext, useState} from 'react';
import classnames from 'classnames';

import {AppContext} from '../../app';
import {world} from '../../../../world.js';
import {hp, mp, xp, level} from '../../../../player-stats.js';

import styles from './AvatarBox.module.css';
import {PlaceholderImg} from '../../../PlaceholderImg.jsx';
import {playersManager} from '../../../../players-manager.js';
import {AvatarIconer} from '../../../../avatar-iconer.js';
import cameraManager from '../../../../camera-manager.js';
import * as sounds from '../../../../sounds.js';

const characterIconSize = 100;
const pixelRatio = window.devicePixelRatio;

const CharacterBox = () => {
  const {avatarLoaded, setAvatarLoaded} = useContext(AppContext);
  const [userData, setUserData] = useState({
    name: 'Anon',
    level: level,
    hp: 0,
    mp: 0,
    xp: 0,
    limit: 0,
  });

  // Temporary, will be changed with the actual API call to fetch user info.
  useEffect(() => {
    setTimeout(() => {
      setUserData({
        name: 'Anon',
        level: level,
        hp: hp,
        mp: mp,
        xp: xp,
        limit: 67,
      });
    }, 600);
  }, []);

  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const localPlayer = playersManager.getLocalPlayer();
      const avatarIconer = new AvatarIconer(localPlayer, {
        width: characterIconSize * pixelRatio,
        height: characterIconSize * pixelRatio,
      });
      avatarIconer.addCanvas(canvas);

      const frame = () => {
        if (avatarIconer.enabled) {
          avatarIconer.update();
          setAvatarLoaded(true);
        }
      };
      world.appManager.addEventListener('frame', frame);

      return () => {
        avatarIconer.destroy();
        world.appManager.removeEventListener('frame', frame);
      };
    }
  }, [canvasRef, avatarLoaded]);

  return (
    <div
      className={classnames(styles.avatarBox, avatarLoaded ? styles.loaded : null)}
      onMouseEnter={e => {
        sounds.playSoundName('menuClick');
      }}
    >
      <div className={styles.main}>
        <PlaceholderImg className={styles.placeholderImg} />
        <canvas
          className={styles.canvas}
          width={characterIconSize * pixelRatio}
          height={characterIconSize * pixelRatio}
          ref={canvasRef}
        />
        <div className={styles.tab}>Tab</div>
        <div className={styles.meta}>
          <div className={styles.info}>
            <span className={styles.name}>{userData?.name}</span>
            <span className={styles.level}>{level}</span>
            <div className={styles.background} />
          </div>
          <div className={classnames(styles.stats)}>
            <div className={classnames(styles.background)} />
            <div className={classnames(styles.bgCorner)} />
            <div className={classnames(styles.stat, styles.hp)}>
              <div className={styles.progressBar}>
                <div style={{width: `${userData?.hp}%`}} />
              </div>
              <div className={styles.value}>{hp}</div>
            </div>
            <div className={classnames(styles.stat, styles.mp)}>
              <div className={styles.progressBar}>
                <div style={{width: `${userData?.mp}%`}} />
              </div>
              <div className={styles.value}>{mp}</div>
            </div>
            <div className={classnames(styles.stat, styles.xp)}>
              <div className={styles.progressBar}>
                <div style={{width: `${userData?.xp}%`}} />
              </div>
              <div className={styles.value}>{xp}</div>
            </div>
          </div>
          <div className={classnames(styles.limitBar)}>
            <div className={classnames(styles.background)} />
            <div className={styles.progressBar}>
              <div style={{width: `${userData?.limit}%`}}>
                <div />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AvatarBox = ({className}) => {
  const {state, setState} = useContext(AppContext);

  const handleCharacterBtnClick = () => {
    setState({
      openedPanel:
        state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel',
    });

    if (state.openedPanel === 'CharacterPanel') {
      cameraManager.requestPointerLock();
    }
  };

  return (
    <div
      className={classnames(className, styles.avatarBoxWrap)}
      onClick={handleCharacterBtnClick}
    >
      <CharacterBox />
    </div>
  );
};
