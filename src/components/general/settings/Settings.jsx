
import React, { useContext } from 'react';
import classNames from 'classnames';

import { TabGeneral } from './TabGeneral';
import { TabControls } from './TabControls';
import { TabAudio } from './TabAudio';
import { TabGraphics } from './TabGraphics';
import { TabAi } from './TabAi';
import { AppContext } from '../../app';

import styles from './settings.module.css';

//

export const Settings = () => {

    const { state, setState } = useContext( AppContext );

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCloseBtnClick = () => {

        setState( state => ({ ...state, settings: { ...state.settings, opened: false } }) );

    };

    const handleTabClick = ( event ) => {

        const tabName = event.currentTarget.getAttribute('data-tab-name');
        setState( state => ({ ...state, settings: { ...state.settings, activeTab: tabName } }) );

    };

    //

    return (

        <div className={ classNames( styles.settings, state.settings.opened ? styles.open : null ) } onClick={ stopPropagation } >

            <div className={ styles.closeBtn } onClick={ handleCloseBtnClick } >X</div>

            <div className={ styles.wrapper } >
                <div className={ styles.title } >SETTINGS</div>

                <div className={ styles.tabs } >
                    <div className={ classNames( styles.tab, state.settings.activeTab === 'general' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='general' >GENERAL</div>
                    <div className={ classNames( styles.tab, state.settings.activeTab === 'controls' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='controls' >CONTROLS</div>
                    <div className={ classNames( styles.tab, state.settings.activeTab === 'audio' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='audio' >AUDIO</div>
                    <div className={ classNames( styles.tab, state.settings.activeTab === 'graphics' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='graphics' >GRAPHICS</div>
                    <div className={ classNames( styles.tab, state.settings.activeTab === 'ai' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='ai' >AI</div>
                    <div className={ styles.clearfix } />
                </div>

                <div className={ styles.tabContentWrapper }>

                    <TabGeneral active={ state.settings.activeTab === 'general' } />
                    <TabControls active={ state.settings.activeTab === 'controls' } />
                    <TabAudio active={ state.settings.activeTab === 'audio' } />
                    <TabGraphics active={ state.settings.activeTab === 'graphics' } />
                    <TabAi active={ state.settings.activeTab === 'ai' } />

                </div>

            </div>

        </div>

    );

};
