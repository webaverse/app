import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './spritesheet.module.css';
import spritesheetManager from '../../../../spritesheet-manager.js';

//

export const Spritesheet = ({
    className,
    startUrl,
    enabled,
    size,
    numFrames,
}) => {
    // console.log('spritesheet url', startUrl);
    const [ spritesheet, setSpritesheet ] = useState(null);
    const canvasRef = useRef();

    const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
    const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
    const frameSize = size / numFramesPerRow;
    const frameLoopTime = 2000;
    const frameTime = frameLoopTime / numFrames;

    useEffect(() => {
        if (startUrl) {
            let live = true;
            (async () => {
                // console.log('got spritesheet 1', {startUrl, frameSize, numFramesPerRow, size, numFrames});
                const spritesheet = await spritesheetManager.getSpriteSheetForAppUrlAsync(startUrl, {
                    size,
                    numFrames,
                });
                
                /* {
                    const imageBitmap = spritesheet.result;
                    const canvas = document.createElement('canvas');
                    canvas.width = imageBitmap.width;
                    canvas.height = imageBitmap.height;
                    canvas.style.cssText = `\
                        position: fixed;
                        top: 100px;
                        left: 100px;
                        width: ${600}px;
                        height: ${600}px;
                        background-color: #F00;
                    `;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imageBitmap, 0, 0);
                    document.body.appendChild(canvas);
                } */

                if (!live) {
                    return;
                }
                setSpritesheet(spritesheet);
            })();
            return () => {
              live = false;
            };
        }
    }, [startUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && spritesheet && enabled) {
            const ctx = canvas.getContext('2d');
            const imageBitmap = spritesheet.result;
            // console.log('render image bitmap', imageBitmap, size, canvas.width, canvas.height);
            // ctx.drawImage(imageBitmap, 0, 0, size, size, 0, 0, canvas.width, canvas.height);

            let frameIndex = 0;
            const _recurse = () => {
                const x = (frameIndex % numFramesPerRow) * frameSize;
                const y = size - frameSize - Math.floor(frameIndex / numFramesPerRow) * frameSize;
                frameIndex = (frameIndex + 1) % numFrames;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageBitmap, x, y, frameSize, frameSize, 0, 0, canvas.width, canvas.height);
            };
            const interval = setInterval(_recurse, frameTime);
            return () => {
                clearInterval(interval);
            };
        }
    }, [canvasRef, spritesheet, enabled]);

    return (
        <canvas
            className={classnames(className, styles.canvas)}
            width={frameSize}
            height={frameSize}
            ref={canvasRef}
        />
    );
};