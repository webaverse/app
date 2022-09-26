
import classNames from 'classnames';
import React, {useState} from 'react';

import styles from './slider.module.css';

//

export const Slider = ({className, value, setValue, max = 100, min = 0}) => {
  const handleMinusBtnClick = () => {
    const newValue = Math.max(min, value - 10);
    setValue(newValue);
  };

  const handlePlusBtnClick = () => {
    const newValue = Math.min(max, value + 10);
    setValue(newValue);
  };

  //

  return (
        <div className={ classNames(styles.slider, className) }>
            <div className={ styles.minus } onClick={ handleMinusBtnClick }>-</div>
            <div className={ styles.progressWrapper }>
                <div className={ styles.progressFill } style={{width: `${100 * value / max}%`}}></div>
            </div>
            <div className={ styles.value }>{ value }</div>
            <div className={ styles.plus } onClick={ handlePlusBtnClick }>+</div>
            <div className={ styles.clearfix }/>
        </div>
  );
};
