
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';

import styles from './zone-title-card.module.css';

//

export const ZoneTitleCard = ({
    /* open,
    setOpen, */
}) => {

    const [ open, setOpen ] = useState( false );

    useEffect(() => {
        setOpen(true);
    }, []);

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
                <div className={ styles.title }>{title}</div>
                <div className={ styles.description }>{description}</div>
                <div className={ styles.comment }>{description}</div>
            </div>
        </div>
    );

};
