import React, {useEffect, useState, useRef, useContext} from 'react';
import classnames from 'classnames';
import styles from './BigButton.module.css';

export const BigButton = ({
  highlight = false,
  onClick,
  children,
}) => {
  return (
      <div
          className={classnames(styles.bigButton, highlight ? styles.highlight : null)}
          onClick={onClick}
      >
          {children}
      </div>
  );
};
