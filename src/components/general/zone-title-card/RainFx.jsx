import * as THREE from 'three';
import React, {useState, useEffect, useRef} from 'react';
// import classnames from 'classnames';
import {world} from '../../../../world.js';
import {RainBgFxMesh} from '../../../../background-fx/RainBgFx.js';

import styles from './zone-title-card.module.css';

//

export const RainFx = ({
  // app,
  enabled,
}) => {
  const [renderer, setRenderer] = useState(null);
  const canvasRef = useRef();

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();

  const rainBgFxMesh = new RainBgFxMesh();
  rainBgFxMesh.frustumCulled = false;
  scene.add(rainBgFxMesh);

  const _updateRendererSize = renderer => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  };
  const _updateAspectRatio = () => {
    rainBgFxMesh.material.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
    rainBgFxMesh.material.uniforms.aspectRatio.needsUpdate = true;
  };
  _updateAspectRatio();

  useEffect(() => {
    function resize(e) {
      if (renderer) {
        _updateRendererSize(renderer);
        _updateAspectRatio();
      }
    }
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [renderer]);

  useEffect(() => {
    if (canvasRef.current && enabled) {
      const canvas = canvasRef.current;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      _updateRendererSize(renderer);
      _updateAspectRatio();
      setRenderer(renderer);

      async function frame(e) {
        const {timestamp, timeDiff} = e.data;

        rainBgFxMesh.update(timestamp, timeDiff);

        renderer.clear();
        renderer.render(scene, camera);
      }
      world.appManager.addEventListener('frame', frame);
      return () => {
        world.appManager.removeEventListener('frame', frame);
      };
    }
  }, [canvasRef, enabled]);

  return (
        <canvas className={styles.rainFx} ref={canvasRef} />
  );
};
