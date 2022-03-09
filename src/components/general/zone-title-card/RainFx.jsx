import * as THREE from 'three';
import React, { useState, useEffect, useRef } from 'react';
// import classnames from 'classnames';
import {world} from '../../../../world.js';
import {RainBgFxMesh} from '../../../../background-fx/rain.js';

import styles from './zone-title-card.module.css';

const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();

//

export const RainFx = ({
  // app,
}) => {
    // const [width, setWidth] = useState(window.innerWidth);
    // const [height, setHeight] = useState(window.innerHeight);
    // const [pixelRatio, setPixelRatio] = useState(window.devicePixelRatio);
    const [renderer, setRenderer] = useState(null);
    const canvasRef = useRef();

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();

    const rainBgFxMesh = new RainBgFxMesh();
    rainBgFxMesh.frustumCulled = false;
    scene.add(rainBgFxMesh);

    /* useEffect(() => {
        function resize(e) {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
            setPixelRatio(window.devicePixelRatio);
        }
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
        };
    }, []); */

    const _updateRendererSize = renderer => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
    };
    const _updateAspectRatio = () => {
        rainBgFxMesh.material.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
        rainBgFxMesh.material.uniforms.aspectRatio.needsUpdate = true;
        // console.log('set aspect ratio', rainBgFxMesh.material.uniforms.aspectRatio.value);
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
        if (canvasRef.current) {
                const canvas = canvasRef.current;
                // const ctx = canvas.getContext('2d');

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
    }, [canvasRef]);

    return (
        <canvas className={styles.rainFx} ref={canvasRef} />
    );
};