import React, {useState, useContext, useRef, useEffect} from 'react';
import classnames from 'classnames';
import { AppContext } from '../../app';
import styles from './hotbar.module.css';
import {HotBox} from '../hotbox/HotBox.jsx';
import {hotbarSize} from '../../../../constants.js';

export const Hotbar = () => {

    const itemsNum = 8;

    const { state, setState } = useContext( AppContext );
    const open =  state.openedPanel === 'CharacterPanel';

    return (
        <div className={ classnames(styles.hotbar, open ? styles.open : null) } >

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
