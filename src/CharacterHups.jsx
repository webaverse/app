// import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import {RpgText} from './RpgText.jsx';
import styles from './CharacterHups.module.css';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
import {chatTextSpeed} from '../constants.js';
import {playersManager} from '../players-manager.js';

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
  // const [text, setText] = useState('');
  const [fullText, setFullText] = useState('');

  // console.log('render text', text, hup.fullText);

  useEffect(() => {
    // console.log('effect 1', hup);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const player = hup.parent.player;
      let diorama = chatDioramas.get(player);
      if (diorama) {
        console.log(`already have a diorama`,player)
        diorama.resetCanvases();
        diorama.addCanvas(canvas);
      } else {
        console.log(`create a diorama`, player)
        diorama = dioramaManager.createPlayerDiorama({
          target: player,
          objects: [player.avatar.model],
          grassBackground: true,
        });
        diorama.addCanvas(canvas);
        chatDioramas.set(player, diorama);
      }

      return () => {
        console.log(`destroy diorama from character hups`, player)
        diorama.destroy();
        chatDioramas.delete(player);
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
          console.log(`hup removed`, hup)
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
      // console.log('voice start', hup.fullText, e.data, e.data.fullText);
      setLocalOpen(true);
      setFullText(e.data.fullText);
    }
    hup.addEventListener('voicestart', voicestart);
    function destroy(e) {
      const player = hup.parent.player;
      console.log('hupdestroy', hup, player);
      chatDioramas.delete(player);

      setLocalOpen(false);
    }
    hup.addEventListener('destroy', destroy);
    return () => {
      hup.removeEventListener('voicestart', voicestart);
      hup.removeEventListener('destroy', destroy);
    };
  }, [hup, localOpen]);
  useEffect(() => {
    // console.log('start animation frame', hup);
    const animationFrame = requestAnimationFrame(() => {
      setLocalOpen(true);
    });
    return () => {
      // console.log('end animation frame', hup);
      cancelAnimationFrame(animationFrame);
    };
  }, [hup]);

  // console.log('render hup', hup);

  return (
    <div
      className={classnames(styles['character-hup'], localOpen ? styles['open'] : null)}
      style={{
        top: `${index * defaultHupSize}px`,
      }}
      ref={hupRef}
    >
      <canvas
        width={defaultHupSize*pixelRatio}
        height={defaultHupSize*pixelRatio}
        ref={canvasRef}
      />
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
      <RpgText className={styles.message} styles={styles} textSpeed={chatTextSpeed} text={fullText}></RpgText>
    </div>
  );
};

export default function CharacterHups({
  localPlayer,
  npcs,
  remotePlayers
}) {
  const [hups, setHups] = useState([]);

  useEffect(() => {
    function hupadd(e) {
      const newHups = hups.concat([e.data.hup]);
      console.log('new hups', newHups);
      setHups(newHups);
    }
    function hupremove(e) {
      const oldHup = e.data.hup;
      console.log('hupremove', oldHup, hups);
      const index = hups.indexOf(oldHup);
      const newHups = hups.slice();
      newHups.splice(index, 1);
      oldHup.destroy();
      setHups(newHups);
    }
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    localPlayer.characterHups.addEventListener('hupremove', hupremove);
    for (const npcPlayer of npcs) {
      npcPlayer.characterHups.addEventListener('hupadd', hupadd);
      npcPlayer.characterHups.addEventListener('hupremove', hupremove);
    }

    const remotePlayers = playersManager.getRemotePlayers();
    for (const remotePlayer in remotePlayers) {
      remotePlayer.characterHups.addEventListener('hupadd', hupadd);
      remotePlayer.characterHups.addEventListener('hupremove', hupremove);
    }

    const handlePlayerAdd = (e) => {
      e.data.player.characterHups.addEventListener('hupadd', hupadd);
      e.data.player.characterHups.addEventListener('hupremove', hupremove);

    }

    const handlePlayerRemove = (e) => {
      e.data.player.characterHups.removeEventListener('hupadd', hupadd);
      e.data.player.characterHups.removeEventListener('hupremove', hupremove);
    }

    playersManager.addEventListener('playeradded', handlePlayerAdd);
    playersManager.addEventListener('playerremoved', handlePlayerRemove);

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      localPlayer.characterHups.removeEventListener('hupremove', hupremove);
      for (const npcPlayer of npcs) {
        npcPlayer.characterHups.removeEventListener('hupadd', hupadd);
        npcPlayer.characterHups.removeEventListener('hupremove', hupremove);
      }
      for (const remotePlayer in remotePlayers) {
        remotePlayer.characterHups.removeEventListener('hupadd', hupadd);
        remotePlayer.characterHups.removeEventListener('hupremove', hupremove);
      }
    };
  }, [localPlayer, npcs, remotePlayers, hups]);

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
