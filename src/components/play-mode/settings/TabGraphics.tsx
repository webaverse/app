
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Switch } from './switch';

import styles from './settings.module.css';

//

const DefaultSettings = {
    resolution:         1,
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

    const [ settingsLoaded, setSettingsLoaded ] = useState( false );
    const [ resolution, setResolution ] = useState( 'HIGH' );
    const [ antialias, setAntialias ] = useState( 'MSAA' );
    const [ viewRange, setViewRange ] = useState( 'HIGH' );
    const [ shadowQuality, setShadowQuality ] = useState( 'HIGH' );
    const [ postprocessing, setPostprocessing ] = useState( 'ON' );
    const [ depthOfField, setDepthOfField ] = useState( 'ON' );
    const [ hdr, setHdr ] = useState( 'ON' );
    const [ bloom, setBloom ] = useState( 'ON' );
    const [ characterDetails, setCharacterDetails ] = useState( 'HIGH' );
    const [ hairPhysics, setHairPhysics ] = useState( 'ON' );

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

        const settingsString = localStorage.getItem( 'GfxSettings' );
        let settings;

        try {

            settings = JSON.parse( settingsString );

        } catch ( err ) {

            settings = DefaultSettings;

        }

        settings = settings ?? DefaultSettings;

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

        setSettingsLoaded( true );

    };

    //

    useEffect( () => {

        if ( ! settingsLoaded ) return;
        saveSettings();
        console.log( resolution );

    }, [ settingsLoaded, resolution, antialias, viewRange, shadowQuality, postprocessing, depthOfField, hdr, bloom, characterDetails, hairPhysics ] );

    useEffect( () => {

        loadSettings();

    }, [] );

    //

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>Display</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Resolution</div>
                <Switch className={ styles.switch } value={ resolution } setValue={ setResolution } values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Antialias</div>
                <Switch className={ styles.switch } value={ antialias } setValue={ setAntialias } values={ [ 'MSAA', 'FXAA', 'NONE' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>View range</div>
                <Switch className={ styles.switch } value={ viewRange } setValue={ setViewRange } values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Shadows quality</div>
                <Switch className={ styles.switch } value={ shadowQuality } setValue={ setShadowQuality } values={ [ 'HIGH', 'MEDIUM', 'LOW', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Postprocessing</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Enabled</div>
                <Switch className={ styles.switch } value={ postprocessing } setValue={ setPostprocessing } values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Depth of field</div>
                <Switch className={ styles.switch } value={ depthOfField } setValue={ setDepthOfField } values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>HDR</div>
                <Switch className={ styles.switch } value={ hdr } setValue={ setHdr } values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Bloom</div>
                <Switch className={ styles.switch } value={ bloom } setValue={ setBloom } values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Character</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Character details</div>
                <Switch className={ styles.switch } value={ characterDetails } setValue={ setCharacterDetails } values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Hair physics</div>
                <Switch className={ styles.switch } value={ hairPhysics } setValue={ setHairPhysics } values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
