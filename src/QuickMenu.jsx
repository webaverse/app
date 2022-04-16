import * as THREE from 'three';
import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import metaversefile from 'metaversefile';
import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler';
import {LightArrow} from './LightArrow';

import styles from './QuickMenu.module.css';

import {emoteAnimations} from '../avatars/animationHelpers.js';
import {mod} from '../util.js';

const modPi2 = angle => mod(angle, Math.PI*2);

//

const localVector2D = new THREE.Vector2();

//

const emotes = [
  'alert',
  'angry',
  'embarrassed',
  'headNod',
  'headShake',
  'sad',
  'surprise',
  'victory',
];

const size = 400;
const pixelRatio = window.devicePixelRatio;
const pixelSize = size * pixelRatio;

const numSlices = emotes.length;
const sliceSize = Math.PI*2/numSlices;
const interval = Math.PI*0.01;

const centerCoords = [
  size / 2 - 15,
  size / 2 - 15,
];

const outerRadius = pixelSize/2;
const innerRadius = pixelSize/4;
const outerRadiusSoft = pixelSize/4 - 10;
const innerRadiusSoft = pixelSize/8;

const _triggerEmote = emote => {
  const localPlayer = metaversefile.useLocalPlayer();
  localPlayer.removeAction('emote');

  const newAction = {
    type: 'emote',
    animation: emote,
  };
  localPlayer.addAction(newAction);

  const emoteAnimation = emoteAnimations[emote];
  const emoteAnimationDuration = emoteAnimation.duration;
  setTimeout(() => {
    const actionIndex = localPlayer.findActionIndex(action => action.type === 'emote' && action.animation === emote);
    localPlayer.removeActionIndex(actionIndex);
  }, emoteAnimationDuration * 1000);
};

export default function QuickMenu() {
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(-1);
  const [selectedDepth, setSelectedDepth] = useState(-1);
  const [coords, setCoords] = useState([0, 0]);
  const canvasRef = useRef();

  const _getSelectedEmote = () => {
    if (selectedSlice !== -1 && selectedDepth !== -1) {
      return emotes[selectedSlice] + (selectedDepth === 0 ? 'Soft' : '');
    } else {
      return null;
    }
  }

  useEffect(() => {
    if (!open) {
      function keydown(e) {
        if (!e.repeat) {
          if (e.keyCode === 81) { // Q
            setOpen(true);
            setDown(false);
            setCoords([0, 0]);
          }
        }
      }
      registerIoEventHandler('keydown', keydown);

      return () => {
        unregisterIoEventHandler('keydown', keydown);
      };
    } else {
      function keyup(e) {
        if (e.keyCode === 81) { // Q
          /* const emote = _getSelectedEmote();
          emote && _triggerEmote(emote); */
          setOpen(false);
        }
      }
      registerIoEventHandler('keyup', keyup);
      
      function mousemove(e) {
        const {movementX, movementY} = e;

        const [x, y] = coords;
        setCoords([
          x + movementX,
          y + movementY,
        ]);

        return false;
      }
      registerIoEventHandler('mousemove', mousemove);
      
      function mousedown(e) {
        setDown(true);
        return false;
      }
      registerIoEventHandler('mousedown', mousedown);
      
      function mouseup(e) {
        setDown(false);
        const emote = _getSelectedEmote();
        emote && _triggerEmote(emote);
        setOpen(false);
        return false;
      }
      registerIoEventHandler('mouseup', mouseup);
      
      return () => {
        unregisterIoEventHandler('keyup', keyup);
        unregisterIoEventHandler('mousemove', mousemove);
        unregisterIoEventHandler('mousedown', mousedown);
        unregisterIoEventHandler('mouseup', mouseup);
      };
    }
  }, [open, coords]);

  const _render = () => {
    const wheelCanvas = canvasRef.current;
    if (wheelCanvas) {
      const ctx = wheelCanvas.getContext('2d');

      ctx.clearRect(0, 0, pixelSize, pixelSize);
    
      for (let i = 0; i < numSlices; i++) {
        const startAngle = i*sliceSize + interval - Math.PI/2;
        const endAngle = (i+1)*sliceSize - interval - Math.PI/2;
        
        {
          const selected = i === selectedSlice && selectedDepth === 0;
          ctx.fillStyle = selected ? '#4fc3f7' : '#111';
          ctx.beginPath();
          ctx.arc(pixelSize/2, pixelSize/2, outerRadiusSoft, startAngle, endAngle, false);
          ctx.arc(pixelSize/2, pixelSize/2, innerRadiusSoft, endAngle, startAngle, true);
          ctx.fill();
        }
        {
          const selected = i === selectedSlice && selectedDepth === 1;
          ctx.fillStyle = selected ? '#4fc3f7' : '#111';
          ctx.beginPath();
          ctx.arc(pixelSize/2, pixelSize/2, outerRadius, startAngle, endAngle, false);
          ctx.arc(pixelSize/2, pixelSize/2, innerRadius, endAngle, startAngle, true);
          ctx.fill();
        }
        {
          ctx.font = (pixelSize/20) + 'px Muli';
          ctx.fillStyle = '#FFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const midAngle = (startAngle + endAngle)/2;
          ctx.fillText(i + '', pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2);
          ctx.font = (pixelSize/30) + 'px Muli';
          ctx.fillText(emotes[i], pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2 + pixelSize/20);
        }
      }
    }
  };
  useEffect(() => {
    _render();
  }, [canvasRef.current, selectedSlice, selectedDepth]);
  
  useEffect(() => {
    localVector2D.fromArray(coords);
    const centerDistance = localVector2D.length() * pixelRatio;
    const angle = modPi2(Math.atan2(coords[1], coords[0]) + Math.PI/2);
    const sliceIndex = Math.floor(angle/sliceSize);

    // console.log('got center', centerDistance, innerRadius, innerRadiusSoft);
    if (centerDistance > innerRadius) {
      setSelectedSlice(sliceIndex);
      setSelectedDepth(1);
    } else if (centerDistance > innerRadiusSoft) {
      setSelectedSlice(sliceIndex);
      setSelectedDepth(0);
    } else {
      setSelectedSlice(-1);
      setSelectedDepth(-1);
    }
  }, [coords]);

  //

	return (
    <div className={classnames(
      styles.quickMenu,
      open ? styles.open : null,
    )}>
      <div className={styles.container} >
        <canvas
          className={styles.canvas}
          width={pixelSize}
          height={pixelSize}
          ref={canvasRef}
        />
        <LightArrow
          /* enabled={!!arrowPosition}
          animate={!!selectCharacter} */
          enabled={open}
          down={down}
          ax={coords[0] + centerCoords[0]}
          ay={coords[1] + centerCoords[1]}
        />
      </div>
    </div>
  );
};