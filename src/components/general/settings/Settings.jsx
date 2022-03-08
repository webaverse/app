
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import ioManager from '../../../../io-manager';
import { TabGeneral } from './TabGeneral';
import { TabControls } from './TabControls';
import { TabAudio } from './TabAudio';
import { TabGraphics } from './TabGraphics';
import { TabAi } from './TabAi';
import { AppUIStateManager } from '../../app/App';

import styles from './settings.module.css';

//

export const Settings = () => {

    const [ isOpened, setOpened ] = useState( false );
    const [ activeTab, setActiveTab ] = useState('general');

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCloseBtnClick = ( event ) => {

        event.stopPropagation();
        setOpened( false );

    };

    const handleTabClick = ( event ) => {

        event.stopPropagation();

        const tabName = event.currentTarget.getAttribute('data-tab-name');
        setActiveTab( tabName );

    };

    //

    useEffect( () => {

        AppUIStateManager.state.settings = isOpened;

        function toggle () {

            const newValue = ! isOpened;
            if ( newValue ) AppUIStateManager.dispatchEvent( new CustomEvent( 'CloseOtherPanels' ) );
            setOpened( newValue );

        };

        function close () {

            setOpened( false );

        };

        AppUIStateManager.addEventListener( 'ToggleSettingsPanel', toggle );
        ioManager.addEventListener( 'Esc', close );

        return () => {

            AppUIStateManager.removeEventListener( 'ToggleSettingsPanel', toggle );
            ioManager.removeEventListener( 'Esc', close );

        };

    }, [ isOpened ] );

    //

    return (

        <div className={ classNames( styles.settings, isOpened ? styles.open : null ) } onClick={ stopPropagation } >

            <div className={ styles.closeBtn } onClick={ handleCloseBtnClick } >X</div>

            <div className={ styles.wrapper } >
                <div className={ styles.title } >SETTINGS</div>

                <div className={ styles.tabs } >
                    <div className={ classNames( styles.tab, activeTab === 'general' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='general' >GENERAL</div>
                    <div className={ classNames( styles.tab, activeTab === 'controls' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='controls' >CONTROLS</div>
                    <div className={ classNames( styles.tab, activeTab === 'audio' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='audio' >AUDIO</div>
                    <div className={ classNames( styles.tab, activeTab === 'graphics' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='graphics' >GRAPHICS</div>
                    <div className={ classNames( styles.tab, activeTab === 'ai' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='ai' >AI</div>
                    <div className={ styles.clearfix } />
                </div>

                <div className={ styles.tabContentWrapper }>

                    <TabGeneral active={ activeTab === 'general' } />
                    <TabControls active={ activeTab === 'controls' } />
                    <TabAudio active={ activeTab === 'audio' } />
                    <TabGraphics active={ activeTab === 'graphics' } />
                    <TabAi active={ activeTab === 'ai' } />

                </div>

            </div>

        </div>

    );

};
