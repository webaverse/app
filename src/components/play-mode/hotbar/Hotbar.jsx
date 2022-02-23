import React, {useState, useRef, useEffect} from 'react';
import styles from './hotbar.module.css';
import metaversefileApi from 'metaversefile';
import {createHotbarRenderer, getHotbarRenderers} from '../../../../hotbar.js';

const HotbarItem = props => {
    const [hotbarRenderer, setHotbarRenderer] = useState(null);
    const canvasRef = useRef();
    
    useEffect(() => {
        const _cleanup = () => {
          if (hotbarRenderer) {
            hotbarRenderer.destroy();
            setHotbarRenderer(null);
          }
        };

        if (canvasRef.current) {
            const canvas = canvasRef.current;
            
            const newHotbarRenderer = createHotbarRenderer(props.size, props.size, props.selected);
            newHotbarRenderer.addCanvas(canvas);
            setHotbarRenderer(newHotbarRenderer);
        } else {
          _cleanup();
        }
        return _cleanup;
    }, [canvasRef]);
    useEffect(() => {
        if (hotbarRenderer) {
          hotbarRenderer.setSelected(props.selected);
        }
    }, [hotbarRenderer, props.selected]);
    
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

    const [hotbarIndex, setHotbarIndex] = useState(0);
    
    useEffect(() => {
        function keydown(e) {
            switch (e.which) {
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56: {
                    let newHotbarIndex = e.which - 49;
                    if (newHotbarIndex === hotbarIndex) {
                        newHotbarIndex = -1;
                    }
                    setHotbarIndex(newHotbarIndex);
                    
                    { // XXX test hack
                      const i = e.which - 49;
                      if (i === 0) {
                        const hotbarRenderer = getHotbarRenderers()[i];
                        if (hotbarRenderer) {
                          const localPlayer = metaversefileApi.useLocalPlayer();
                          const wearActions = localPlayer.getActionsArray().filter(a => a.type === 'wear');
                          const firstWearAction = wearActions[0];
                          if (firstWearAction) {
                            const app = metaversefileApi.getAppByInstanceId(firstWearAction.instanceId);
                            hotbarRenderer.setApp(app);
                          }
                        }
                      }
                    }
                    
                    break;
                }
            }
        }
        window.addEventListener('keydown', keydown);

        return () => {
          window.removeEventListener('keydown', keydown);
        };
    }, [hotbarIndex]);

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
                                <HotbarItem size={60} selected={hotbarIndex === i} />
                            </div>
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
