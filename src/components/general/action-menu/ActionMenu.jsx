
import React, { useEffect, useContext, useState } from 'react';
import classnames from 'classnames';
import cameraManager from '../../../../camera-manager.js';
import { AppContext } from '../../app';

import styles from './action-menu.module.css';
import * as sounds from '../../../../sounds.js';

//

export const ActionMenu = ({ setUIMode, className }) => {

    const { state, setState, app, uiMode } = useContext( AppContext );
    const [ xrSupported, setXrSupported ] = useState( false );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleWorldBtnClick = () => {
        if ( state.openedPanel === 'WorldPanel' ) {

            if ( ! cameraManager.pointerLockElement ) {

                cameraManager.requestPointerLock();

            }
    
            setState({ openedPanel: null });

        } else if ( state.openedPanel !== 'SettingsPanel' ) {

            if ( cameraManager.pointerLockElement ) {

                cameraManager.exitPointerLock();

            }

            setState({ openedPanel: 'WorldPanel' });

        }

    };

    const handleSettingsBtnClick = () => {

        setState({ openedPanel: 'SettingsPanel' });

    };

    const handleCameraBtnClick = () => {

        // todo

    };

    const handleModeBtnClick = () => {

        setUIMode( uiMode === 'normal' ? 'none' : 'normal' );

    };

    const handleVRBtnClick = async () => {

        if ( ! xrSupported ) return;
        await app.enterXr();

    };

    const _triggerClickSound = () => {

        sounds.playSoundName('menuClick');

    };

    //

    useEffect( async () => {

        const isXrSupported = await app.isXrSupported();
        setXrSupported( isXrSupported );

    }, [] );

    //

    return (
        <div className={ classnames( className, styles.actionMenu ) } onClick={ stopPropagation } >

            <div className={ styles.btnWrapper } onMouseEnter={ _triggerClickSound }>
                <div className={ classnames( styles.btn, state.openedPanel === 'WorldPanel' ? styles.wpOpened : null ) } onClick={ handleWorldBtnClick } >
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                    <span className={ styles.text } >世 World</span>
                    <span className={ styles.key } >Z</span>
                </div>
            </div>
            <div className={ styles.btnWrapper } onMouseEnter={ _triggerClickSound }>
                <div className={ classnames( styles.btn, styles.settings ) } onClick={ handleSettingsBtnClick } >
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                    <span className={ styles.text } >設定 Settings</span>
                </div>
            </div>
            <div className={ styles.btnWrapper } onMouseEnter={ _triggerClickSound }>
                <div className={ classnames( styles.btn, styles.mode ) } onClick={ handleCameraBtnClick } >
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                    <span className={ styles.text } >モード Mode</span>
                </div>
            </div>
            <div className={ styles.btnWrapper } onMouseEnter={ _triggerClickSound }>
                <div className={ classnames( styles.btn, styles.mode ) } onClick={ handleModeBtnClick } >
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                    <span className={ styles.text } >隠れる Hide</span>
                </div>
            </div>
            <div className={ styles.btnWrapper }>
                <div className={ classnames( styles.btn, styles.vr, xrSupported ? null : styles.disabled ) } onClick={ handleVRBtnClick } onMouseEnter={ ()=>{ if(xrSupported) _triggerClickSound} }>
                    <img src="images/webpencil.svg" className={ classnames( styles.background, styles.blue ) } />
                    <span className={ styles.text } >{ xrSupported ? '仮想現実 VR ' : '仮想現実 VR (no)' }</span>
                </div>
            </div>

        </div>
    );

};