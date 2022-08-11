// import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
// import classnames from 'classnames';
// import dioramaManager from '../diorama.js';
import game from '../game.js';
import styles from './MiniHup.module.css';
import {RpgText} from './RpgText.jsx';
import {chatTextSpeed} from '../constants.js';
// import metaversefile from 'metaversefile';
// const {useLocalPlayer} = metaversefile;
// import {chatTextSpeed} from '../constants.js';

const defaultHupSize = 150;
const pixelRatio = window.devicePixelRatio;

// const chatDioramas = new WeakMap();

const MiniHup = function({
  text = '',
}) {
  // const {hup, index, hups, setHups} = props;

  const canvasRef = useRef();
  // const hupRef = useRef();
  // const [localOpen, setLocalOpen] = useState(false);
  // const [text, setText] = useState('');
  // const [fullText, setFullText] = useState('');

  // console.log('render text', text, hup.fullText);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // const localPlayer = metaversefile.useLocalPlayer();
      const diorama = game.playerDiorama;

      diorama.addCanvas(canvas);
      diorama.enabled = true;
      // window.diorama = diorama;

      return () => {
        diorama.removeCanvas(canvas);
      };
    }
  }, [canvasRef]);
  /* useEffect(() => {
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
  }, []); */
  /* useEffect(() => {
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
      // console.log('voice start', hup.fullText, e.data, e.data.fullText);
      setLocalOpen(true);
      setFullText(e.data.fullText);
    }
    hup.addEventListener('voicestart', voicestart);
    function destroy(e) {
      const player = hup.parent.player;
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
  }, [hup]); */

  return (
    <div className={styles.miniHup}>
      <RpgText className={styles.text} styles={styles} text={text} textSpeed={chatTextSpeed} />
      <canvas
        className={styles.canvas}
        width={defaultHupSize*pixelRatio}
        height={defaultHupSize*pixelRatio}
        ref={canvasRef}
      />
    </div>
  );
};
export {
  MiniHup,
};