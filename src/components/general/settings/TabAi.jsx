
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Switch } from './switch';
import loreAI from '../../../../ai/lore/lore-ai';
import preauthenticator from '../../../../preauthenticator';
import debug from '../../../../debug';

import styles from './settings.module.css';

//

const ApiTypes = [ 'NONE', 'AI21', 'GOOSEAI', 'OPENAI', 'CONVAI' ];
const DefaultSettings = {
    apiType: ApiTypes[0],
    apiKey: '',
};
const authenticatedApiName = 'ai';

export const TabAi = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( false );
    const [ debugEnabled, setDebugEnabled ] = useState( debug.enabled );
    const [ testText, setTestText ] = useState( '' );

    const [ apiType, setApiType ] = useState( null );
    const [ apiKey, setApiKey ] = useState( null );
    const [ apiKeyEnabled, setApiKeyEnabled ] = useState( false );
    const [ testRunning, setTestRunning ] = useState( false );

    //

    useEffect(() => {
        function enabledchange(e) {
            setDebugEnabled(e.data.enabled);
        }
        debug.addEventListener('enabledchange', enabledchange);
        return () => {
            debug.removeEventListener('enabledchange', enabledchange);
        };
    }, []);

    useEffect(() => {
        let live = true;
        (async () => {
            const hasApiKey = await preauthenticator.hasAuthenticatedApi(authenticatedApiName);
            // console.log('has api key', hasApiKey);
            if (!live) return;
            setApiKeyEnabled( hasApiKey );
        })();
        return () => {
            live = false;
        }
    }, []);

    //

    const _getApiUrl = apiType => {
        switch (apiType) {
            case 'NONE': return null;
            case 'AI21': return `https://ai.webaverse.com/ai21/v1/engines/j1-large/completions`;
            case 'GOOSEAI': return `https://ai.webaverse.com/gooseai/v1/engines/gpt-neo-20b/completions`;
            case 'OPENAI': return `https://api.openai.com/v1/engines/text-davinci-002/completions`;
            case 'CONVAI': return `https://api.convai.com/webaverse`
            default: return null;
        }
    };
    const _apiTypeNeedsApiKey = apiType => apiType === 'OPENAI' || apiType === 'CONVAI';

    function updateLoreEndpoint(apiType) {
        const url = _getApiUrl(apiType);
        if (_apiTypeNeedsApiKey(apiType)) {
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
            apiKey:         apiKey,
        };

        if (_apiTypeNeedsApiKey(apiType) && apiKeyEnabled && !apiKey) {
            // keep old api key
        } else {
            if (_apiTypeNeedsApiKey(apiType) && apiKey) {
                const url = _getApiUrl(apiType);
                const origin = new URL(url).origin;
                
                (async () => {
                    await preauthenticator.setAuthenticatedApi(authenticatedApiName, origin, `Bearer ${apiKey}`);
                    setApiKeyEnabled(true);
                })().catch(err => {
                    console.warn(err);
                });
            } else {
                (async () => {
                    await preauthenticator.deleteAuthenticatedApi(authenticatedApiName);
                    setApiKeyEnabled(false);
                })().catch(err => {
                    console.warn(err);
                });
            }
        }

        localStorage.setItem( 'AiSettings', JSON.stringify( settings ) );

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
        const apiKey = settings.apiKey ?? '';

        updateLoreEndpoint(apiType);

        // set react state
        setApiType( apiType );
        setApiKey( apiKey );

        // console.log('set api', settings.apiType ?? DefaultSettings.apiType, keyString ?? DefaultSettings.apiKey);

        setSettingsLoaded( true );

    };

    function applySettings () {

        saveSettings();

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

    async function testAi(e) {
        setTestRunning(true);

        const prompt = testText;
        const response = await loreAI.generate(prompt, {
            // stop: '\n',
        });
        setTestText(prompt + response);

        setTestRunning(false);
    }

    //

    return (
        <div className={ classNames( styles.apiKeysTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>MODEL</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Provider</div>
                <Switch className={ styles.switch } value={ apiType } setValue={ setApiType } values={ ApiTypes } />
                {_apiTypeNeedsApiKey(apiType) ?
                    <input
                        type="text"
                        className={ classNames(styles.input, apiKeyEnabled ? styles.enabled : null) }
                        value={ apiKey ?? '' }
                        onChange={e => setApiKey(e.target.value) }
                        placeholder={`API Key${apiKeyEnabled ? ' (set)' : ''}`}
                    />
                :
                  null}
                <div className={ styles.clearfix } />                
            </div>

            {debugEnabled ? (<>
                <div className={ styles.blockTitle }>Test</div>
                <div className={ styles.row }>
                
                    <textarea
                        className={ styles.textarea }
                        value={testText}
                        onChange={e => {
                            setTestText(e.target.value);
                        }}
                    ></textarea>
                    <div className={ styles.clearfix } />
                    <input type="button" className={ styles.button } value={ testRunning ? 'Working...' : 'Submit' } disabled={testRunning} onClick={testAi} />
                </div>
            </>) : null}

            <div className={ classNames( styles.applyBtn, changesNotSaved ? styles.active : null ) } onClick={ handleApplySettingsBtnClick } >
                { appyingChanges ? 'APPLYING' : 'APPLY' }
            </div>
        </div>
    );

};
