
import React from 'react';

import styles from './player-zone.module.css';

//

export const PlayerZone = () => {

    return (
        <div className={ styles.playerZone } >

            <div className={ styles.avatar } />
            <div className={ styles.healthBar } >
                <div className={ styles.healthBarFill } />
            </div>

        </div>
    );

};
