
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { TabGeneral } from './TabGeneral';
import { TabControls } from './TabControls';
import { TabAudio } from './TabAudio';
import { TabGraphics } from './TabGraphics';
import { TabApiKeys } from './TabApiKeys';

import styles from './settings.module.css';

//

export const Settings = ({ opened, setOpened }) => {

    const componentName = 'Settings';
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

    const closeOtherWindows = () => {

        window.dispatchEvent( new CustomEvent( 'CloseAllMenus', { detail: { dispatcher: componentName } } ) );

    };

    //

    useEffect( () => {

        if ( opened ) {

            closeOtherWindows();

        }

        const handleKeyPress = ( event ) => {

            if ( opened && event.key === 'Escape' ) {

                setOpened( false );

            }

        };

        window.addEventListener( 'keydown', handleKeyPress );

        return () => {

            window.removeEventListener( 'keydown', handleKeyPress );

        };

    }, [ opened ] );

    //

    return (

        <div className={ classNames( styles.settings, opened ? styles.open : null ) } onClick={ stopPropagation } >

            <div className={ styles.closeBtn } onClick={ handleCloseBtnClick } >X</div>

            <div className={ styles.wrapper } >
                <div className={ styles.title } >SETTINGS</div>

                <div className={ styles.tabs } >
                    <div className={ classNames( styles.tab, activeTab === 'general' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='general' >GENERAL</div>
                    <div className={ classNames( styles.tab, activeTab === 'controls' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='controls' >CONTROLS</div>
                    <div className={ classNames( styles.tab, activeTab === 'audio' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='audio' >AUDIO</div>
                    <div className={ classNames( styles.tab, activeTab === 'graphics' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='graphics' >GRAPHICS</div>
                    {/* <div className={ classNames( styles.tab, activeTab === 'apiKeys' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='apiKeys' >API KEYS</div> */}
                    <div className={ styles.clearfix } />
                </div>

                <div className={ styles.tabContentWrapper }>

                    <TabGeneral active={ activeTab === 'general' } />
                    <TabControls active={ activeTab === 'controls' } />
                    <TabAudio active={ activeTab === 'audio' } />
                    <TabGraphics active={ activeTab === 'graphics' } />
                    {/* <TabApiKeys active={ activeTab === 'apiKeys' } /> */}

                </div>

            </div>

        </div>

    );

};
