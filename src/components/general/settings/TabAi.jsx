
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Switch } from './switch';
import loreAI from '../../../../ai/lore/lore-ai';
import preauthenticator from '../../../../preauthenticator';

import styles from './settings.module.css';

//

const DefaultSettings = {
    apiType: 'AI21',
    apiKey: '',
};
const authenticatedApiName = 'ai';

export const TabAi = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( false );

    const [ apiType, setApiType ] = useState( null );
    const [ apiKey, setApiKey ] = useState( null );

    //

    const _getApiUrl = apiType => {
        switch (apiType) {
            case 'AI21': return `https://ai.webaverse.com/ai21/v1/engines/j1-large/completions`;
            case 'GOOSEAI': return `https://ai.webaverse.com/gooseai/v1/engines/gpt-neo-20b/completions`;
            case 'OPENAI': return `https://api.openai.com/v1/engines/text-davinci-001/completions`;
            default: return null;
        }
    };
    const _apiTypeNeedsApiKey = apiType => {
        return apiType === 'OPENAI';
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
            loreAI.setEndpointUrl(url);
        }
    };

    async function saveSettings () {

        const settings = {
            apiType:        apiType,
            apiKey:         '',
        };

        localStorage.setItem( 'AiSettings', JSON.stringify( settings ) );
        if (apiKey) {
            const url = _getApiUrl(apiType);
            const origin = new URL(url).origin;
            
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
        const settingsString = localStorage.getItem( 'AiSettings' );
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
            <div className={ styles.blockTitle }>MODEL</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Provider</div>
                <Switch className={ styles.switch } value={ apiType } setValue={ setApiType } values={ [ 'AI21', 'GOOSEAI', 'OPENAI' ] } />
                {_apiTypeNeedsApiKey(apiType) ?
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
