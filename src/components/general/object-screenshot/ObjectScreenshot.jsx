
import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';

import { screenshotObjectUrl } from '../../../../object-screenshotter';

import styles from './object-screenshot.module.css';

//

export const ObjectScreenshot = ({ startUrl, width, height, className = '' }) => {

    const canvasRef = useRef( null );

    useEffect( async () => {

        if ( ! canvasRef.current ) return;

        await screenshotObjectUrl({ canvas: canvasRef.current, start_url: startUrl, width, height });

    }, [ startUrl, canvasRef.current ] );

    //

    return (
        <div className={ classnames( className, styles.imgWrapper ) } >
            <canvas ref={ canvasRef } />
        </div>
    );

};
