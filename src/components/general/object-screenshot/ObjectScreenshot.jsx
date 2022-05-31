
import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';

import { screenshotObjectApp } from '../../../../object-screenshotter';

import styles from './object-screenshot.module.css';

//

export const ObjectScreenshot = ({ app, startUrl, width, height, className = '' }) => {

    const canvasRef = useRef( null );

    useEffect( async () => {

        if ( ! canvasRef.current ) return;
        const canvas = await screenshotObjectApp({ app, clearAlpha: 0, width, height, start_url: startUrl });
        canvasRef.current.innerHTML = "";
        canvasRef.current.appendChild( canvas );
    }, [ startUrl, canvasRef.current ] );

    //

    return (
        <div className={ classnames( className, styles.imgWrapper ) } >
            <div ref={ canvasRef } width={ width } height={ height }></div>
            <div className={ styles.background } />
        </div>
    );

};
