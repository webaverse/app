import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './hotbar.module.css';
// import metaversefileApi from 'metaversefile';
import loadoutManager from '../../../../loadout-manager.js';
import {hotbarSize} from '../../../../constants.js';

const HotbarItem = props => {
    const canvasRef = useRef();
    const [selected, setSelected] = useState(false);
    
    useEffect(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;

        const hotbarRenderer = loadoutManager.getHotbarRenderer(props.index);
        hotbarRenderer.addCanvas(canvas);

        return () => {
          hotbarRenderer.removeCanvas(canvas);
        };
      }
    }, [canvasRef]);
    useEffect(() => {
      function selectedchange(e) {
        const {index, app} = e.data;
        if (index === -1 || app) {
          setSelected(index === props.index);
        }
      }

      loadoutManager.addEventListener('selectedchange', selectedchange);

      return () => {
        loadoutManager.removeEventListener('selectedchange', selectedchange);
      };
    }, []);
    
    const pixelRatio = window.devicePixelRatio;

    return (
      <div className={ classnames(styles.item, selected ? styles.selected : null) } >
        <div className={ styles.box } />
        <div className={ styles.label }>
          <div className={ styles.background } />
          <div className={ styles.text }>{ props.index + 1 }</div>
        </div>
        <canvas
          className={ styles.hotbox }
          width={props.size * pixelRatio}
          height={props.size * pixelRatio}
          ref={canvasRef}
        />
      </div>
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
                            <HotbarItem size={hotbarSize} index={i} key={i} />
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
