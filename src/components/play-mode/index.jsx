
import React from 'react';

import { Minimap } from './minimap';
import { Hotbar } from './hotbar';
import { Inventory } from './inventory';

import styles from './play-mode.module.css';
import { CharacterOverview } from './character-overview/CharacterOverview';

//

export const PlayMode = ({ characterOverviewOpened, setCharacterOverviewOpened }) => {

    //

    return (
        <div className={ styles.playMode }>
            <Minimap />
            <Hotbar />
            <Inventory />
            <CharacterOverview opened={ characterOverviewOpened } setOpened={ setCharacterOverviewOpened } />
        </div>
    );

};
