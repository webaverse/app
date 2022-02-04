
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import styles from './settings.module.css';

//

export const TabGeneral = ({ active }) => {

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            General
        </div>
    );

};
