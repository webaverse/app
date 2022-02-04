
import React from 'react';

import styles from './action-menu.module.css';

//

export const ActionMenu = ({ openSettings }) => {

    const handleSettingsBtn = ( event ) => {

        event.stopPropagation();
        openSettings( true );

    };

    //

    return (
        <div className={ styles.actionMenu } >

            <div className={ styles.btn } onClick={ handleSettingsBtn } />
            <div className={ styles.btn } />
            <div className={ styles.btn } />

        </div>
    );

};
