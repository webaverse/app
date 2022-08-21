
import React from 'react';
import classNames from 'classnames';

import styles from './switch.module.css';

//

export const Switch = ({value, setValue, values, className}) => {
  const handleLeftArrowClick = () => {
    const oldValueId = values.indexOf(value);
    const newValueId = (oldValueId === 0 ? values.length - 1 : oldValueId - 1);
    setValue(values[newValueId]);
  };

  const handleRightArrowClick = () => {
    const oldValueId = values.indexOf(value);
    const newValueId = (oldValueId >= values.length - 1 ? 0 : oldValueId + 1);
    setValue(values[newValueId]);
  };

  return (
    <div className={ classNames(styles.switch, className) } >
      <div className={ styles.left } onClick={ handleLeftArrowClick }>&#8592;</div>
      <div className={ styles.value } onClick={ handleRightArrowClick }>{ value }</div>
      <div className={ styles.right } onClick={ handleRightArrowClick }>&#8594;</div>
    </div>
  );
};
