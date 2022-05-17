
import React from 'react';

import { Minimap } from './minimap';
import { Hotbar } from './hotbar';
import { Infobox } from './infobox';
import { Chat } from './chat';
import { UIMode } from '../general/ui-mode';

import styles from './play-mode.module.css';

//

export const PlayMode = () => {

    //

    return (
        <div className={ styles.playMode }>
            <UIMode hideDirection='left'>
                <Minimap />
            </UIMode>
            <UIMode hideDirection='bottom'>
                <Hotbar />
            </UIMode>
            <UIMode hideDirection='right'>
                <Infobox />
            </UIMode>
            <Chat />
        </div>
    );

};
