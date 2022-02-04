
import React, { useEffect } from 'react';
import classnames from 'classnames';

import styles from './character-overview.module.css';

//

export const CharacterOverview = ({ open, setOpen }) => {

    useEffect( () => {

        const handleKeyPress = ( event ) => {

            if ( open && event.key === 'Escape' ) {

                setOpen( false );

            }

            if ( open === false && event.which === 73 ) {

                setOpen( true );

            }

        };

        window.addEventListener( 'keydown', handleKeyPress );

        return () => {

            window.removeEventListener( 'keydown', handleKeyPress );

        };

    }, [ open ] );

    //

    return (
        <div className={ classnames( styles.characterOverview, open ? styles.open : null ) } />
    );

};
