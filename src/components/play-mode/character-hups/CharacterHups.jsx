
import React, { useState, useEffect, useRef, useContext } from 'react';
import classnames from 'classnames';

import metaversefile from 'metaversefile';
import dioramaManager from '../../../../diorama.js';
import { chatTextSpeed } from '../../../../constants.js';

import { RpgText } from '../rpg-text';
import { AppContext } from '../../app';

import styles from './character-hups.module.css';

//

const defaultHupSize = 256;
const pixelRatio = window.devicePixelRatio;
const chatDioramas = new WeakMap();

const CharacterHup = ( props ) => {

    const { hup, index, hups, setHups } = props;
    const canvasRef = useRef();
    const hupRef = useRef();
    const [ localOpen, setLocalOpen ] = useState( false );
    const [ fullText, setFullText ] = useState('');

    //

    useEffect( () => {

        if ( canvasRef.current ) {

            const canvas = canvasRef.current;
            const player = hup.parent.player;
            let diorama = chatDioramas.get( player );

            if ( diorama ) {

                diorama.resetCanvases();
                diorama.addCanvas( canvas );

            } else {

                diorama = dioramaManager.createPlayerDiorama({
                    target: player,
                    objects: [ player.avatar.model ],
                    grassBackground: true,
                });

                diorama.addCanvas( canvas );
                chatDioramas.set( player, diorama );

            }

            //

            return () => {

                diorama.destroy();

            };

        }

    }, [ canvasRef ] );

    useEffect( () => {

        if ( ! hupRef.current ) return;

        const hupEl = hupRef.current;

        function transitionend () {

            if ( ! localOpen ) {

                const hupIndex = hups.indexOf( hup );
                const newHups = hups.slice();
                newHups.splice( hupIndex, 1 );
                setHups( newHups );

            }

        };

        hupEl.addEventListener( 'transitionend', transitionend );

        //

        return () => {

            hupEl.removeEventListener( 'transitionend', transitionend );

        };

    }, [ hupRef, localOpen, hups, hups.length ] );

    useEffect( () => {

        setFullText( hup.fullText );

    }, [] );

    useEffect( () => {

        const voicestart = ( event ) => {

            setLocalOpen( true );
            setFullText( event.data.fullText );

        };

        const destroy = () => {

            const player = hup.parent.player;
            chatDioramas.delete( player );
            setLocalOpen( false );

        };

        hup.addEventListener( 'voicestart', voicestart );
        hup.addEventListener( 'destroy', destroy );

        //

        return () => {

            hup.removeEventListener( 'voicestart', voicestart );
            hup.removeEventListener( 'destroy', destroy );

        };

    }, [ hup, localOpen ] );

    useEffect( () => {

        const animationFrame = requestAnimationFrame( () => { setLocalOpen( true ); });

        return () => {

            cancelAnimationFrame( animationFrame );

        };

    }, [ hup ] );

    //

    return (
        <div className={ classnames( styles.characterHup, localOpen ? styles.open : null ) } style={{ top: `${index * defaultHupSize}px`, }} ref={ hupRef } >
            <canvas width={ defaultHupSize * pixelRatio } height={ defaultHupSize * pixelRatio } ref={ canvasRef } />
            <div className={ styles.name } >
                <div className={ styles.bar } />
                <h1>{ hup.playerName }</h1>
                <h2>Lv. 9</h2>
                {/* <div className={styles.stats}>
                <div className={styles.stat}>
                    <h3>HP</h3>
                    <progress value={61} />
                </div>
                <div className={styles.stat}>
                    <h3>MP</h3>
                    <progress value={83} />
                </div>
                </div> */}
            </div>
            <RpgText className={ styles.message } styles={ styles } textSpeed={ chatTextSpeed } text={ fullText } />
        </div>
    );

};

export const CharacterHups = () => {

    const { npcs } = useContext( AppContext );
    const [ hups, setHups ] = useState([]);
    const localPlayer = metaversefile.useLocalPlayer();

    //

    useEffect( () => {

        const hupAdd = ( event ) => {

            const newHups = hups.concat([ event.data.hup ]);
            setHups( newHups );

        };

        /* function hupremove(e) {
            const oldHup = e.data.hup;
            const index = hups.indexOf(oldHup);
            const newHups = hups.slice();
            newHups.splice(index, 1);
            setHups(newHups);
        } */

        localPlayer.characterHups.addEventListener( 'hupadd', hupAdd );
        // localPlayer.characterHups.addEventListener('hupremove', hupremove);

        for ( const npcPlayer of npcs ) {

            npcPlayer.characterHups.addEventListener( 'hupadd', hupAdd );
            // npcPlayer.characterHups.addEventListener('hupremove', hupremove);

        }

        //

        return () => {

            localPlayer.characterHups.removeEventListener( 'hupadd', hupAdd );
            // localPlayer.characterHups.removeEventListener('hupremove', hupremove);

            for ( const npcPlayer of npcs ) {

                npcPlayer.characterHups.removeEventListener( 'hupadd', hupAdd );
                // npcPlayer.characterHups.removeEventListener('hupremove', hupremove);

            }

        };

    }, [ localPlayer, npcs, npcs.length, hups, hups.length ] );

    //

    return (
        <div className={ styles.characterHups } >
            {
                hups.map( ( hup, index ) => {
                    return (
                        <CharacterHup
                            key={ hup.hupId }
                            hup={ hup }
                            index={ index }
                            hups={ hups }
                            setHups={ setHups }
                        />
                    );
                })
            }
        </div>
    );

};
