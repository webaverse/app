// import * as THREE from 'three';
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
  const {hup, index, hups, setHups} = props;

  const canvasRef = useRef();
  const hupRef = useRef();
  const [localOpen, setLocalOpen] = useState(false);
  const [text, setText] = useState('');
  const [fullText, setFullText] = useState('');

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
    setFullText(hup.fullText);
  }, []);
  useEffect(() => {
    function update(e) {
      setFullText(hup.fullText);
    }
    hup.addEventListener('update', update);
    function destroy(e) {
      setLocalOpen(false);
    }
    hup.addEventListener('destroy', destroy);
    return () => {
      hup.removeEventListener('update', update);
      hup.removeEventListener('destroy', destroy);
    };
  }, [hup]);
  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalOpen(true);
    });
  }, []);
  useEffect(() => {
    if (text.length <= fullText.length) {
      const timeout = setTimeout(() => {
        // XXX this text slicing should be done with a mathematical factor in the hups code
        const newText = text + fullText.charAt(text.length);
        setText(newText);
      }, 50);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [text, fullText]);

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
      <div className={styles.message}>{text}</div>
    </div>
  );
}

export default function CharacterHups({
  localPlayer,
  npcs,
}) {
  const [hups, setHups] = useState([]);

  useEffect(() => {
    function hupadd(e) {
      const newHups = hups.concat([e.data.hup]);
      setHups(newHups);
    }
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    for (const npcPlayer of npcs) {
      npcPlayer.characterHups.addEventListener('hupadd', hupadd);
    }

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      for (const npcPlayer of npcs) {
        npcPlayer.characterHups.removeEventListener('hupadd', hupadd);
      }
    };
  }, [localPlayer, npcs, npcs.length]);

  return (
    <div className={styles['character-hups']}>
      {hups.map((hup, index) => {
        return (
          <CharacterHup
            key={hup.hupId}
            hup={hup}
            index={index}
            hups={hups}
            setHups={setHups}
          />
        );
      })}
    </div>
  );
};