
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { KeyInput } from './key-input';

import styles from './settings.module.css';

//

const DefaultSettings = {

};

export const TabControls = ({ active }) => {

    const [ settingsLoaded, setSettingsLoaded ] = useState( false );
    const [ moveForward, setMoveForward ] = useState( null );

    //

    function saveSettings () {

        const settings = {

        };

        // todo

        applySettings();
        localStorage.setItem( 'ControlsSettings', JSON.stringify( settings ) );

    };

    function loadSettings () {

        const settingsString = localStorage.getItem( 'ControlsSettings' );
        let settings;

        try {

            settings = JSON.parse( settingsString );

        } catch ( err ) {

            settings = DefaultSettings;

        }

        settings = settings ?? DefaultSettings;

        // todo

        applySettings();
        setSettingsLoaded( true );

    };

    function applySettings () {

        // todo

    };

    //

    useEffect( () => {

        if ( ! settingsLoaded ) return;
        saveSettings();

    }, [ settingsLoaded ] );

    useEffect( () => {

        loadSettings();

    }, [] );

    //

    return (
        <div className={ classNames( styles.controlsTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move forward</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'W' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move left</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'A' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move right</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'D' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move back</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'S' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Jump</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SPACE' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Run</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SHIFT+W' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Naruto run</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SHIFT+W+W' } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
