import React from 'react';
import styles from '../styles/tooltip.module.css';
import classnames from 'classnames';

export const Tooltip = ({text, tooltip, position = 'top'}) => {
  return (
    <div data-tooltip={tooltip} className={classnames(styles.tooltip, styles[position])}>{text}</div>
  );
};
