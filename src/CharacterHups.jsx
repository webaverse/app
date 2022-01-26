import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import styles from './CharacterHups.module.css';
import metaversefile from 'metaversefile';
const {useLocalPlayer} = metaversefile;

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();

const defaultHupSize = 256;
const pixelRatio = window.devicePixelRatio;

function CharacterHup(props) {
  const {hup, hups, setHups} = props;

  const canvasRef = useRef();
  const hupRef = useRef();
  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const player = hup.parent.player;
      const diorama = dioramaManager.createPlayerDiorama(player, {
        canvas,
        grassBackground: true,
      });

      return () => {
        diorama.destroy();
      };
    }
  }, [canvasRef.current]);
  useEffect(() => {
    if (hupRef.current) {
      const hupEl = hupRef.current;
      function transitionend() {
        if (!localOpen) {
          const hupIndex = hups.indexOf(hup);
          const newHups = hups.slice();
          newHups.splice(hupIndex, 1);
          setHups(newHups);
        }
      };
      hupEl.addEventListener('transitionend', transitionend);

      return () => {
        hupEl.removeEventListener('transitionend', transitionend);
      };
    }
  }, [hupRef.current, localOpen]);
  useEffect(() => {
    function destroy(e) {
      setLocalOpen(false);
    }
    hup.addEventListener('destroy', destroy);
    return () => {
      hup.removeEventListener('destroy', destroy);
    };
  }, [hup]);
  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalOpen(true);
    });
  }, []);

  // console.log('got hup', hup);

  return (
    <div className={classnames(styles['character-hup'], localOpen ? styles['open'] : null)} ref={hupRef}>
      <canvas width={defaultHupSize*pixelRatio} height={defaultHupSize*pixelRatio} ref={canvasRef} />
      <div className={styles.name}>
        <div className={styles.bar} />
        <h1>{hup.playerName}</h1>
        <h2>Lv. 9</h2>
        {/* <div className={styles.stats}>
          <div className={styles.stat}>
            <h3>HP</h3>
            <progress value={61} />
          </div>
          <div className={styles.stat}>
            <h3>MP</h3>
            <progress value={83} />
          </div>
        </div> */}
      </div>
      <div className={styles.message}>{hup.fullText}</div>
    </div>
  );
}

export default function CharacterHups() {
  const [hups, setHups] = useState([]);

  useEffect(() => {
    const localPlayer = useLocalPlayer();
    function hupadd(e) {
      const newHups = hups.concat([e.data.hup]);
      setHups(newHups);
    }
    /* function hupremove(e) {
      e.data.hup.setOpen(false);
    } */
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    // localPlayer.characterHups.addEventListener('hupremove', hupremove);

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      // localPlayer.characterHups.removeEventListener('hupremove', hupremove);
    };
  }, []);

  return (
    <div className={styles['character-hups']}>
      {hups.map((hup, i) => {
        return (
          <CharacterHup key={hup.hupId} hup={hup} hups={hups} setHups={setHups} />
        );
      })}
    </div>
  );
};