
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import {world2canvas} from './ThreeUtils.js';
import {world} from '../world.js';
import game from '../game.js';

import { AppContext } from './components/app';

import styles from './Inspector.module.css';

//

export const Inspector = ({ selectedApp, dragging }) => {

    const { state, setState } = useContext( AppContext );
    const [hoverPosition, setHoverPosition] = useState(null);
    const [selectPosition, setSelectPosition] = useState(null);
    const [epoch, setEpoch] = useState(0);

    //

    useEffect(() => {

        const hoverchange = ( event ) => {

            const worldOpen = state.openedPanel === 'WorldPanel';

            if ( worldOpen && ! selectedApp && ! dragging ) {

                const {position} = event.data;

                if (position) {

                    const worldPoint = world2canvas(position);
                    setHoverPosition(worldPoint);

                } else {

                    setHoverPosition(null);

                }

            } else {

                setHoverPosition(null);

            }

        };

        world.appManager.addEventListener('hoverchange', hoverchange);

        return () => {

            world.appManager.removeEventListener('hoverchange', hoverchange);

        };

    }, [ state.openedPanel, selectedApp, dragging, hoverPosition ] );

    useEffect(() => {

        const dragchange = e => {

            setHoverPosition(null);

        };

        world.appManager.addEventListener('dragchange', dragchange);

        return () => {

            world.appManager.removeEventListener('dragchange', dragchange);

        };

    }, [ dragging ] );

    useEffect(() => {

        const worldOpen = state.openedPanel === 'WorldPanel';
        game.setHoverEnabled(worldOpen);

        if ( ! worldOpen ) {

            game.setMouseSelectedObject(null);

        }

    }, [ state.openedPanel ] );

    let localEpoch = epoch;

    useEffect(() => {

        const frame = ( event ) => {

            if ( selectedApp ) {

                const position = game.getMouseSelectedPosition();

                if ( position ) {

                    const worldPoint = world2canvas( position, selectPosition );

                    if ( worldPoint.z > 0 ) {

                        setSelectPosition( worldPoint );
                        setEpoch( ++ localEpoch );

                    } else {

                        setSelectPosition(null);

                    }

                } else {

                    setSelectPosition(null);

                }

            } else {

                setSelectPosition(null);

            }

        };

        world.appManager.addEventListener('frame', frame);

        return () => {

            world.appManager.removeEventListener('frame', frame);

        };

    }, [ selectedApp, selectPosition ] );

    const bindPosition = selectPosition || hoverPosition || null;

    //

    return (
        <div className={ classnames( styles.inspector, bindPosition ? styles.open : null ) } style={ bindPosition ? {
            transform: `translateX(${bindPosition.x*100}vw) translateY(${bindPosition.y*100}vh)`,
        } : null}>
            <img src="/images/popup.svg" style={bindPosition ? {
                transform: `scale(${bindPosition.z})`,
                transformOrigin: '0 100%',
            } : null} />
        </div>
    );

};
