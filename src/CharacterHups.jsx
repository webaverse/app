import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import dioramaManager from '../diorama.js';
import styles from './CharacterHups.module.css';
import metaversefile from 'metaversefile';
const {useLocalPlayer} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const defaultHupSize = 256;

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
    function open(e) {
      setLocalOpen(e.data.open);
    }
    hup.addEventListener('open', open);
    return () => {
      hup.removeEventListener('open', open);
    } ;
  }, [hup]);
  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalOpen(true);
    });
  }, []);

  console.log('render open', localOpen);
  return (
    <div className={classnames(styles['character-hup'], localOpen ? styles['open'] : null)} ref={hupRef}>
      <canvas width={defaultHupSize} height={defaultHupSize} ref={canvasRef} />
      <div className={styles.name}>
        {props.actionId}
      </div>
    </div>
  );
}

export default function CharacterHups() {
  const [hups, setHups] = useState([]);

  useEffect(() => {
    const localPlayer = useLocalPlayer();
    function hupadd(e) {
      // console.log('hup add', e.data);
      const newHups = hups.concat([e.data.hup]);
      setHups(newHups);
    }
    function hupremove(e) {
      // console.log('hup remove', e.data);
      // const newHups = hups.slice();
      // const hupIndex = hups.find(e.data.hup);
      // newHups.splice(hupIndex, 1);
      e.data.hup.setOpen(false);
      // setHups(hups);
    }
    // console.log('bind hups', localPlayer.characterHups);
    localPlayer.characterHups.addEventListener('hupadd', hupadd);
    localPlayer.characterHups.addEventListener('hupremove', hupremove);

    return () => {
      localPlayer.characterHups.removeEventListener('hupadd', hupadd);
      localPlayer.characterHups.removeEventListener('hupremove', hupremove);
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