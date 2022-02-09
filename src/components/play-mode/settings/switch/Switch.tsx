
import React, { useState } from 'react';
import classNames from 'classnames';

import styles from './switch.module.css';

//

export const Switch = ({ value, values, className }) => {

    const [ valueId, setValueId ] = useState( values.indexOf( value ) );

    const handleLeftArrowClick = () => {

        const newValueId = ( valueId === 0 ? values.length - 1 : valueId - 1 );
        setValueId( newValueId );

    };

    const handleRightArrowClick = () => {

        const newValueId = ( valueId >= values.length - 1 ? 0 : valueId + 1 );
        setValueId( newValueId );

    };

    return (
        <div className={ classNames( styles.switch, className ) } >
            <div className={ styles.left } onClick={ handleLeftArrowClick }>&#8592;</div>
            <div className={ styles.value } onClick={ handleRightArrowClick }>{ values[ valueId ] }</div>
            <div className={ styles.right } onClick={ handleRightArrowClick }>&#8594;</div>
        </div>
    );

};
