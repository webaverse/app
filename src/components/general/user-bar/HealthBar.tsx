
import React from 'react';

import styles from './health-bar.module.css';

//

export const HealthBar = () => {

    const maxHealth = 100;
    const currentHealth = 100;

    const maxMana = 100;
    const currentMana = 30;

    const maxXP = 100;
    const currentXP = 70;

    //

    return (
        <div className={ styles.heathBarWrapper } >

            <div className={ styles.healthBarTitle } >HP</div>
            {/* <div className={ styles.healthBarValue } >{ currentHealth } / { maxHealth }</div> */}
            <div className={ styles.healthProgressWrapper } >
                <div className={ styles.progress } style={{ width: Math.floor( 100 * currentHealth / maxHealth ) + '%' }} />
            </div>

            <div className={ styles.manaBarTitle } >MN</div>
            {/* <div className={ styles.manaBarValue } >{ currentMana } / { maxMana }</div> */}
            <div className={ styles.manaProgressWrapper } >
                <div className={ styles.progress } style={{ width: Math.floor( 100 * currentMana / maxMana ) + '%' }} />
            </div>

            <div className={ styles.xpBarTitle } >XP</div>
            {/* <div className={ styles.xpBarValue } >{ currentXP } / { maxXP }</div> */}
            <div className={ styles.xpProgressWrapper } >
                <div className={ styles.progress } style={{ width: Math.floor( 100 * currentXP / maxXP ) + '%' }} />
            </div>

        </div>
    );

};
