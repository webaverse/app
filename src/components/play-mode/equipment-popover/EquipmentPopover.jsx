import React, {useState, useRef, useEffect} from 'react';
import classnames from 'classnames';
import styles from './EquipmentPopover.module.css';
import {PlaceholderImg} from '../../../PlaceholderImg.jsx';

const width = 400;

export const EquipmentPopover = ({open = true}) => {
  return (
    <div
      className={classnames(styles.equipmentPopover, open ? styles.open : null)}
    >
      <PlaceholderImg
        className={styles.placeholderImg}
        src="./images/arc-white.svg"
      />
    </div>
  );
};
