
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// import game from '../../../../game.js';
// import metaversefileApi from '../../../../metaversefile-api'
import { Switch } from './switch';

import styles from './settings.module.css';

//

const DefaultSettings = {
    apiKey: '',
};

export const TabApiKeys = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( false );

    const [ apiType, setApiType ] = useState( 'OPENAI' );
    const [ apiKey, setApiKey ] = useState( '' );

    //

    function saveSettings () {

        const settings = {
            apiType:        apiType,
            apiKey:         apiKey,
        };

        localStorage.setItem( 'ApiKeySettings', JSON.stringify( settings ) );

    };

    function loadSettings () {

        const settingsString = localStorage.getItem( 'ApiKeySettings' );
        let settings;

        try {

            settings = JSON.parse( settingsString );

        } catch ( err ) {

            settings = DefaultSettings;

        }

        settings = settings ?? DefaultSettings;

        setApiKey( settings.apiKey ?? DefaultSettings.apiKey );

    };

    function applySettings () {

        console.log('apply AI settings', {apiType, apiKey});
        
        /* // set avatar style

        let avatarStyle = 4;
        if ( characterDetails === 'HIGH' ) avatarStyle = 3;
        if ( characterDetails === 'MEDIUM' ) avatarStyle = 2;
        if ( characterDetails === 'LOW' ) avatarStyle = 1;

        const localPlayer = metaversefileApi.useLocalPlayer();

        function setAvatarQuality () {

            game.setAvatarQuality( avatarStyle );
            localPlayer.removeEventListener( 'avatarchange', setAvatarQuality );

        };

        if ( ! localPlayer.avatar ) {

            localPlayer.addEventListener( 'avatarchange', setAvatarQuality );

        } else {

            setAvatarQuality();

        } */

        //

        saveSettings();
        setChangesNotSaved( false );

        setTimeout( () => { setAppyingChanges( false ) }, 1000 );

    };

    function handleApplySettingsBtnClick ( event ) {

        event.stopPropagation();
        setAppyingChanges( true );

        setTimeout( applySettings, 100 );

    };

    //

    useEffect( () => {

        if ( apiType && apiKey ) {

            if ( settingsLoaded ) {

                setChangesNotSaved( true );

            } else {

                setSettingsLoaded( true );
                applySettings();

            }

        }

    }, [ apiType, apiKey ] );

    useEffect( () => {

        loadSettings();

    }, [] );

    //

    return (
        <div className={ classNames( styles.apiKeysTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>AI</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Provider</div>
                <Switch className={ styles.switch } value={ apiType } setValue={ setApiType } values={ [ 'OPENAI', 'GOOSEAI' ] } />
                {apiType === 'OPENAI' ?
                  <input type="text" className={ styles.input } value={ apiKey } onChange={e => setApiKey(e.target.value) } placeholder="API Key" />
                :
                  null}
                <div className={ styles.clearfix } />
            </div>

            <div className={ classNames( styles.applyBtn, changesNotSaved ? styles.active : null ) } onClick={ handleApplySettingsBtnClick } >
                { appyingChanges ? 'APPLYING' : 'APPLY' }
            </div>
        </div>
    );

};
