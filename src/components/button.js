import React from 'react';
import styles from './button.module.css';
import classnames from 'classnames';

export const Button = ({text, icon, skew, skewDirection, onClick}) => {
  return (
    <div onClick={onClick} className={classnames(styles.item, skew ? styles.skew : null, skewDirection ? styles[skewDirection] : null)}>
      <div className={classnames(styles.label)}>{text}</div>
      <img src={icon || '/images/user.svg'}></img>
    </div>
  );
};
