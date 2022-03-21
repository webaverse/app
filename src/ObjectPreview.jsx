import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import style from './ObjectPreview.module.css';
import dioramaManager from '../diorama.js';

const canvasWidth = 300;
const canvasHeight = 400;

const ObjectPreview = ({
  object = null,
  className = null,
}) => {
  // const [queue, setQueue] = useState([]);
  // const [currentApp, setCurrentApp] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && object) {
      // console.log('bind canvas');
    
      const objects = [object];
      const diorama = dioramaManager.createPlayerDiorama({
        objects,
        // target = new THREE.Object3D(),
        cameraOffset: new THREE.Vector3(0, 0, 1),
        clearColor: null,
        clearAlpha: 1,
        lights: true,
        // label: null,
        outline: true,
        /* grassBackground: false,
        poisonBackground: false,
        noiseBackground: false,
        smokeBackground: false,
        lightningBackground: false,
        radialBackground: false,
        glyphBackground: false, */
      });
      // diorama.resetCanvases();
      diorama.setAspect(canvasWidth / canvasHeight);
      diorama.addCanvas(canvas);

      return () => {
        diorama.destroy();
      };
    }
  }, [canvasRef, object]);

  return object ? (
    <canvas className={classnames(className, style.objectPreview)} width={canvasWidth} height={canvasHeight} ref={canvasRef} />
  ) : null;
};
export {
  ObjectPreview,
};