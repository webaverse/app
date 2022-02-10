
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Slider } from './slider';

import styles from './settings.module.css';

//

const DefaultSettings = {
    general:      100,
    music:        100,
    voice:        100,
    effects:      100
};

export const TabAudio = ({ active }) => {

    const [ settingsLoaded, setSettingsLoaded ] = useState( null );
    const [ generalVolume, setGeneralVolume ] = useState( null );
    const [ musicVolume, setMusicVolume ] = useState( null );
    const [ voiceVolume, setVoiceVolume ] = useState( null );
    const [ effectsVolume, setEffectsVolume ] = useState( null );

    //

    function saveSettings () {

        const settings = {
            general:        generalVolume,
            music:          musicVolume,
            voice:          voiceVolume,
            effects:        effectsVolume
        };

        applySettings();
        localStorage.setItem( 'AudioSettings', JSON.stringify( settings ) );

    };

    function loadSettings () {

        const settingsString = localStorage.getItem( 'AudioSettings' );
        let settings;

        try {

            settings = JSON.parse( settingsString );

        } catch ( err ) {

            settings = DefaultSettings;

        }

        settings = settings ?? DefaultSettings;

        setGeneralVolume( settings.general ?? DefaultSettings.general );
        setMusicVolume( settings.music ?? DefaultSettings.music );
        setVoiceVolume( settings.voice ?? DefaultSettings.voice );
        setEffectsVolume( settings.effects ?? DefaultSettings.effects );

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

    }, [ settingsLoaded, generalVolume, musicVolume, voiceVolume, effectsVolume ] );

    useEffect( () => {

        loadSettings();

    }, [] );

    //

    return (
        <div className={ classNames( styles.audioTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.row }>
                <div className={ styles.paramName }>General volume</div>
                <Slider className={ styles.slider } value={ generalVolume } setValue={ setGeneralVolume } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Music volume</div>
                <Slider className={ styles.slider } value={ musicVolume } setValue={ setMusicVolume } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Voice volume</div>
                <Slider className={ styles.slider } value={ voiceVolume } setValue={ setVoiceVolume } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Effects volume</div>
                <Slider className={ styles.slider } value={ effectsVolume } setValue={ setEffectsVolume } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
