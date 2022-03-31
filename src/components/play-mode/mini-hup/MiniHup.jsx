
import React, { useEffect, useRef } from 'react';

import game from '../../../../game.js';
import { chatTextSpeed } from '../../../../constants.js';

import { RpgText } from '../rpg-text';

import styles from './mini-hup.module.css';

//

const defaultHupSize = 150;
const pixelRatio = window.devicePixelRatio;

export const MiniHup = ({ text = '' }) => {

    const canvasRef = useRef();
    // const {hup, index, hups, setHups} = props;
    // const hupRef = useRef();
    // const [localOpen, setLocalOpen] = useState(false);
    // const [text, setText] = useState('');
    // const [fullText, setFullText] = useState('');

    //

    useEffect( () => {

        const canvas = canvasRef.current;
        if ( ! canvas ) return;

        const diorama = game.playerDiorama;
        diorama.addCanvas( canvas );
        diorama.enabled = true;

        return () => {

            diorama.removeCanvas( canvas );

        };

    }, [ canvasRef ] );

    /* useEffect( () => {

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

    }, []);

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

        function voicestart ( e ) {

            setLocalOpen( true );
            setFullText( e.data.fullText );

        };

        hup.addEventListener( 'voicestart', voicestart );

        function destroy ( e ) {

            const player = hup.parent.player;
            chatDioramas.delete( player );
            setLocalOpen( false );

        };

        hup.addEventListener( 'destroy', destroy );

        //

        return () => {

            hup.removeEventListener('voicestart', voicestart);
            hup.removeEventListener('destroy', destroy);

        };

    }, [ hup, localOpen ] );

    useEffect( () => {

        const animationFrame = requestAnimationFrame( () => {

            setLocalOpen( true );

        });

        //

        return () => {

            cancelAnimationFrame( animationFrame );

        };

    }, [ hup ] ); */

    //

    return (
        <div className={styles.miniHup}>
            <RpgText className={styles.text} styles={styles} text={text} textSpeed={chatTextSpeed} />
            <canvas
                className={styles.canvas}
                width={defaultHupSize*pixelRatio}
                height={defaultHupSize*pixelRatio}
                ref={canvasRef}
            />
        </div>
    );

};
