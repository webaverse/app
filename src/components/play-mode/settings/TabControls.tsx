
import React from 'react';
import classNames from 'classnames';

import { KeyInput } from './key-input';

import styles from './settings.module.css';

//

export const TabControls = ({ active }) => {

    return (
        <div className={ classNames( styles.controlsTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move forward</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'W' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move left</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'A' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move right</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'D' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Move back</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'S' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Jump</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SPACE' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Run</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SHIFT+W' } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Naruto run</div>
                <KeyInput className={ styles.keyInput } initalValue={ 'SHIFT+W+W' } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
