
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { TabGeneral } from './TabGeneral';
import { TabControls } from './TabControls';
import { TabAudio } from './TabAudio';
import { TabGraphics } from './TabGraphics';

import styles from './settings.module.css';

//

export const Settings = ({ open, setOpen }) => {

    const [ activeTab, setActiveTab ] = useState('general');

    const handleCloseBtnClick = ( event ) => {

        event.stopPropagation();
        setOpen( false );

    };

    const handleTabClick = ( event ) => {

        event.stopPropagation();

        const tabName = event.currentTarget.getAttribute('data-tab-name');
        setActiveTab( tabName );

    };

    useEffect( () => {

        const handleKeyPress = ( event ) => {

            if ( open && event.key === 'Escape' ) {

                setOpen( false );

            }

        };

        window.addEventListener( 'keydown', handleKeyPress );

        return () => {

            window.removeEventListener( 'keydown', handleKeyPress );

        };

    }, [ open ] );

    //

    return (

        <div className={ classNames( styles.settings, open ? styles.open : null ) } >

            <div className={ styles.closeBtn } onClick={ handleCloseBtnClick }>X</div>

            <div className={ styles.wrapper }>
                <div className={ styles.title }>SETTINGS</div>

                <div className={ styles.tabs }>
                    <div className={ classNames( styles.tab, activeTab === 'general' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='general'>GENERAL</div>
                    <div className={ classNames( styles.tab, activeTab === 'controls' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='controls'>CONTROLS</div>
                    <div className={ classNames( styles.tab, activeTab === 'audio' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='audio'>AUDIO</div>
                    <div className={ classNames( styles.tab, activeTab === 'graphics' ? styles.active : null ) } onClick={ handleTabClick } data-tab-name='graphics'>GRAPHICS</div>
                    <div className={ styles.clearfix } />
                </div>

                <div className={ styles.tabContentWrapper }>

                    <TabGeneral active={ activeTab === 'general' } />
                    <TabControls active={ activeTab === 'controls' } />
                    <TabAudio active={ activeTab === 'audio' } />
                    <TabGraphics active={ activeTab === 'graphics' } />

                </div>
            </div>

        </div>

    );

};
