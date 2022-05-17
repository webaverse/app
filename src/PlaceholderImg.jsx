import React from 'react';
import classnames from 'classnames';

import styles from './PlaceholderImg.module.css';

export const PlaceholderImg = ({
  className,
}) => {
  return (
    <img className={classnames(className, styles.placeholderImg)} src="./images/arc.svg" />
  );
};