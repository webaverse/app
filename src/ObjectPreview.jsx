import * as THREE from 'three';
import React, {useEffect, useRef} from 'react';
import classnames from 'classnames';
import style from './ObjectPreview.module.css';
import dioramaManager from '../diorama.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {fitCameraToBoundingBox} from '../util.js';

const canvasWidth = 300;
const canvasHeight = 400;

const localBox = new THREE.Box3();

const ObjectPreview = ({
  object = null,
  className = null,
}) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (object) {
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
          autoCamera: false,
        });
        const {camera} = diorama;
        const _initCamera = () => {
          camera.position.set(0, 0, -1);
          fitCameraToBoundingBox(
            camera,
            localBox.setFromObject(object),
            1.2,
          );
          camera.updateMatrixWorld();

          camera.aspect = canvasWidth / canvasHeight;
          camera.updateProjectionMatrix();
        };
        _initCamera();

        diorama.addCanvas(canvas);

        const controls = new OrbitControls(camera, canvas);
        // controls.update() must be called after any manual changes to the camera's transform
        // camera.position.set( 0, 20, 100 );

        const _updateControls = () => {
          controls.update();
          frame = requestAnimationFrame(_updateControls);
        };
        let frame = requestAnimationFrame(_updateControls);

        return () => {
          diorama.destroy();
          cancelAnimationFrame(frame);
        };
      } else {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasRef, object]);

  return (
    <canvas className={classnames(className, style.objectPreview)} width={canvasWidth} height={canvasHeight} ref={canvasRef} />
  );
};
export {
  ObjectPreview,
};
