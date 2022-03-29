import React, {useState, useContext, useRef, useEffect} from 'react';
import classnames from 'classnames';
import { AppContext } from '../../app';
import styles from './hotbar.module.css';
import {HotBox} from '../hotbox/HotBox.jsx';
import {hotbarSize} from '../../../../constants.js';
import {jsonParse} from '../../../../util.js';

export const Hotbar = () => {

    const itemsNum = 8;

    const { state, setState } = useContext( AppContext );
    const open =  state.openedPanel === 'CharacterPanel';

    function onDragOver(e) {
        e.preventDefault();
    }
    function onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const s = e.dataTransfer.getData('application/json');
        const j = jsonParse(s);
        console.log('got drop', e.dataTransfer, j);
    }

    return (
        <div
            className={ classnames(styles.hotbar, open ? styles.open : null) }
            onDragOver={onDragOver}
            onDrop={onDrop}
        >

            {
                ( () => {

                    const items = Array( itemsNum );

                    for ( let i = 0; i < itemsNum; i ++ ) {

                        items[ i ] = (
                            <HotBox size={hotbarSize} index={i} key={i} />
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
