import React from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';

export const Tab = ({className, type, left, right, top, bottom, index, disabled, label, panels, before, after, open, toggleOpen, onclick, panelsRef}) => {
  if (!onclick) {
    onclick = e => {
      toggleOpen(type);
    };
  }

  const stopPropagation = e => {
    e.stopPropagation();
  };

  return (
    <div className={classnames(
      className,
      styles.tab,
      left ? styles.left : null,
      right ? styles.right : null,
      top ? styles.top : null,
      bottom ? styles.bottom : null,
      index !== undefined ? styles['index-' + index] : null,
      disabled ? styles.disabled : null,
      open === type ? styles.open : null,
    )} onClick={onclick}>
      {left ? <>
        {before}
        {panels ? <div className={styles.panels} onClick={stopPropagation} ref={panelsRef}>
          <div className={styles['panels-wrap']}>
            {panels}
          </div>
        </div> : null}
        {label}
        {after}
      </> : <>
        {before}
        {label}
        {panels ? <div className={styles.panels} onClick={stopPropagation} ref={panelsRef}>
          <div className={styles['panels-wrap']}>
            {panels}
          </div>
        </div> : null}
        {after}
      </>}
    </div>
  );
};
