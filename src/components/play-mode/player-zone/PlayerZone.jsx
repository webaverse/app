
import classNames from 'classnames';
import React from 'react';

import styles from './player-zone.module.css';

//

export const PlayerZone = () => {

    return (
        <div className={ styles.playerZone } >

            <div className={ styles.avatar } />
            <div className={ classNames( styles.progressBar, styles.manaBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <div className={ classNames( styles.progressBar, styles.healthBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

        </div>
    );

};
