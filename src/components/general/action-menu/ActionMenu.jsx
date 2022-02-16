
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

            <div className={ classnames( styles.btn, styles.settings ) } onClick={ handleSettingsBtnClick } >設定 Settings</div>
            <div className={ classnames( styles.btn, styles.mode ) } onClick={ handleModeBtnClick } >モード Mode</div>
            <div className={ classnames( styles.btn, styles.vr, xrSupported ? null : styles.inactive ) } onClick={ handleVRBtnClick } >{ xrSupported ? '仮想現実 VR ' : '仮想現実 VR (no)' }</div>

        </div>
    );

};
