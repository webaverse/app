
import classNames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';

import { AppContext } from '../../app';

import styles from './component-editor.module.css';

//

export const ComponentEditor = () => {

    const { selectedApp } = useContext( AppContext );
    const [ components, setComponents ] = useState( [] );
    const [ editComponentKey, setEditComponentKey ] = useState( null );
    const [ editComponentKeyNewValue, setEditComponentKeyNewValue ] = useState( null );

    //

    const update = () => {

        const newComponents = [];

        selectedApp.components.forEach( ( component ) => {

            newComponents.push( component );

        });

        setComponents( newComponents );

    };

    const handleAddNewBtnClick = () => {

        selectedApp.components.push({ key: 'New item', value: '' });
        update();

    };

    const handleRemoveItemBtnClick = ( key ) => {

        const newList = [];

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key === key ) continue;
            newList.push( selectedApp.components[ i ] );

        }

        selectedApp.components = newList;
        update();

    };

    const handleEditItemBtnClick = ( key ) => {

        setEditComponentKey( key );
        setEditComponentKeyNewValue( key );

    };

    const handleValueInputChange = ( key, event ) => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key === key ) {

                selectedApp.components[ i ].value = event.target.value;

            }

        }

        update();

    };

    const handleKeyInputKeyUp = ( key, event ) => {

        if ( event.key === 'Enter' ) {

            event.preventDefault();
            event.stopPropagation();
            handleApplyItemKeyBtnClick( key );
            event.target.blur();

        }

    };

    const handleKeyInputChange = ( event ) => {

        setEditComponentKeyNewValue( event.target.value );

    };

    const handleApplyItemKeyBtnClick = ( key, event ) => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( editComponentKey === selectedApp.components[ i ].key ) {

                selectedApp.components[ i ].key = editComponentKeyNewValue;
                break;

            }

        }

        setEditComponentKey( null );
        update();

    };

    //

    useEffect( () => {

        update();

    }, [ selectedApp ] );

    //

    return (
        <div className={ styles.componentsEditor }>
            <div className={ styles.title }>Components ({ selectedApp.components.length })</div>
            {
                components.map( component => {

                    const isEditable = ( component.key !== 'instanceId' && component.key !== 'contentId' );

                    return (
                        <div className={ classNames( styles.item, ( ! isEditable ? styles.disabled : null ) ) } key={ component.key } >
                            <img src="./images/ui/lock.svg" className={ styles.lock } />
                            <div className={ styles.itemRemove } onClick={ isEditable ? handleRemoveItemBtnClick.bind( this, component.key ) : null } >x</div>
                            {
                                editComponentKey === component.key ? (
                                    <>
                                        <img src="./images/ui/check.svg" className={ styles.itemApply } onClick={ handleApplyItemKeyBtnClick.bind( this, component.key ) } />
                                        <input className={ styles.itemKey } value={ editComponentKeyNewValue } onChange={ handleKeyInputChange } type="text" onKeyUp={ handleKeyInputKeyUp.bind( this, component.key ) } />
                                    </>
                                ) : (
                                    <>
                                        <img src="./images/ui/edit.svg" className={ styles.itemEdit } onClick={ handleEditItemBtnClick.bind( this, component.key ) } />
                                        <div className={ styles.itemTitle } >{ component.key }</div>
                                    </>
                                )
                            }
                            <input className={ styles.itemValue } disabled={ ! isEditable } type="text" value={ component.value } onChange={ handleValueInputChange.bind( this, component.key ) } />
                            <div className={ styles.clearfix } />
                        </div>
                    );

                })
            }
            <div className={ styles.addNewItem } onClick={ handleAddNewBtnClick } >Add new</div>
        </div>
    );

};
