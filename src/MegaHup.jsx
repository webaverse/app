import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
// import dioramaManager from '../diorama.js';
// import game from '../game.js';
import dioramaManager from '../diorama.js';
// import {NpcPlayer} from '../character-controller.js';
import {world} from '../world.js';
import styles from './MegaHup.module.css';
// import {RpgText} from './RpgText.jsx';
// import {chatTextSpeed} from '../constants.js';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
// import {chatTextSpeed} from '../constants.js';

const MegaHup = function ({open = false, npcPlayer = null}) {
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);

  const canvasRef = useRef();

  useEffect(() => {
    const resize = e => {
      setHeight(e.target.innerHeight);
      setWidth(e.target.innerWidth);
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && npcPlayer) {
      let live = true;
      let diorama = null;
      {
        diorama = dioramaManager.createPlayerDiorama({
          target: npcPlayer,
          objects: [npcPlayer.avatar.avatarRenderer.scene],
          cameraOffset: new THREE.Vector3(-0.8, 0, -0.4),
          // label: true,
          // outline: true,
          // grassBackground: true,
          // glyphBackground: true,
          dotsBackground: true,
        });
        diorama.addCanvas(canvas);
        diorama.enabled = true;
      }

      const frame = e => {
        const {timestamp, timeDiff} = e.data;
        if (diorama) {
          diorama.update(timestamp, timeDiff);
        }
      };
      world.appManager.addEventListener('frame', frame);
      const resize = e => {
        // console.log('diorama set size', width, window.innerHeight);
        diorama.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', resize);

      return () => {
        if (diorama) {
          diorama.removeCanvas(canvas);
          diorama.destroy();
        }
        world.appManager.removeEventListener('frame', frame);
        window.removeEventListener('resize', resize);
        live = false;
      };
    }
  }, [canvasRef, npcPlayer]);

  return (
    <div className={classnames(styles.megaHup, open ? styles.open : null)}>
      {/* <RpgText className={styles.text} styles={styles} text={text} textSpeed={chatTextSpeed} /> */}
      {npcPlayer ? (
        <canvas
          className={styles.canvas}
          width={width}
          height={height}
          ref={canvasRef}
        />
      ) : null}
    </div>
  );
};
export {MegaHup};
