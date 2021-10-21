import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './Inspector.module.css';
import {world2canvas} from './ThreeUtils.js';
import {world} from '../world.js';
import game from '../game.js';

const Inspector = ({open, setOpen, selectedApp, dragging}) => {
  const [hoverPosition, setHoverPosition] = useState(null);
  const [selectPosition, setSelectPosition] = useState(null);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const hoverchange = e => {
      const worldOpen = open === 'world';
      // console.log('check hover', [worldOpen, !selectedApp, !dragging]);
      if (worldOpen && !selectedApp && !dragging) {
        // console.log('hover change', e.data);
        const {position} = e.data;
        if (position) {
          const worldPoint = world2canvas(position);
          // console.log('hover', worldPoint.toArray().join(', '));
          setHoverPosition(worldPoint);
        } else {
          setHoverPosition(null);
        }
      } else {
        setHoverPosition(null);
      }
    };
    world.appManager.addEventListener('hoverchange', hoverchange);
    return () => {
      world.appManager.removeEventListener('hoverchange', hoverchange);
    };
  }, [open, selectedApp, dragging, hoverPosition]);
  useEffect(() => {
    const dragchange = e => {
      setHoverPosition(null);
    };
    world.appManager.addEventListener('dragchange', dragchange);
    return () => {
      world.appManager.removeEventListener('dragchange', dragchange);
    };
  }, [dragging]);
  useEffect(() => {
    const worldOpen = open === 'world';
    game.setHoverEnabled(worldOpen);
    
    if (!worldOpen) {
      game.setMouseSelectedObject(null);
    }
  }, [open]);
  let localEpoch = epoch;
  useEffect(() => {
    const frame = e => {
      if (selectedApp) {
        const position = game.getMouseSelectedPosition();
        if (position) {
          const worldPoint = world2canvas(position, selectPosition);
          // console.log('world point', worldPoint.z);
          if (worldPoint.z > 0) {
            setSelectPosition(worldPoint);
            setEpoch(++localEpoch);
          } else {
            setSelectPosition(null);
          }
        } else {
          setSelectPosition(null);
        }
      } else {
        setSelectPosition(null);
      }
    };
    world.appManager.addEventListener('frame', frame);
    return () => {
      world.appManager.removeEventListener('frame', frame);
    };
  }, [selectedApp, selectPosition]);

  // hoverPosition && console.log('got', `translateX(${hoverPosition.x*100}vw) translateY(${hoverPosition.y*100}vh) scale(${hoverPosition.z})`);

  const bindPosition = selectPosition || hoverPosition || null;
  // console.log('bind position', bindPosition && bindPosition.toArray().join(','));

  return (
    <div className={classnames(styles.inspector, bindPosition ? styles.open : null)} style={bindPosition ? {
      transform: `translateX(${bindPosition.x*100}vw) translateY(${bindPosition.y*100}vh)`,
    } : null}>
      <img src="/images/popup.svg" style={bindPosition ? {
        transform: `scale(${bindPosition.z})`,
        transformOrigin: '0 100%',
      } : null} />
    </div>
  );
};
export default Inspector;