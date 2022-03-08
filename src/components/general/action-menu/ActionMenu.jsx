
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import { store } from '../../../store';
import { SET_SETTINGS_OPEN } from '../../../actions/Actions';

import styles from './action-menu.module.css';

//

export const ActionMenu = ({ app }) => {

    const { dispatch } = useContext( store );
    const [ xrSupported, setXrSupported ] = useState( false );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleWorldBtnClick = () => {

        // AppUIStateManager.dispatchEvent( new CustomEvent( 'ToggleWorldPanel' ) );

    };

    const handleSettingsBtnClick = () => {

        dispatch({ type: SET_SETTINGS_OPEN, opened: true });
        // Store.setState( state => { state = { ... state }; state.settings = true; return state; });
        // AppUIStateManager.dispatchEvent( new CustomEvent( 'ToggleSettingsPanel' ) );

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

            <div className={ classnames( styles.btn, styles.settings ) } onClick={ handleWorldBtnClick } >
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
