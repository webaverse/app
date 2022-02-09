
import classNames from 'classnames';
import React, { useState } from 'react';

import styles from './key-input.module.css';

//

export const KeyInput = ({ initalValue, className }) => {

    const [ value, setValue ] = useState( initalValue );
    const [ active, setActive ] = useState( false );

    const handleKeyPress = ( event ) => {

        event.stopPropagation();
        setValue( event.key );

    };

    const handleWindowClick = () => {

        setActive( false );
        window.removeEventListener( 'keypress', handleKeyPress );
        window.removeEventListener( 'click', handleWindowClick );

    };

    const handleClick = ( event ) => {

        event.stopPropagation();
        setActive( true );
        window.addEventListener( 'keypress', handleKeyPress );
        window.addEventListener( 'mousedown', handleWindowClick );

    };

    //

    return (
        <div className={ classNames( className, styles.keyInput, active ? styles.active : null ) } onClick={ handleClick }>{ value }</div>
    );

};
