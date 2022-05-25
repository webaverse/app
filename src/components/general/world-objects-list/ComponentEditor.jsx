
import classNames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';

import { AppContext } from '../../app';

import styles from './component-editor.module.css';

const PROTECTED_PROPS = ['contentId', 'instanceId']

export const ComponentEditor = () => {

    const { selectedApp } = useContext( AppContext );
    const [ components, setComponents ] = useState( [] );
    const [ editComponentKey, setEditComponentKey ] = useState( null );
    const [ editComponentKeyNewValue, setEditComponentKeyNewValue ] = useState( null );

    //

    const syncComponentsList = () => {

        const newComponents = [];

        selectedApp.components.forEach( ( component ) => {

            let type = 'json';

            if ( typeof component.value === 'string' ) type = 'string';
            if ( typeof component.value === 'number' ) type = 'number';
            if ( typeof component.value === 'boolean' ) type = 'bool';

            newComponents.push({ key: component.key, value: ( type === 'json' ? JSON.stringify( component.value ) : component.value ), type: component.type ?? type, _componentEditorError: component._componentEditorError });

        });

        setComponents( newComponents );

    };

    const cleanUp = () => {
        selectedApp.components.forEach( ( component ) => {
            delete component._componentEditorError;
        });
    }

    const validateValues = () => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            const value = components[ i ].value;
            selectedApp.components[ i ]._componentEditorError = false;

            switch(components[i].type) {
                case 'number':
                    
                    const parsedValue = parseFloat( components[ i ].value );

                    if ( isNaN(parsedValue) )  {
                        components[ i ]._componentEditorError = true;
                        continue;
                    }
                    
                    selectedApp.components[ i ].value = value;

                break;
                case 'bool':

                    selectedApp.components[ i ].value = value;

                break;
                case 'json':

                    try {
                        selectedApp.components[ i ].value = JSON.parse( value );
                    } catch ( err ) {
                        selectedApp.components[ i ].value = value;
                        selectedApp.components[ i ]._componentEditorError = true;
                    }

                break;
                default: 
                    selectedApp.components[ i ].value = value.toString();
                break;
            }

        }

    };

    //

    const handleAddNewBtnClick = () => {

        selectedApp.components.push({ key: `New item ${selectedApp.components.length}`, value: '', type: 'string' });
        // components.push({ key: 'New item', value: '', type: 'string', error: false });

        syncComponentsList();

    };

    const handleRemoveItemBtnClick = ( key ) => {

        const newList = [];

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key === key ) continue;
            newList.push( selectedApp.components[ i ] );

        }

        selectedApp.components = newList;
        syncComponentsList();

    };

    const handleEditItemBtnClick = ( key ) => {

        setEditComponentKey( key );
        setEditComponentKeyNewValue( key );

    };

    const handleValueInputChange = ( key, event ) => {

        const value = event.target.value;

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key !== key ) continue;
            components[ i ].value = value;
            break;

        }

        validateValues();
        syncComponentsList();

    };

    const handleCheckboxChange = ( key, value ) => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( selectedApp.components[ i ].key !== key ) continue;
            components[ i ].value = value;
            break;

        }

        validateValues();
        syncComponentsList();

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

    const handleTypeSelectChange = ( key, event ) => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( key !== selectedApp.components[ i ].key ) continue;
            selectedApp.components[ i ].type = event.target.value;
            break;

        }

        validateValues();
        syncComponentsList();

    };

    const handleApplyItemKeyBtnClick = () => {

        for ( let i = 0; i < selectedApp.components.length; i ++ ) {

            if ( editComponentKey === selectedApp.components[ i ].key ) {

                selectedApp.components[ i ].key = editComponentKeyNewValue;
                components[ i ].key = editComponentKeyNewValue;
                break;

            }

        }

        setEditComponentKey( null );
        syncComponentsList();

    };

    //

    useEffect( () => {

        syncComponentsList();

        return () => {
            // cleanup the object being edited when the app is switched
            cleanUp();
        }

    }, [ selectedApp ] );

    useEffect(()=>{
        return ()=>{
            // cleanup the object being edited when the editior is closed
            cleanUp();
        }
    },[]);

    //

    return (
        <div className={ styles.componentsEditor }>
            <div className={ styles.title }>Components ({ selectedApp.components.length })</div>
            {
                components.map( component => {
  
                    const isEditable = !PROTECTED_PROPS.includes(component.key);

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
                            {
                                {
                                    'number': <input type="number" className={ classNames( styles.itemValue, ( isEditable && component._componentEditorError ? styles.valueError : null ) ) } disabled={ ! isEditable }  value={ component.value } onChange={ handleValueInputChange.bind( this, component.key ) } />,
                                    'bool': <input type="checkbox" defaultChecked={!!component.value} className={ classNames( styles.itemValue, ( isEditable && component._componentEditorError ? styles.valueError : null ) ) } disabled={ ! isEditable } onChange={ (e)=>handleCheckboxChange(component.key, e.target.checked ? true : false) } />,
                                    'string': <input type="text" className={ classNames( styles.itemValue, ( isEditable && component._componentEditorError ? styles.valueError : null ) ) } disabled={ ! isEditable }  value={ component.value } onChange={ handleValueInputChange.bind( this, component.key ) } />,
                                    'json': <input type="text" className={ classNames( styles.itemValue, ( isEditable && component._componentEditorError ? styles.valueError : null ) ) } disabled={ ! isEditable }  value={ component.value } onChange={ handleValueInputChange.bind( this, component.key ) } />
                                }[component.type]
                            }       
                            {
                                isEditable ? (
                                    <select className={ styles.itemType } value={ component.type } onChange={ handleTypeSelectChange.bind( this, component.key ) } >
                                        <option value='string' >string</option>
                                        <option value='number' >number</option>
                                        <option value='bool' >bool</option>
                                        <option value='json' >json</option>
                                    </select>
                                ) : null
                            }
                            <div className={ styles.clearfix } />
                        </div>
                    );

                })
            }
            <div className={ styles.addNewItem } onClick={ handleAddNewBtnClick } >Add new</div>
        </div>
    );

};
