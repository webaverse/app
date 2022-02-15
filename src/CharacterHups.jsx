// import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import styles from './CharacterHups.module.css';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
import {chatTextSpeed} from '../constants.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();

const defaultHupSize = 256;
const pixelRatio = window.devicePixelRatio;

const chatDioramas = new WeakMap();

const CharacterHup = function(props) {
  const {hup, index, hups, setHups} = props;

  const canvasRef = useRef();
  const hupRef = useRef();
  const [localOpen, setLocalOpen] = useState(false);
  const [text, setText] = useState('');
  const [fullText, setFullText] = useState('');

  // console.log('render text', text, hup.fullText);

  useEffect(() => {
    // console.log('effect 1', hup);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const player = hup.parent.player;
      let diorama = chatDioramas.get(player);
      if (diorama) {
        // console.log('got diorama', diorama);
        diorama.resetCanvases();
        diorama.addCanvas(canvas);
      } else {
        diorama = dioramaManager.createPlayerDiorama({
          canvas,
          target: player,
          objects: [
            player.avatar.model,
          ],
          grassBackground: true,
        });
        chatDioramas.set(player, diorama);
        // console.log('no diorama');
      }

      return () => {
        chatDioramas.delete(player);
        diorama.destroy();
      };
    }
  }, [canvasRef]);
  useEffect(() => {
    // console.log('effect 2', hup);
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
  }, [hupRef, localOpen, hups, hups.length]);
  useEffect(() => {
    // console.log('set full text', hup);
    setFullText(hup.fullText);
  }, []);
  useEffect(() => {
    // console.log('effect 3', hup);
    function voicestart(e) {
      console.log('voice start', hup.fullText, e.data, e.data.fullText);
      setLocalOpen(true);
      setFullText(e.data.fullText);
    }
    hup.addEventListener('voicestart', voicestart);
    function destroy(e) {
      setLocalOpen(false);
    }
    hup.addEventListener('destroy', destroy);
    return () => {
      hup.removeEventListener('voicestart', voicestart);
      hup.removeEventListener('destroy', destroy);
    };
  }, [hup, localOpen, fullText]);
  useEffect(() => {
    // console.log('effect 4', hup);
    requestAnimationFrame(() => {
      setLocalOpen(true);
    });
  }, []);
  useEffect(() => {
    // console.log('effect 5', text.length <= fullText.length, text.length, fullText.length);
    if (text.length <= fullText.length) {
      const timeout = setTimeout(() => {
        // XXX this text slicing should be done with a mathematical factor in the hups code
        const newText = text + fullText.charAt(text.length);
        setText(newText);
      }, chatTextSpeed);
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
};

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
    /* function hupremove(e) {
      const oldHup = e.data.hup;
      const index = hups.indexOf(oldHup);
      const newHups = hups.slice();
      newHups.splice(index, 1);
      setHups(newHups);
    } */
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    // localPlayer.characterHups.addEventListener('hupremove', hupremove);
    for (const npcPlayer of npcs) {
      npcPlayer.characterHups.addEventListener('hupadd', hupadd);
      // npcPlayer.characterHups.addEventListener('hupremove', hupremove);
    }

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      // localPlayer.characterHups.removeEventListener('hupremove', hupremove);
      for (const npcPlayer of npcs) {
        npcPlayer.characterHups.removeEventListener('hupadd', hupadd);
        // npcPlayer.characterHups.removeEventListener('hupremove', hupremove);
      }
    };
  }, [localPlayer, npcs, npcs.length, hups, hups.length]);

  return (
    <div className={styles['character-hups']}>
      {hups.map((hup, index) => {
        return (
          <CharacterHup
            key={hup.hupId}
            hup={hup}
            // index={index}
            hups={hups}
            setHups={setHups}
          />
        );
      })}
    </div>
  );
};