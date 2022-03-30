import React, { forwardRef, useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';
import styles from './spritesheet.module.css';
import spritesheetManager from '../../../../spritesheet-manager.js';

//

const size = 2048;
const numFrames = 128;
const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
const frameSize = size / numFramesPerRow;
const frameLoopTime = 2000;
const frameTime = frameLoopTime / numFrames;

//

export const Spritesheet = ({
    className,
    startUrl,
    enabled,
    frameSize,
    numFrames,
}) => {
    const [ spritesheet, setSpritesheet ] = useState(null);
    const canvasRef = useRef();

    const size = frameSize * numFramesPerRow;

    useEffect(() => {
        if (startUrl) {
            let live = true;
            (async () => {
                const spritesheet = await spritesheetManager.getSpriteSheetForAppUrlAsync(startUrl, {
                    size,
                    numFrames,
                });
                // console.log('load spritesheet', spritesheet);
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