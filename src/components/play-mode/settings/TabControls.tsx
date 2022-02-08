
import React from 'react';
import classNames from 'classnames';

import styles from './settings.module.css';

//

export const TabControls = ({ active }) => {

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            Controls
        </div>
    );

};
