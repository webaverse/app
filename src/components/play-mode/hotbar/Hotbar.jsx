import React, {useState, useRef, useEffect} from 'react';
import styles from './hotbar.module.css';
// import metaversefileApi from 'metaversefile';
import wearableManager from '../../../../wearable-manager.js';
import {hotbarSize} from '../../../../constants.js';

const HotbarItem = props => {
    const canvasRef = useRef();
    
    useEffect(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;

        const hotbarRenderer = wearableManager.getHotbarRenderer(props.index);
        hotbarRenderer.addCanvas(canvas);

        return () => {
          hotbarRenderer.removeCanvas(canvas);
        };
      }
    }, [canvasRef]);
    
    const pixelRatio = window.devicePixelRatio;

    return (
        <canvas
          className={styles.hotbox}
          width={props.size * pixelRatio}
          height={props.size * pixelRatio}
          ref={canvasRef}
        />
    );
};

export const Hotbar = () => {

    const itemsNum = 8;

    return (
        <div className={ styles.hotbar } >

            {
                ( () => {

                    const items = Array( itemsNum );

                    for ( let i = 0; i < itemsNum; i ++ ) {

                        items[ i ] = (
                            <div className={ styles.item } key={ i } >
                                <div className={ styles.box } />
                                <div className={ styles.label }>{ i + 1 }</div>
                                <HotbarItem size={hotbarSize} index={i} />
                            </div>
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
