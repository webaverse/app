
import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';

import { screenshotObjectApp } from '../../../../object-screenshotter';

import styles from './object-screenshot.module.css';

//

export const ObjectScreenshot = ({ app, startUrl, width, height, className = '' }) => {

    const canvasRef = useRef( null );

    useEffect( async () => {

        if ( ! canvasRef.current ) return;

        await screenshotObjectApp({ app, clearAlpha: 0, canvas: canvasRef.current, start_url: startUrl });

    }, [ startUrl, canvasRef.current ] );

    //

    return (
        <div className={ classnames( className, styles.imgWrapper ) } >
            <canvas ref={ canvasRef } width={ width } height={ height } />
            <div className={ styles.background } />
        </div>
    );

};
