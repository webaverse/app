
import React from 'react';
import classNames from 'classnames';

import { Switch } from './switch';

import styles from './settings.module.css';

//

export const TabGraphics = ({ active }) => {

    return (
        <div className={ classNames( styles.tabContent, active ? styles.active : null ) }>
            <div className={ styles.blockTitle }>Display</div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Resolution</div>
                <Switch className={ styles.switch } value="HIGH" values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Antialias</div>
                <Switch className={ styles.switch } value="MSAA" values={ [ 'MSAA', 'FXAA', 'NONE' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>View range</div>
                <Switch className={ styles.switch } value="HIGH" values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Shadows quality</div>
                <Switch className={ styles.switch } value="HIGH" values={ [ 'HIGH', 'MEDIUM', 'LOW', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Postprocessing</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Enabled</div>
                <Switch className={ styles.switch } value="ON" values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Depth of field</div>
                <Switch className={ styles.switch } value="ON" values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>HDR</div>
                <Switch className={ styles.switch } value="ON" values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Bloom</div>
                <Switch className={ styles.switch } value="ON" values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.blockTitle }>Character</div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Character details</div>
                <Switch className={ styles.switch } value="HIGH" values={ [ 'HIGH', 'MEDIUM', 'LOW' ] } />
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.row }>
                <div className={ styles.paramName }>Hair physics</div>
                <Switch className={ styles.switch } value="ON" values={ [ 'ON', 'OFF' ] } />
                <div className={ styles.clearfix } />
            </div>
        </div>
    );

};
