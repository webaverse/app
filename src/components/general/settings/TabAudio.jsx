
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
// import { voicePacksUrl, voiceEndpointsUrl, defaultVoicePackName } from '../../../../constants';
// import game from '../../../../game';
import { Slider } from './slider';
import * as voices from '../../../../voices';
// import {localPlayer} from '../../../../players';
import overrides from '../../../../overrides';

import styles from './settings.module.css';

import audioManager from '../../../../audio-manager.js';

//

export const noneVoicePack = {
    name: 'None',
    indexPath: null,
    audioPath: null,
};
const noneVoiceEndpoint = {
    name: 'None',
    drive_id: null,
};
const DefaultSettings = {
    general:        100,
    music:          100,
    voice:          100,
    effects:        100,
    voicePack:      noneVoicePack.name,
    voiceEndpoint:  noneVoiceEndpoint.name,
};

export const TabAudio = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( null );

    const [ voicePacks, setVoicePacks ] = useState([]);
    const [ voiceEndpoints, setVoiceEndpoints ] = useState([]);

    const [ generalVolume, setGeneralVolume ] = useState( null );
    const [ musicVolume, setMusicVolume ] = useState( null );
    const [ voiceVolume, setVoiceVolume ] = useState( null );
    const [ effectsVolume, setEffectsVolume ] = useState( null );
    const [ voicePack, setVoicePack ] = useState( '' );
    const [ voiceEndpoint, setVoiceEndpoint ] = useState( '' );

    //

    function saveSettings () {

        const settings = {
            general:        generalVolume,
            music:          musicVolume,
            voice:          voiceVolume,
            effects:        effectsVolume,
            voicePack:      voicePack,
            voiceEndpoint:  voiceEndpoint,
        };

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
        setVoicePack( settings.voicePack ?? DefaultSettings.voicePack );
        setVoiceEndpoint( settings.voiceEndpoint ?? DefaultSettings.voiceEndpoint );

        setSettingsLoaded( true );

    };

    function applySettings () {

        // set volume

        audioManager.setVolume(generalVolume / 100);

        // set voice pack

        overrides.overrideVoicePack.set(voicePack !== 'None' ? voicePack : null);

        // set voice endpoint

        overrides.overrideVoiceEndpoint.set(voiceEndpoint !== 'None' ? voiceEndpoint : null);

        //

        saveSettings();
        setChangesNotSaved( false );
        setTimeout( () => {

            setAppyingChanges( false );
            
        }, 1000 );

    };

    async function loadVoicePack () {

        await voices.waitForLoad();

        setVoicePacks( [ noneVoicePack ].concat( voices.voicePacks ) );

    };

    async function loadVoiceEndpoint () {

        await voices.waitForLoad();

        setVoiceEndpoints( [ noneVoiceEndpoint ].concat( voices.voiceEndpoints ) );

    };

    function handleApplySettingsBtnClick () {

        setAppyingChanges( true );
        setTimeout( applySettings, 100 );

    };

    //

    useEffect( () => {

        if ( generalVolume && musicVolume && voiceVolume && effectsVolume && voicePack && voiceEndpoint ) {

            if ( settingsLoaded ) {

                setChangesNotSaved( true );

            } else {

                setSettingsLoaded( true );
                applySettings();

            }

        }

    }, [ generalVolume, musicVolume, voiceVolume, effectsVolume, voicePack, voiceEndpoint ] );

    useEffect( async () => {

        await Promise.all([
            loadVoicePack(),
            loadVoiceEndpoint(),
        ]);
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
            <div className={ styles.row } >
                <div className={ styles.paramName }>Voice pack</div>
                <select className={ styles.select } value={ voicePack } onChange={ e => { setVoicePack( e.target.value ); } } >
                    {
                        voicePacks.map( ( voicePack, i ) => {
                            return (
                                <option value={ voicePack.name } key={ i }>{ voicePack.name }</option>
                            );
                        })
                    }
                </select>
            </div>
            <div className={ styles.row } >
                <div className={ styles.paramName }>Voice endpoint</div>
                <select className={ styles.select } value={ voiceEndpoint } onChange={ e => { setVoiceEndpoint( e.target.value ); } } >
                    {
                        voiceEndpoints.map( ( voiceEndpoint, i ) => {
                            return (
                                <option value={ voiceEndpoint.name } key={ i }>{ voiceEndpoint.name }</option>
                            );
                        })
                    }
                </select>
            </div>
            <div className={ classNames( styles.applyBtn, changesNotSaved ? styles.active : null ) } onClick={ handleApplySettingsBtnClick } >
                { appyingChanges ? 'APPLYING' : 'APPLY' }
            </div>
        </div>
    );

};
