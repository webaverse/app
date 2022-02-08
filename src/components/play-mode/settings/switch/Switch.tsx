
import React from 'react';
import classNames from 'classnames';

import styles from './switch.module.css';

//

export const Switch = ({ value, values, className }) => {

    return (
        <div className={ classNames( styles.switch, className ) } >
            <div className={ styles.left }>&#8592;</div>
            <div className={ styles.value }>{ value }</div>
            <div className={ styles.right }>&#8594;</div>
        </div>
    );

};
