
import React from 'react';

import styles from './health-bar.module.css';

//

export const HealthBar = () => {

    const maxHealh = 100;
    const currentHealth = 50;

    return (
        <div className={ styles.heathBarWrapper } >
            <div className={ styles.healthBarTitle } >HP</div>
            <div className={ styles.healthProgressWrapper } >
                <div className={ styles.progress } style={{ width: Math.floor( 100 * currentHealth / maxHealh ) + '%' }} />
            </div>
            <div className={ styles.healthValueText } >{ currentHealth } / { maxHealh }</div>
        </div>
    );

};
