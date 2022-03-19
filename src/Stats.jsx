import React, {useState, useEffect} from 'react';
import * as THREE from 'three';
import classnames from 'classnames';
import {getRenderer} from '../renderer.js';
import metaversefile from 'metaversefile';
import style from './Stats.module.css';

const localVector = new THREE.Vector3();

export const Stats = () => {
	const [enabled, setEnabled] = useState(false);
	const [fps, setFps] = useState(0);
	const [position, setPosition] = useState([0, 0, 0]);
	const [velocity, setVelocity] = useState([0, 0, 0]);
	const [speed, setSpeed] = useState(0);
	const [hspeed, setHspeed] = useState(0);
	const [programs, setPrograms] = useState(0);
	const [geometries, setGeometries] = useState(0);
	const [textures, setTextures] = useState(0);
	const [calls, setCalls] = useState(0);

	const renderer = getRenderer();
	const localPlayer = metaversefile.useLocalPlayer();
	const debug = metaversefile.useDebug();

	useEffect(() => {
		const enabledchange = e => {
			setEnabled(e.data.enabled);
		};
		debug.addEventListener('enabledchange', enabledchange);
		return () => {
			debug.removeEventListener('enabledchange', enabledchange);
		};
	}, []);

	let frames = 0;
	let lastTime = performance.now();
	useEffect(() => {
		if (enabled) {
			const recurse = () => {
				frames++;

				// Update every frame
				if (localPlayer) {
					setPosition(localPlayer.position.toArray().map(n => n.toFixed(2)));
					setVelocity(localPlayer.characterPhysics.velocity.toArray().map(n => n.toFixed(2)));
					setSpeed(localPlayer.characterPhysics.velocity.length().toFixed(2));

					localVector.copy(localPlayer.characterPhysics.velocity);
					localVector.y = 0;
					setHspeed(localVector.length().toFixed(2));
				}

				const now = performance.now();
				// Only update once per second
				if (now > lastTime + 1000) {
					setFps(Math.round((frames * 1000) / (now - lastTime)));
					setPrograms(renderer.info.programs.length);
					setGeometries(renderer.info.memory.geometries);
					setTextures(renderer.info.memory.textures);
					setCalls(renderer.info.render.calls);

					frames = 0;
					lastTime = now;
				}

				animationFrame = requestAnimationFrame(recurse);
			};
			let animationFrame = requestAnimationFrame(recurse);
			return () => {
				cancelAnimationFrame(animationFrame);
			};
		}
	}, [enabled]);

  return (
		<div className={classnames(style.stats, enabled ? style.open : null)}>
			<div className={style.line}>
				<div className={style.label}>FPS: </div>
				<div className={style.value}>{fps}</div>
			</div>
			<h3>World</h3>
			<div className={style.line}>
				<div className={style.label}>X: </div>
				<div className={style.value}>{position[0]}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Y: </div>
				<div className={style.value}>{position[1]}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Z: </div>
				<div className={style.value}>{position[2]}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Velocity: </div>
				<div className={style.value}>{velocity.join(', ')}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Speed: </div>
				<div className={style.value}>{speed}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>HSpeed: </div>
				<div className={style.value}>{hspeed}</div>
			</div>
			<h3>Renderer</h3>
			<div className={style.line}>
				<div className={style.label}>Programs: </div>
				<div className={style.value}>{programs}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Geometries: </div>
				<div className={style.value}>{geometries}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Textures: </div>
				<div className={style.value}>{textures}</div>
			</div>
			<div className={style.line}>
				<div className={style.label}>Draw Calls: </div>
				<div className={style.value}>{calls}</div>
			</div>
		</div>
	);
};