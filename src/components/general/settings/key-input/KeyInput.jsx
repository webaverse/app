
import classNames from 'classnames';
import React, { useState } from 'react';

import styles from './key-input.module.css';

//

export const KeyInput = ({ value, setValue, className }) => {

    const [ active, setActive ] = useState( false );
    const keysList = new Map();

    const updateValue = () => {

        let value = '';
        let index = 0;

        keysList.forEach( ( key, keyIndex ) => {

            let keyName = '';

            if ( keyIndex === ' ' ) {

                keyName = 'space';

            } else {

                keyName = keyIndex;

            }

            value += keyName;
            index ++;
            if ( index < keysList.size ) value += '+';

        });

        setValue( value );

    };

    const handleKeyDown = ( event ) => {

        keysList.set( event.key, true );
        updateValue();

    };

    const handleKeyUp = ( event ) => {

        keysList.delete( event.key );

    };

    const handleWindowClick = () => {

        setActive( false );
        window.removeEventListener( 'keydown', handleKeyDown );
        window.removeEventListener( 'keyup', handleKeyUp );
        window.removeEventListener( 'click', handleWindowClick );

    };

    const handleClick = ( event ) => {

        event.stopPropagation();
        setActive( true );
        window.addEventListener( 'keydown', handleKeyDown );
        window.addEventListener( 'keyup', handleKeyUp );
        window.addEventListener( 'mousedown', handleWindowClick );

    };

    //

    return (
        <div className={ classNames( className, styles.keyInput, active ? styles.active : null ) } onClick={ handleClick }>{ value }</div>
    );

};
