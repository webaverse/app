
import React, { useState } from 'react';

import { CharacterOverview } from './character-overview';
import { Settings } from './settings';
import { ActionMenu } from './action-menu';
import { LocationMenu } from './location-menu';
import { Inventory } from './inventory';
import { Hotbar } from './hotbar';
import { PlayerZone } from './player-zone';
import { Chat } from './chat/Chat';

import styles from './play-mode.module.css';

//

export const PlayMode = ({ setLoginOpenPopupOpened, loginInState, username }) => {

    const [ characterOverviewOpen, setCharacterOverviewOpen ] = useState( false );
    const [ settingsOpen, setSettingsOpen ] = useState( false );

    //

    return (
        <div className={ styles.playMode }>
            <CharacterOverview open={ characterOverviewOpen } setOpen={ setCharacterOverviewOpen } />
            <Settings open={ settingsOpen } setOpen={ setSettingsOpen } />
            <ActionMenu openSettings={ setSettingsOpen } />
            <LocationMenu />
            <Inventory openCharacterOverview={ setCharacterOverviewOpen } />
            <Hotbar />
            <PlayerZone username={ username } setLoginOpenPopupOpened={ setLoginOpenPopupOpened } loginInState={ loginInState } />
            <Chat />
        </div>
    );

};
