
import React from 'react';
import classNames from 'classnames';

import styles from './settings.module.css';

//

export const TabGraphics = ({ active }) => {

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>Display</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Resolution</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Antialias</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Postprocessing</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Enabled</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Depth of field</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>HDR</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Bloom</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Character</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Character details</div>
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Hair physics</div>
            </div>
        </div>
    );

};
