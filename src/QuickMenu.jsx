import * as THREE from 'three';
import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import {registerIoEventHandler, unregisterIoEventHandler} from './components/general/io-handler/IoHandler';
import {LightArrow} from './LightArrow';

import styles from './QuickMenu.module.css';

import emotes from './components/general/character/emotes.json';
import {triggerEmote} from './components/general/character/Poses';

import game from '../game.js';
import cameraManager from '../camera-manager.js';
import * as sounds from '../sounds.js';
import {mod, loadImage, drawImageContain, imageToCanvas} from '../util.js';

const modPi2 = angle => mod(angle, Math.PI*2);

//

const localVector2D = new THREE.Vector2();

//

const chevronImgSrc = `./images/chevron2.svg`;

const size = 500;
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
const radiusCenter = (outerRadius + innerRadius) / 2;

const outerRadiusSoft = pixelSize/4 - 10;
const innerRadiusSoft = pixelSize/8;
const radiusCenterSoft = (outerRadiusSoft + innerRadiusSoft) / 2;

const iconSize = 80;
const chevronSize = 50;

export default function QuickMenu() {
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(false);
  const [selectedSlice, _setSelectedSlice] = useState(-1);
  const [selectedDepth, setSelectedDepth] = useState(-1);
  const [coords, setCoords] = useState([0, 0]);
  const [emoteIconImages, setEmoteIconImages] = useState(null);
  const [chevronImage, setChevronImage] = useState(null);
  const canvasRef = useRef();

  const setSelectedSlice = v => {
    if (v !== selectedSlice) {
      _setSelectedSlice(v);
      // XXX this needs to be quieter (configurable per-sound volume)
      // sounds.playSoundName('menuClick');
    }
  };

  const _getSelectedEmote = () => {
    if (selectedSlice !== -1 && selectedDepth !== -1) {
      return emotes[selectedSlice].name + (selectedDepth === 0 ? 'Soft' : '');
    } else {
      return null;
    }
  };

  useEffect(async () => {
    const emoteIconImages = await Promise.all(emotes.map(async ({icon}) => {
      const img = await loadImage(`./images/poses/${icon}`);
      const canvas = imageToCanvas(img, iconSize, iconSize);
      return canvas;
    }));
    setEmoteIconImages(emoteIconImages);
  }, []);
  useEffect(async () => {
    const img = await loadImage(chevronImgSrc);
    const canvas = imageToCanvas(img, chevronSize, chevronSize);
    setChevronImage(canvas);
  }, []);

  useEffect(() => {
    if (!open) {
      function keydown(e) {
        if (game.inputFocused()) return true;

        if (!e.repeat) {
          if (e.keyCode === 81 && !e.ctrlKey) { // Q
            cameraManager.requestPointerLock();

            setOpen(true);
            setDown(false);
            setCoords([0, 0]);

            sounds.playSoundName('menuOk');

            return false;
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
          if (open) {
            /* const emote = _getSelectedEmote();
            emote && triggerEmote(emote); */
            
            setOpen(false);
            setDown(false);

            sounds.playSoundName('menuBack');
          }
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
        emote && triggerEmote(emote);
        setOpen(false);
        
        sounds.playSoundName('menuNext');

        return false;
      }
      registerIoEventHandler('mouseup', mouseup);
      
      function wheel(e) {
        // nothing
        return false;
      }
      registerIoEventHandler('wheel', wheel);

      return () => {
        unregisterIoEventHandler('keyup', keyup);
        unregisterIoEventHandler('mousemove', mousemove);
        unregisterIoEventHandler('mousedown', mousedown);
        unregisterIoEventHandler('mouseup', mouseup);
        unregisterIoEventHandler('wheel', wheel);
      };
    }
  }, [open, coords]);

  const _render = () => {
    const wheelCanvas = canvasRef.current;
    if (wheelCanvas && emoteIconImages && chevronImage) {
      const ctx = wheelCanvas.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

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
          const midAngle = (startAngle + endAngle)/2;

          // soft chevron
          {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.translate(
              pixelSize/2 + Math.cos(midAngle)*radiusCenterSoft,
              pixelSize/2 + Math.sin(midAngle)*radiusCenterSoft
            );
            ctx.rotate(midAngle + Math.PI);
            ctx.translate(-chevronSize/2, -chevronSize/2);
            ctx.drawImage(
              chevronImage,
              0,
              0
            );
            ctx.restore();
          }
          
          // hard icon
          ctx.drawImage(
            emoteIconImages[i],
            pixelSize/2 + Math.cos(midAngle)*radiusCenter - iconSize/2,
            pixelSize/2 + Math.sin(midAngle)*radiusCenter - iconSize/2 - pixelSize/30
          );

          // hard label
          ctx.font = (pixelSize/30) + 'px Muli';
          ctx.fillStyle = '#FFF';
          ctx.fillText(
            emotes[i].name,
            pixelSize/2 + Math.cos(midAngle)*radiusCenter,
            pixelSize/2 + Math.sin(midAngle)*radiusCenter + pixelSize/20
          );
        }
      }
    }
  };
  useEffect(() => {
    _render();
  }, [canvasRef.current, selectedSlice, selectedDepth, emoteIconImages, chevronImage]);
  
  useEffect(() => {
    localVector2D.fromArray(coords);
    const centerDistance = localVector2D.length() * pixelRatio;
    const angle = modPi2(Math.atan2(coords[1], coords[0]) + Math.PI/2);
    const sliceIndex = Math.floor(angle/sliceSize);

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
          enabled={open}
          down={down}
          ax={coords[0] + centerCoords[0]}
          ay={coords[1] + centerCoords[1]}
        />
      </div>
    </div>
  );
};