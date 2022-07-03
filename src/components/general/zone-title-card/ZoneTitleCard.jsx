
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import {RenderMirror} from './RenderMirror';
import {RainFx} from './RainFx';
import { AppContext } from '../../app';

import styles from './zone-title-card.module.css';

//

const logoImages = [
  'images/logos/upstreet1.png',
  'images/logos/upstreet2.png',
  'images/logos/upstreet3.png',
];

export const ZoneTitleCard = () => {

    const { app } = useContext( AppContext );
    const [ open, setOpen ] = useState( false );
    const [ logoImage, setLogoImage ] = useState( logoImages[Math.floor(Math.random() * logoImages.length)] );
    const [ loadProgress, setLoadProgress ] = useState( false );

    useEffect(() => {
        function titlecardhackchange(e) {
            const {titleCardHack} = e.data;
            setOpen(titleCardHack);
        }
        app.addEventListener('titlecardhackchange', titlecardhackchange);
        return () => {
            app.removeEventListener('titlecardhackchange', titlecardhackchange);
        };
    }, []);

    useEffect(() => {
        if (open) {
            const frame = requestAnimationFrame(() => {
                setLoadProgress((loadProgress + 0.005) % 1);
            });
            return () => {
                cancelAnimationFrame(frame);
            };
        }
    }, [open, loadProgress]);

    const title = 'Zone Title';
    const description = 'Zone Description';
    const comment = 'This is a zone comment.';

    return (
        <div className={ classnames(styles.zoneTitleCard, open ? styles.open : null) } >
            <div className={ styles.leftWing }>
                <div className={ styles.block }>
                    {/* <div className={ styles.title }>Webaverse</div> */}
                    <img className={ styles.logoImage } src={ logoImage } />
                </div>
                <img className={ styles.tailImg } src="images/snake-tongue.svg" />
            </div>
            <div className={ styles.rightSection }>
                <RenderMirror app={app} width={128} enabled={app.titleCardHack} />
                <div className={ styles.title }>
                    <div className={ styles.background } />
                    <div className={ styles.text }>{title}</div>
                </div>
                <div className={ styles.description }>
                    <div className={ styles.background } />
                    <div className={ styles.text }>{description}</div>
                </div>
                <div className={ styles.comment }>{comment}</div>
            </div>
            <div className={ styles.bottomSection }>
                <div className={ styles.loadingBar }>
                    <div className={ styles.label }>Loading</div>
                    <progress className={ styles.loadProgress } value={loadProgress} />
                    <img src="images/loading-bar.svg" className={ styles.loadProgressImage } />
                </div>
            </div>

            <RainFx enabled={open} />
        </div>
    );

};
