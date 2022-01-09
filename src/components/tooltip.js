import React from 'react';
import styles from '../styles/tooltip.module.css';
import classnames from 'classnames';

export const Tooltip = ({text, tooltip, position = 'top', style={}}) => {
  return (
    <div style={style} data-tooltip={tooltip} className={classnames(styles.tooltip, styles[position])}>{text}</div>
  );
};
