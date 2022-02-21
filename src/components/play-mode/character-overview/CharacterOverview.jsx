
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';

import metaversefile from 'metaversefile';
import { ItemInfo } from './item-info';

import styles from './character-overview.module.css';

//

export const CharacterOverview = ({ opened, setOpened }) => {

    const canvas = useRef( null );
    const [ itemDetailsOpened, setItemDetailsOpened ] = useState( false );
    const localPlayer = metaversefile.useLocalPlayer();

    const getItems = () => {

        const items = localPlayer.getActionsArray().filter( action => action.type === 'wear' );

        for ( let i = items.length; i < 15; i ++ ) {

            items.push( null );

        }

        return items;

    };

    const [ items, setItems ] = useState( [] );

    //

    const handleStopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleCloseBtnClick = () => {

        setOpened( false );

    };

    const handleSlotClick = ( item ) => {

        setItemDetailsOpened( true );

    };

    //

    useEffect( () => {

        setItems( getItems() );

        const handleKeyPress = ( event ) => {

            event.preventDefault();
            event.stopPropagation();

            if ( opened && event.key === 'Escape' ) {

                setOpened( false );

            }

            if ( opened === false && event.which === 73 ) {

                setOpened( true );

            }

        };

        window.addEventListener( 'keydown', handleKeyPress );

        //

        return () => {

            window.removeEventListener( 'keydown', handleKeyPress );

        };

    }, [ opened ] );

    //

    return (
        <div className={ classnames( styles.characterOverview, opened ? styles.open : null ) } onClick={ handleStopPropagation } >
            <div className={ classnames( styles.characterItems, ! itemDetailsOpened ? styles.opened : null ) } >
                <div className={ styles.header } >
                    ITEMS
                </div>
                <div className={ styles.contentWrapper } >
                    <div className={ styles.content } >
                        {
                            items.map( ( item, i ) => (
                                <div className={ styles.slot } key={ `slot-${ i }` } onClick={ handleSlotClick.bind( this, item ) } />
                            ))
                        }
                    </div>
                </div>
            </div>
            <ItemInfo opened={ itemDetailsOpened } setOpened={ setItemDetailsOpened } />
            <div className={ styles.characterBlock } >
                <canvas className={ styles.characterBlockCanvas } ref={ canvas } />
            </div>
            <div className={ styles.backBtn } onClick={ handleCloseBtnClick } >
                <div className={ styles.icon } />
                <div className={ styles.label } >BACK</div>
            </div>
        </div>
    );

};
