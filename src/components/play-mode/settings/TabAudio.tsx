
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { Slider } from './slider';

import styles from './settings.module.css';

//

export const TabAudio = ({ active }) => {

    return (
        <div className={ classNames( styles.audioTab, styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.row }>
                <div className={ styles.paramName }>General volume</div>
                <Slider className={ styles.slider } initalValue={ 50 } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Music volume</div>
                <Slider className={ styles.slider } initalValue={ 50 } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Voice volume</div>
                <Slider className={ styles.slider } initalValue={ 50 } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Effects volume</div>
                <Slider className={ styles.slider } initalValue={ 50 } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
