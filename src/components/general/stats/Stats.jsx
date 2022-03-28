
import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import classnames from 'classnames';

import { getRenderer } from '../../../../renderer.js';
import metaversefile from 'metaversefile';
import performanceTracker from '../../../../performance-tracker.js';

import styles from './Stats.module.css';

//

const localVector = new THREE.Vector3();

export const Stats = () => {

    const [ enabled, setEnabled ] = useState( false );
    const [ fps, setFps ] = useState(0);
    const [ position, setPosition ] = useState([ 0, 0, 0 ]);
    const [ velocity, setVelocity ] = useState([ 0, 0, 0 ]);
    const [ speed, setSpeed ] = useState(0);
    const [ hspeed, setHspeed ] = useState(0);
    const [ programs, setPrograms ] = useState(0);
    const [ geometries, setGeometries ] = useState(0);
    const [ textures, setTextures ] = useState(0);
    const [ calls, setCalls ] = useState(0);
    const [ cpuResults, setCpuResults ] = useState([]);
    const [ gpuResults, setGpuResults ] = useState([]);

    const renderer = getRenderer();
    const localPlayer = metaversefile.useLocalPlayer();
    const debug = metaversefile.useDebug();

    //

	useEffect(() => {

        const enabledchange = ( event ) => {

            setEnabled( event.data.enabled );

        };

        debug.addEventListener( 'enabledchange', enabledchange );

        return () => {

            debug.removeEventListener( 'enabledchange', enabledchange );

        };

    }, [] );

	useEffect( () => {

        const snapshot = ( event ) => {

			setCpuResults( event.data.cpuResults );
			setGpuResults( event.data.gpuResults );

        };

        performanceTracker.addEventListener( 'snapshot', snapshot );

        return () => {

            performanceTracker.removeEventListener( 'snapshot', snapshot );

        };

    }, [] );

	let frames = 0;
	let lastTime = performance.now();

	useEffect( () => {

        if ( ! enabled ) return;

        const recurse = () => {

            frames++;

            // Update every frame
            setPosition( localPlayer.position.toArray().map(n => n.toFixed(2)) );
            setVelocity( localPlayer.characterPhysics.velocity.toArray().map(n => n.toFixed(2)) );
            setSpeed( localPlayer.characterPhysics.velocity.length().toFixed(2) );

            localVector.copy( localPlayer.characterPhysics.velocity );
            localVector.y = 0;
            setHspeed( localVector.length().toFixed(2) );

            // Only update once per second
            const now = performance.now();

            if ( now > lastTime + 1000 ) {

                setFps( Math.round( ( frames * 1000 ) / ( now - lastTime ) ) );
                setPrograms( renderer.info.programs.length );
                setGeometries( renderer.info.memory.geometries );
                setTextures( renderer.info.memory.textures );
                setCalls( renderer.info.render.calls );

                frames = 0;
                lastTime = now;

            }

            animationFrame = requestAnimationFrame( recurse );

        };

        let animationFrame = requestAnimationFrame( recurse );

        return () => {

            cancelAnimationFrame( animationFrame );

        };

    }, [ enabled ] );

    //

    return (
		<div className={ classnames( styles.statsContainer, enabled ? styles.open : null ) } >
			<div className={ styles.stats } >
			    <h3>CPU</h3>
			    {
                    cpuResults.map( ( result ) => (
                        <div className={ styles.line } key={ result.name } >
                            <div className={ styles.label } >{ result.name }</div>
						    <div className={ styles.value } >{ ( result.time ).toFixed(2) + 'ms' }</div>
					    </div>
				    ))
                }
			</div>
			<div className={ styles.stats } >
			    <h3>GPU</h3>
				{
                    gpuResults.map( ( result ) => (
				        <div className={ styles.line } key={ result.name } >
                            <div className={ styles.label } >{ result.name }</div>
						    <div className={ styles.value } >{ ( result.time / 1e6 ).toFixed(2) + 'ms' }</div>
					    </div>
				    ))
                }
			</div>
			<div className={ styles.stats } >
				<div className={ styles.line } >
					<div className={ styles.label } >FPS: </div>
					<div className={ styles.value } >{ fps }</div>
				</div>
				<h3>World</h3>
				<div className={ styles.line }>
					<div className={ styles.label } >X: </div>
					<div className={ styles.value } >{ position[0] }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Y: </div>
					<div className={ styles.value } >{ position[1] }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Z: </div>
					<div className={ styles.value } >{ position[2] }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Velocity: </div>
					<div className={ styles.value } >{ velocity.join(', ') }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Speed: </div>
					<div className={ styles.value } >{ speed }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >HSpeed: </div>
					<div className={ styles.value } >{ hspeed }</div>
				</div>
				<h3>Renderer</h3>
				<div className={ styles.line } >
					<div className={ styles.label } >Programs: </div>
					<div className={ styles.value } >{ programs }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Geometries: </div>
					<div className={ styles.value } >{ geometries }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label } >Textures: </div>
					<div className={ styles.value } >{ textures }</div>
				</div>
				<div className={ styles.line } >
					<div className={ styles.label }>Draw Calls: </div>
					<div className={ styles.value }>{ calls }</div>
				</div>
			</div>
		</div>
	);

};
