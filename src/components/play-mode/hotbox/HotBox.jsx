import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './HotBox.module.css';
import loadoutManager from '../../../../loadout-manager.js';

export const HotBox = ({
  index,
  size,
  onDragOver,
  onDrop,
  onClick,
  onDoubleClick,
}) => {
  const canvasRef = useRef();
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;

      const hotbarRenderer = loadoutManager.getHotbarRenderer(index);
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
        // eslint-disable-next-line no-self-compare
        setSelected(index === index);
      }
    }

    loadoutManager.addEventListener('selectedchange', selectedchange);

    return () => {
      loadoutManager.removeEventListener('selectedchange', selectedchange);
    };
  }, []);

  const pixelRatio = window.devicePixelRatio;

  return (
    <div
      className={ classnames(styles.hotBox, selected ? styles.selected : null) }
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={ styles.box } />
      <div className={ styles.label }>
        <div className={ styles.background } />
        <div className={ styles.text }>{ index + 1 }</div>
      </div>
      <canvas
        className={ styles.hotbox }
        width={size * pixelRatio}
        height={size * pixelRatio}
        ref={canvasRef}
      />
    </div>
  );
};
