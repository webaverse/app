import React from 'react';
import classnames from 'classnames';

import styles from './PlaceholderImg.module.css';

export const PlaceholderImg = ({
  className = null,
  src = './images/arc.svg',
}) => {
  return (
    <img className={classnames(className, styles.placeholderImg)} src={src} />
  );
};