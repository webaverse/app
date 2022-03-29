import React, {useState, useContext, useRef, useEffect} from 'react';
import classnames from 'classnames';
import { AppContext } from '../../app';
import styles from './hotbar.module.css';
import {HotBox} from '../hotbox/HotBox.jsx';
import game from '../../../../game.js';
import {hotbarSize} from '../../../../constants.js';

const itemsNum = 8;

export const Hotbar = () => {
    const { state, setState } = useContext( AppContext );
    const open =  state.openedPanel === 'CharacterPanel';

    const onDragOver = index => e => {
        e.preventDefault();
    };
    const onDrop = index => e => {
        e.preventDefault();
        e.stopPropagation();
        
        game.handleDropJsonItemToPlayer(e.dataTransfer.items[0], index);
    };
    const onTopClick = e => {
        e.preventDefault();
        e.stopPropagation();

        setState({
            openedPanel: 'CharacterPanel',
        });
    };
    const onBottomClick = index => e => {
       // e.preventDefault();
    };

    return (
        <div
            className={ classnames(styles.hotbar, open ? styles.open : null) }
            onClick={onTopClick}
        >

            {
                ( () => {

                    const items = Array( itemsNum );

                    for ( let i = 0; i < itemsNum; i ++ ) {

                        items[ i ] = (
                            <HotBox
                              size={hotbarSize}
                              onDragOver={onDragOver(i)}
                              onDrop={onDrop(i)}
                              onClick={onBottomClick}
                              index={i}
                              key={i}
                            />
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
