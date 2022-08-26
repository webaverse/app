
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import game from '../../../../game.js';
import {getSettings} from '../../../../settings.js';
import metaversefileApi from '../../../../metaversefile-api'
import { Switch } from './switch';

import styles from './settings.module.css';

//

const DefaultSettings = {
    resolution:         'HIGH',
    antialias:          'NONE',
    viewRange:          'HIGH',
    shadowQuality:      'HIGH',
    postprocessing: {
        enabled:        'ON',
        depthOfField:   'ON',
        hdr:            'ON',
        bloom:          'ON'
    },
    character: {
        details:        'HIGH',
        hairPhysics:    'ON'
    }
};

export const TabGraphics = ({ active }) => {

    const [ appyingChanges, setAppyingChanges ] = useState( false );
    const [ changesNotSaved, setChangesNotSaved ] = useState( false );
    const [ settingsLoaded, setSettingsLoaded ] = useState( false );

    const [ resolution, setResolution ] = useState( null );
    const [ antialias, setAntialias ] = useState( null );
    const [ viewRange, setViewRange ] = useState( null );
    const [ shadowQuality, setShadowQuality ] = useState( null );
    const [ postprocessing, setPostprocessing ] = useState( null );
    const [ depthOfField, setDepthOfField ] = useState( null );
    const [ hdr, setHdr ] = useState( null );
    const [ bloom, setBloom ] = useState( null );
    const [ characterDetails, setCharacterDetails ] = useState( null );
    const [ hairPhysics, setHairPhysics ] = useState( null );

    //

    function saveSettings () {

        const settings = {
            resolution:         resolution,
            antialias:          antialias,
            viewRange:          viewRange,
            shadowQuality:      shadowQuality,
            postprocessing: {
                enabled:        postprocessing,
                depthOfField:   depthOfField,
                hdr:            hdr,
                bloom:          bloom
            },
            character: {
                details:        characterDetails,
                hairPhysics:    hairPhysics
            }
        };

        localStorage.setItem( 'GfxSettings', JSON.stringify( settings ) );

    };

    function loadSettings () {

        const settings = getSettings();

        setResolution( settings.resolution ?? DefaultSettings.resolution );
        setAntialias( settings.antialias ?? DefaultSettings.antialias );
        setViewRange( settings.viewRange ?? DefaultSettings.viewRange );
        setShadowQuality( settings.shadowQuality ?? DefaultSettings.shadowQuality );
        setPostprocessing( settings.postprocessing.enabled ?? DefaultSettings.postprocessing.enabled );
        setDepthOfField( settings.postprocessing.depthOfField ?? DefaultSettings.postprocessing.depthOfField );
        setHdr( settings.postprocessing.hdr ?? DefaultSettings.postprocessing.hdr );
        setBloom( settings.postprocessing.bloom ?? DefaultSettings.postprocessing.bloom );
        setCharacterDetails( settings.character.details ?? DefaultSettings.character.details );
        setHairPhysics( settings.character.hairPhysics ?? DefaultSettings.character.hairPhysics );

    };

    function applySettings () {

        // set avatar style

        let avatarStyle = 4;
        if ( characterDetails === 'HIGH' ) avatarStyle = 3;
        if ( characterDetails === 'MEDIUM' ) avatarStyle = 2;
        if ( characterDetails === 'LOW' ) avatarStyle = 1;

        const localPlayer = metaversefileApi.useLocalPlayer();

        function setAvatarQuality () {

            game.setAvatarQuality( avatarStyle );

        };

        if ( localPlayer.avatar ) {

            setAvatarQuality();

        }

        //

        saveSettings();
        setChangesNotSaved( false );
        setTimeout( () => { setAppyingChanges( false ) }, 1000 );

    };

    function handleApplySettingsBtnClick () {

        setAppyingChanges( true );
        setTimeout( applySettings, 100 );

    };

    //

    useEffect( () => {

        if ( resolution && antialias && viewRange && shadowQuality && postprocessing && depthOfField && hdr && bloom && characterDetails && hairPhysics ) {

            if ( settingsLoaded ) {

                setChangesNotSaved( true );

            } else {

                setSettingsLoaded( true );
                applySettings();

            }

        }

    }, [ resolution, antialias, viewRange, shadowQuality, postprocessing, depthOfField, hdr, bloom, characterDetails, hairPhysics ] );

    useEffect( () => {

        loadSettings();

    }, [] );

    //

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>Display</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Resolution</div>
                <Switch className={ styles.switch } value={ resolution } setValue={ setResolution } values={ [ 'LOW', 'MEDIUM', 'HIGH' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Antialias</div>
                <Switch className={ styles.switch } value={ antialias } setValue={ setAntialias } values={ [ 'MSAA', 'FXAA', 'NONE' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>View range</div>
                <Switch className={ styles.switch } value={ viewRange } setValue={ setViewRange } values={ [ 'LOW', 'MEDIUM', 'HIGH' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Shadows quality</div>
                <Switch className={ styles.switch } value={ shadowQuality } setValue={ setShadowQuality } values={ [ 'OFF', 'LOW', 'MEDIUM', 'HIGH' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Postprocessing</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Enabled</div>
                <Switch className={ styles.switch } value={ postprocessing } setValue={ setPostprocessing } values={ [ 'OFF', 'ON' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Depth of field</div>
                <Switch className={ styles.switch } value={ depthOfField } setValue={ setDepthOfField } values={ [ 'OFF', 'ON' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>HDR</div>
                <Switch className={ styles.switch } value={ hdr } setValue={ setHdr } values={ [ 'OFF', 'ON' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Bloom</div>
                <Switch className={ styles.switch } value={ bloom } setValue={ setBloom } values={ [ 'OFF', 'ON' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Character</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Character details</div>
                <Switch className={ styles.switch } value={ characterDetails } setValue={ setCharacterDetails } values={ [ 'LOW', 'MEDIUM', 'HIGH', 'ULTRA' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Hair physics</div>
                <Switch className={ styles.switch } value={ hairPhysics } setValue={ setHairPhysics } values={ [ 'OFF', 'ON' ] } />
                <div className={ styles.clearfix } />
            </div>

            <div className={ classNames( styles.applyBtn, changesNotSaved ? styles.active : null ) } onClick={ handleApplySettingsBtnClick } >
                { appyingChanges ? 'APPLYING' : 'APPLY' }
            </div>
        </div>
    );

};
