
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// import game from '../../../../game.js';
// import metaversefileApi from '../../../../metaversefile-api'
import { Switch } from './switch';
import loreAI from '../../../../lore-ai';
import preauthenticator from '../../../../preauthenticator';

import styles from './settings.module.css';

//

const DefaultSettings = {
    apiType: 'GOOSEAI',
    apiKey: '',
};
const authenticatedApiName = 'ai';

export const TabApiKeys = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( false );

    const [ apiType, setApiType ] = useState( null );
    const [ apiKey, setApiKey ] = useState( null );

    //

    const _getApiUrl = apiType => {
        const url = apiType === 'OPENAI' ?
            `https://api.openai.com/v1/engines/text-davinci-001/completions`
        :
            `https://ai.webaverse.com/gooseai/completions`;
        return url;
    };

    function updateLoreEndpoint(apiType) {
        const url = _getApiUrl(apiType);
        if (apiType === 'OPENAI') {
            // console.log('lore ai set endpoint', {authenticatedApiName, url});
            loreAI.setEndpoint(async query => {
                // console.log('call lore ai endpoint', {authenticatedApiName, url, query});
                return await preauthenticator.callAuthenticatedApi(authenticatedApiName, url, query);
            });
        } else {
            console.log('lore ai set urlendpoint', {url});
            loreAI.setEndpointUrl(url);
        }
    };

    async function saveSettings () {

        const settings = {
            apiType:        apiType,
            apiKey:         '',
        };

        localStorage.setItem( 'ApiKeySettings', JSON.stringify( settings ) );
        if (apiKey) {
            const url = _getApiUrl(apiType);
            const origin = new URL(url).origin;
            // console.log('set api key', [authenticatedApiName, origin, `Bearer ${apiKey}`]);
            
            (async () => {
                await preauthenticator.setAuthenticatedApi(authenticatedApiName, origin, `Bearer ${apiKey}`);
            })().catch(err => {
                console.warn(err);
            });
        }

        updateLoreEndpoint(apiType);

    };

    async function loadSettings () {

        // load local storage
        const settingsString = localStorage.getItem( 'ApiKeySettings' );
        let settings;

        try {

            settings = JSON.parse( settingsString );

        } catch ( err ) {

            settings = DefaultSettings;

        }

        settings = settings ?? DefaultSettings;

        const apiType = settings.apiType ?? DefaultSettings.apiType;

        updateLoreEndpoint(apiType);

        // set react state
        setApiType( apiType );
        setApiKey( '' );

        // console.log('set api', settings.apiType ?? DefaultSettings.apiType, keyString ?? DefaultSettings.apiKey);

        setSettingsLoaded( true );

    };

    function applySettings () {

        saveSettings();
        setApiKey( '' );

        setChangesNotSaved( false );

        setTimeout( () => { setAppyingChanges( false ) }, 1000 );

    };

    function handleApplySettingsBtnClick ( event ) {

        event.stopPropagation();

        setAppyingChanges( true );

        setTimeout( applySettings, 100 );
        applySettings();

    };

    //

    useEffect( () => {

        if ( apiType !== null && apiKey !== null ) {

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
                <Switch className={ styles.switch } value={ apiType } setValue={ setApiType } values={ [ 'GOOSEAI', 'OPENAI' ] } />
                {apiType === 'OPENAI' ?
                  <input type="text" className={ styles.input } value={ apiKey ?? '' } onChange={e => setApiKey(e.target.value) } placeholder="API Key" />
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
