
import React from 'react';

import styles from './inventory.module.css';

//

export const Inventory = ({ openCharacterOverview }) => {

    const handleInventoryBtn = ( event ) => {

        event.stopPropagation();
        openCharacterOverview( true );

    };

    //

    return (
        <div className={ styles.inventory } >

            <div className={ styles.inventoryBtn } onClick={ handleInventoryBtn } >Inventory ['i' btn]</div>

            <div className={ styles.weapon } >
                <div className={ styles.weaponStats } >99</div>
            </div>

        </div>
    );

};
