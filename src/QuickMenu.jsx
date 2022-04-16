import * as THREE from 'three';
import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler';
import {LightArrow} from './LightArrow';

import styles from './QuickMenu.module.css';

import {mod} from '../util.js';

const modPi2 = angle => mod(angle, Math.PI*2);

//

const localVector2D = new THREE.Vector2();

//

const options = [
  'weapon-1',
  'weapon-2',
  'weapon-3',
  'weapon-4',
  'weapon-5',
  'weapon-6',
];

const size = 300;
const pixelRatio = window.devicePixelRatio;
const pixelSize = size * pixelRatio;

const numSlices = options.length;
const sliceSize = Math.PI*2/numSlices;
const interval = Math.PI*0.01;

const centerCoords = [
  size / 2 - 15,
  size / 2 - 15,
];

export default function QuickMenu() {
  const [open, setOpen] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(-1);
  const [coords, setCoords] = useState([0, 0]);
  const canvasRef = useRef();

  useEffect(() => {
    if (!open) {
      function keydown(e) {
        if (e.keyCode === 81) { // Q
          setOpen(true);
          setCoords([0, 0]);
        }
      }
      registerIoEventHandler('keydown', keydown);

      return () => {
        unregisterIoEventHandler('keydown', keydown);
      };
    } else {
      function keyup(e) {
        if (e.keyCode === 81) { // Q
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
      return () => {
        unregisterIoEventHandler('keyup', keyup);
        unregisterIoEventHandler('mousemove', mousemove);
      };
    }
  }, [open, coords]);

  const _render = () => {
    const wheelCanvas = canvasRef.current;
    if (wheelCanvas) {
      const ctx = wheelCanvas.getContext('2d');

      ctx.clearRect(0, 0, pixelSize, pixelSize);
    
      for (let i = 0; i < numSlices; i++) {
        ctx.fillStyle = i === selectedSlice ? '#4fc3f7' : '#111';
        ctx.beginPath();
        const startAngle = i*sliceSize + interval - Math.PI/2;
        const endAngle = (i+1)*sliceSize - interval - Math.PI/2;
        ctx.arc(pixelSize/2, pixelSize/2, pixelSize/2, startAngle, endAngle, false);
        ctx.arc(pixelSize/2, pixelSize/2, pixelSize/4, endAngle, startAngle, true);
        ctx.fill();

        ctx.font = (pixelSize/20) + 'px Muli';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const midAngle = (startAngle + endAngle)/2;
        ctx.fillText(i + '', pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2);
        ctx.font = (pixelSize/30) + 'px Muli';
        ctx.fillText(options[i], pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2 + pixelSize/20);
      }
    }
  };
  useEffect(() => {
    _render();
  }, [canvasRef.current, selectedSlice]);
  
  useEffect(() => {
    localVector2D.fromArray(coords);
    if (localVector2D.length() > 3) {
      const angle = modPi2(Math.atan2(coords[1], coords[0]) + Math.PI/2);
      const sliceIndex = Math.floor(angle/sliceSize);
      setSelectedSlice(sliceIndex);
    } else {
      setSelectedSlice(-1);
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
          ax={coords[0] + centerCoords[0]}
          ay={coords[1] + centerCoords[1]}
        />
      </div>
    </div>
  );
};