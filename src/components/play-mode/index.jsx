
import React from 'react';

import { Minimap } from './minimap';
import { Hotbar } from './hotbar';
import { Infobox } from './infobox';

import styles from './play-mode.module.css';

//

export const PlayMode = () => {

    //

    return (
        <div className={ styles.playMode }>
            <Minimap />
            <Hotbar />
            <Infobox />
        </div>
    );

};
