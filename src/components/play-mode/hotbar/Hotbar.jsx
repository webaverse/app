import React, {useState, useRef, useEffect} from 'react';
import styles from './hotbar.module.css';
import {HotBox} from '../hotbox/HotBox.jsx';
import {hotbarSize} from '../../../../constants.js';

export const Hotbar = () => {

    const itemsNum = 8;

    return (
        <div className={ styles.hotbar } >

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
