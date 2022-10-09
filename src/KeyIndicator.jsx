import React from 'react';
import styles from './KeyIndicator.module.css';

export const KeyIndicator = props => {
  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        {props.indicator ? (
          <span className={styles.indicator}>{props.indicator}</span>
        ) : null}
        {props.indicatorSvg ? (
          <img className={styles.indicatorsvg} src={props.indicatorSvg} />
        ) : null}
      </div>
      <div className={styles.label}>
        <span>
          {props.label}
          {props.gridSnapEnabled > 0
            ? props.gridSnapEnabled
            : props.gridSnapEnabled === 0
            ? 'Off'
            : null}
        </span>
      </div>
    </div>
  );
};
