
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';

import {RenderMirror} from './RenderMirror';
import styles from './zone-title-card.module.css';

//

export const ZoneTitleCard = ({
    app,
    open,
    setOpen,
}) => {

    // const [ open, setOpen ] = useState( false );
    const [ loadProgress, setLoadProgress ] = useState( false );

    /* useEffect(() => {
        setOpen(true);
    }, []); */

    // const [ xrSupported, setXrSupported ] = useState( false );

    //

    /* const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleWorldBtnClick = () => {

        setWorldObjectsListOpened( true );

    };

    const handleSettingsBtnClick = () => {

        setSettingsOpened( true );

    };

    const handleModeBtnClick = () => {

        // todo

    };

    const handleVRBtnClick = async () => {

        if ( ! xrSupported ) return;
        await app.enterXr();

    };

    //

    useEffect( async () => {

        const isXrSupported = await app.isXrSupported();
        setXrSupported( isXrSupported );

    }, [] );

    //

    */

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setLoadProgress((loadProgress + 0.005) % 1);
        });
        return () => {
            cancelAnimationFrame(frame);
        };
    }, [loadProgress]);

    const title = 'Zone Title';
    const description = 'Zone Description';
    const comment = 'This is a zone comment.';

    return (
        <div className={ classnames(styles.zoneTitleCard, open ? styles.open : null) } >
            <div className={ styles.leftWing }>
                <div className={ styles.block }>
                  <div className={ styles.title }>Webaverse</div>
                  </div>
                <img className={ styles.tailImg } src="images/snake-tongue.svg" />
            </div>
            <div className={ styles.rightSection }>
                <RenderMirror app={app} width={128} />
                <div className={ styles.title }>{title}</div>
                <div className={ styles.description }>{description}</div>
                <div className={ styles.comment }>{comment}</div>
            </div>
            <div className={ styles.bottomSection }>
                <div className={ styles.loadingBar }>
                    <div className={ styles.label }>Loading</div>
                    <progress className={ styles.loadProgress } value={loadProgress} />
                    <img src="images/loading-bar.svg" className={ styles.loadProgressImage } />
                </div>
            </div>
        </div>
    );

};
