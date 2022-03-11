
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import styles from './action-menu.module.css';

//

export const ActionMenu = ({ app, setSettingsOpened, setWorldObjectsListOpened, opened, setOpened }) => {

    const [ xrSupported, setXrSupported ] = useState( false );

    //

    const stopPropagation = ( event ) => {

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

    return (
        <div className={ styles.actionMenu } onClick={ stopPropagation } >

			<button 
			className={classnames(styles.closeBtn, (opened ? styles.opened : null ))}
			onClick={() => setOpened(false)}
			>
			<span>
					<svg xmlns="http://www.w3.org/2000/svg" width="9.719" height="17" viewBox="0 0 9.719 17">
						<path id="Icon_ionic-ios-arrow-back" data-name="Icon ionic-ios-arrow-back" d="M18.04,14.691,11.607,8.264a1.215,1.215,0,0,1,1.721-1.716l7.288,7.283a1.213,1.213,0,0,1,.035,1.675l-7.318,7.333a1.215,1.215,0,0,1-1.721-1.716Z" transform="translate(-11.251 -6.194)" fill="#fff" />
					</svg>

			</span>
			Close Tab</button>
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
