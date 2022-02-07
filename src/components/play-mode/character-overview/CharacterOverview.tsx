
import * as THREE from 'three';
import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';

import metaversefile from 'metaversefile';

import styles from './character-overview.module.css';

//

export const CharacterOverview = ({ open, setOpen }) => {

    const canvas = useRef( null );
    let renderer;
    let camera;
    let scene;

    const localPlayer = metaversefile.useLocalPlayer();

    //

    const handleCloseBtnClick = ( event ) => {

        event.stopPropagation();
        setOpen( false );

    };

    const renderLoop = () => {

        if ( ! open ) return;
        requestAnimationFrame( renderLoop );

        if ( ! renderer && canvas ) {

            renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true });
            const canvasSize = canvas.current.parentNode.getBoundingClientRect();
            renderer.setSize( canvasSize.width, canvasSize.height );
            camera = new THREE.PerspectiveCamera( 50, 1, 1, 2000 );
            camera.position.set( 0, 1.5, - 2 );
            camera.aspect = canvasSize.width / canvasSize.height;
            camera.updateProjectionMatrix();
            camera.lookAt( 0, 0.8, 0 );
            scene = new THREE.Scene();
            scene.background = null;

            scene.add( new THREE.AmbientLight( 0xffffff, 10 ) );
            scene.add( localPlayer.avatar.model );

        }

        //

        renderer.render( scene, camera );

    };

    useEffect( () => {

        if ( open ) renderLoop();

        const handleKeyPress = ( event ) => {

            if ( open && event.key === 'Escape' ) {

                setOpen( false );

            }

            if ( open === false && event.which === 73 ) {

                setOpen( true );

            }

        };

        window.addEventListener( 'keydown', handleKeyPress );

        return () => {

            window.removeEventListener( 'keydown', handleKeyPress );

        };

    }, [ open ] );

    //

    return (
        <div className={ classnames( styles.characterOverview, open ? styles.open : null ) }>
            <div className={ styles.closeBtn } onClick={ handleCloseBtnClick }>X</div>
            <div className={ styles.characterItems }>
                <div className={ styles.header }>
                    Your items
                </div>
                <div className={ styles.contentWrapper }>
                    <div className={ styles.content }>
                        <div className={ styles.item } >Some item name</div>
                    </div>
                </div>
            </div>
            <div className={ styles.characterBlock }>
                <canvas className={ styles.characterBlockCanvas } ref={ canvas } />
            </div>
        </div>
    );

};
