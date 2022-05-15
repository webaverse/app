
import React, { useContext, useEffect, useState } from 'react';

import { AppContext } from '../../app';

import styles from './component-editor.module.css';

//

export const ComponentEditor = () => {

    const { selectedApp } = useContext( AppContext );
    const [ components, setComponents ] = useState([]);

    //

    const update = () => {

        const newComponents = [];

        selectedApp.components.forEach( ( component ) => {

            newComponents.push( component );

        });

        setComponents( newComponents );

    };

    const handleValueInputChange = ( key, event ) => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key === key ) {

                selectedApp.components[ i ].value = event.target.value;

            }

        }

        update();

    };

    useEffect( () => {

        update();

    }, [ selectedApp ] );

    //

    return (
        <div className={ styles.componentsEditor }>
            <div className={ styles.title }>Components ({ selectedApp.components.length })</div>
            {
                components.map( component => (
                    <div className={ styles.item } key={ component.key } >
                        <div className={ styles.itemTitle } >{ component.key }</div>
                        <input className={ styles.itemValue } type="text" value={ component.value } onChange={ handleValueInputChange.bind( this, component.key ) } />
                        <div className={ styles.clearfix } />
                    </div>
                ))
            }
        </div>
    );

};
