import React from 'react';
import styles from './button.module.css';
import classnames from 'classnames';

export const Button = ({text, icon, placeholder, placeholderLocation, skew, skewDirection, onClick, style={}}) => {
  return (
    <div onClick={onClick} style={style} className={classnames(styles.item, skew ? styles.skew : null, skewDirection ? styles[skewDirection] : null)}>
      {text? <div className={classnames(styles.label)}>{text}</div> : null}
      {!placeholder? <img src={icon || '/images/user.svg'}></img> : 
        <span className={styles.placeholder}> {placeholder} </span>
      }
    </div>
  );
};
