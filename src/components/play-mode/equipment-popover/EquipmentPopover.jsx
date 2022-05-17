import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './EquipmentPopover.module.css';
import {PlaceholderImg} from '../../../PlaceholderImg.jsx';

// import {generateObjectUrlCard} from '../../../../card-generator.js';

const width = 400;

export const EquipmentPopover = ({
  open = true,
  // start_url = '',
}) => {
  // const [imgUrl, setImgUrl] = useState(null);

  /* useEffect(() => {
    if (start_url) {
      let live = true;
      (async () => {
        const imgUrl = await generateObjectUrlCard({
          start_url,
          width,
        });
        if (!live) return;
        setImgUrl(imgUrl);
      })();

      return () => {
        live = false;
      };
    }
  }, [start_url]); */

  /* const revokeObjectUrl = e => {
    URL.revokeObjectURL(imgUrl);
  }; */

  return (
    <div className={ classnames(styles.equipmentPopover, open ? styles.open : null) } >
      <PlaceholderImg className={styles.placeholderImg} />
      {/* <div className={ styles.box } />
      <div className={ styles.label }>
        <div className={ styles.background } />
        <div className={ styles.text }>{''}</div>
      </div> */}
      {/* imgUrl ? (
        <img src={imgUrl} className={ styles.image } onLoad={revokeObjectUrl} onError={revokeObjectUrl} />
      ) : null */}
    </div>
  );
};