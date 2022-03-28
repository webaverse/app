import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './HotBox.module.css';
import loadoutManager from '../../../../loadout-manager.js';

export const HotBox = props => {
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
      <div className={ classnames(styles.hotBox, selected ? styles.selected : null) } >
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