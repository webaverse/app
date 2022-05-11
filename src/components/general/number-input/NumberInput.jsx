
import React, { useEffect, useState } from 'react';

import styles from './number-input.module.css';

//

export const NumberInput = ({ title = '', initalValue = 0, zeroValue = true, maxPrecision = 3, step = 0.1, onChange = null }) => {

    const [ value, setValue ] = useState( initalValue );
    const [ finalValue, setFinalValue ] = useState( initalValue );

    //

    useEffect( () => {

        setValue( prettifyNumber( initalValue ) );
        setFinalValue( prettifyNumber( initalValue ) );

    }, [ initalValue ] );

    useEffect( () => {

        apply( value, false );

    }, [ value ]);

    //

    const prettifyNumber = ( value ) => {

        return + parseFloat( parseFloat( value ?? 0 ).toFixed( maxPrecision ) );

    };

    const handleDecreaseBtnClick = () => {

        const newValue = value - step;
        setValue( prettifyNumber( newValue ) );

    };

    const handleIncreaseBtnClick = () => {

        const newValue = value + step;
        setValue( prettifyNumber( newValue ) );

    };

    const handleInputKeyUp = ( event ) => {

        if ( event.key === 'ArrowUp' ) {

            handleIncreaseBtnClick();
            return;

        }

        if ( event.key === 'ArrowDown' ) {

            handleDecreaseBtnClick();
            return;

        }

        if ( event.key === 'Enter' ) {

            event.preventDefault();
            event.stopPropagation();
            apply( event.target.value, true );
            event.target.blur();
            return;

        }

        setValue( event.target.value );

    };

    const handleInputOnChange = ( event ) => {

        const newValue = event.target.value;
        setValue( newValue );

    };

    const handleInputBlur = ( event ) => {

        apply( event.target.value, true );

    };

    const apply = ( newValue, format ) => {

        if ( format ) {

            newValue = parseFloat( newValue );
            if ( ! newValue ?? newValue !== 0 ) newValue = 0;
            setValue( newValue );

        }

        if ( value.toString() === parseFloat( newValue ).toString() ) {

            if ( ! zeroValue && newValue === 0 ) {

                newValue = 0.01;

            }

            newValue = prettifyNumber( newValue );
            setValue( newValue );
            setFinalValue( newValue );

            if ( onChange ) {

                onChange( newValue );

            }

        }

    };

    //

    return (
        <div className={ styles.inputWrapper } >
            <div className={ styles.inputTitle } >{ title }</div>
            <div className={ styles.arrowLeft } onClick={ handleDecreaseBtnClick } />
            <div className={ styles.arrowRight } onClick={ handleIncreaseBtnClick } />
            <input className={ styles.input } value={ value } onKeyUp={ handleInputKeyUp } onChange={ handleInputOnChange } onBlur={ handleInputBlur } />
        </div>
    );

};
