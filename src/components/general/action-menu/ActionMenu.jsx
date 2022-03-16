
import React, { useEffect, useContext, useState } from 'react';
import classnames from 'classnames';

import { AppContext } from '../../app';

import styles from './action-menu.module.css';

//

export const ActionMenu = () => {

    const { state, setState, app } = useContext( AppContext );
    const [ xrSupported, setXrSupported ] = useState( false );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleWorldBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'WorldPanel' ? null : 'WorldPanel' ) });

    };

    const handleSettingsBtnClick = () => {

        setState({ openedPanel: 'SettingsPanel' });

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

    return (
        <div className={ styles.actionMenu } onClick={ stopPropagation } >

            <div className={ classnames( styles.btn, state.openedPanel === 'WorldPanel' ? styles.wpOpened : null ) } onClick={ handleWorldBtnClick } >
                <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                <span className={ styles.text } >世 World</span>
                <span className={ styles.key } >Z</span>
            </div>
            <div className={ classnames( styles.btn, styles.settings ) } onClick={ handleSettingsBtnClick } >
                <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                <span className={ styles.text } >設定 Settings</span>
            </div>
            <div className={ classnames( styles.btn, styles.mode ) } onClick={ handleModeBtnClick } >
                <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                <span className={ styles.text } >モード Mode</span>
            </div>
            <div className={ classnames( styles.btn, styles.vr, xrSupported ? null : styles.disabled ) } onClick={ handleVRBtnClick } >
                <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                <span className={ styles.text } >{ xrSupported ? '仮想現実 VR ' : '仮想現実 VR (no)' }</span>
            </div>

        </div>
    );

};
