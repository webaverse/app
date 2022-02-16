
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';

import styles from './action-menu.module.css';

//

export const ActionMenu = ({ setSettingsOpened, app }) => {

    const [ xrSupported, setXrSupported ] = useState( false );

    //

    const handleSettingsBtnClick = ( event ) => {

        event.stopPropagation();
        setSettingsOpened( true );

    };

    const handleModeBtnClick = ( event ) => {

        event.stopPropagation();

    };

    const handleVRBtnClick = async ( event ) => {

        event.stopPropagation();
        if ( ! xrSupported ) return;
        await app.enterXr();

    };

    //

    useEffect( async () => {

        const isXrSupported = await app.isXrSupported();
        setXrSupported( isXrSupported );

    }, [] );

    //

    return (
        <div className={ styles.actionMenu } >

            <div className={ classnames( styles.btn, styles.settings ) } onClick={ handleSettingsBtnClick } />
            <div className={ classnames( styles.btn, styles.mode ) } onClick={ handleModeBtnClick } >MODE</div>
            <div className={ classnames( styles.btn, styles.vr ) } onClick={ handleVRBtnClick } >{ xrSupported ? '' : 'no' } VR</div>

        </div>
    );

};
