
import React, { useEffect, useState, useContext } from 'react';
import classNames from 'classnames';

import { TabGeneral } from './TabGeneral';
import { TabControls } from './TabControls';
import { TabAudio } from './TabAudio';
import { TabGraphics } from './TabGraphics';
import { TabAi } from './TabAi';
import { store } from '../../../store';
import { SET_SETTINGS_OPEN } from '../../../actions/Actions';

import styles from './settings.module.css';
import ioManager from '../../../../io-manager';

//

export const Settings = () => {

    const { state, dispatch } = useContext( store );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCloseBtnClick = ( event ) => {

        dispatch({ type: SET_SETTINGS_OPEN, opened: false });

    };

    const handleTabClick = ( event ) => {

        const tabName = event.currentTarget.getAttribute('data-tab-name');
        setActiveTab( tabName );

    };

    //

    useEffect( () => {

        function close () {

            dispatch({ type: SET_SETTINGS_OPEN, opened: false });

        };

        ioManager.addEventListener( 'CloseAllPanels', close );

        return () => {

            ioManager.addEventListener( 'CloseAllPanels', close );

        };

    }, [ state.settings.opened ] );

    //

    return (

        <div className={ classNames( styles.settings, state.settings.opened ? styles.open : null ) } onClick={ stopPropagation } >

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
