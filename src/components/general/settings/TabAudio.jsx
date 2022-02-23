
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { defaultVoicePack } from '../../../../constants.js';
import game from '../../../../game';
import { Slider } from './slider';

import styles from './settings.module.css';

//

const DefaultSettings = {
    general:        100,
    music:          100,
    voice:          100,
    effects:        100,
    voicePack:      defaultVoicePack.name
};

export const TabAudio = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( null );

    const [ voicePacks, setVoicePacks ] = useState([]);

    const [ generalVolume, setGeneralVolume ] = useState( null );
    const [ musicVolume, setMusicVolume ] = useState( null );
    const [ voiceVolume, setVoiceVolume ] = useState( null );
    const [ effectsVolume, setEffectsVolume ] = useState( null );
    const [ voicePack, setVoicePack ] = useState( '' );

    //

    function saveSettings () {

        const settings = {
            general:        generalVolume,
            music:          musicVolume,
            voice:          voiceVolume,
            effects:        effectsVolume,
            voicePack:      voicePack
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

        setSettingsLoaded( true );

    };

    function applySettings () {

        // set voice pack

        const vp = voicePacks[ voicePacks.map( ( vp ) => { return vp.name; } ).indexOf( voicePack ).toString() ];

        if ( typeof vp.drive_id === 'string' ) {

            game.setVoice( vp.drive_id );

        } else if ( typeof vp.audioUrl === 'string' || typeof vp.indexUrl === 'string' ) {

            (async () => {

                await game.loadVoicePack({
                    audioUrl: vp.audioUrl,
                    indexUrl: vp.indexUrl
                });

            })().catch( ( err ) => {

                console.warn( err );

            });

        } else {

            console.warn( 'no such voice pack', voicePack );

        }

        //

        saveSettings();
        setChangesNotSaved( false );
        setTimeout( () => { setAppyingChanges( false ) }, 1000 );

    };

    async function loadVoicePack () {

        const res = await fetch( `https://raw.githubusercontent.com/webaverse/tiktalknet/main/model_lists/all_models.json` );
        const voicePacks = await res.json();
        setVoicePacks( [ defaultVoicePack ].concat( voicePacks ) );

    };

    function handleApplySettingsBtnClick () {

        setAppyingChanges( true );
        setTimeout( applySettings, 100 );

    };

    //

    useEffect( () => {

        if ( generalVolume && musicVolume && voiceVolume && effectsVolume && voicePack ) {

            if ( settingsLoaded ) {

                setChangesNotSaved( true );

            } else {

                setSettingsLoaded( true );
                applySettings();

            }

        }

    }, [ generalVolume, musicVolume, voiceVolume, effectsVolume, voicePack ] );

    useEffect( async () => {

        await loadVoicePack();
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
            <div className={ classNames( styles.applyBtn, changesNotSaved ? styles.active : null ) } onClick={ handleApplySettingsBtnClick } >
                { appyingChanges ? 'APPLYING' : 'APPLY' }
            </div>
        </div>
    );

};
