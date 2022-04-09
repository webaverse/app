
import React from 'react';

import { MagicMenu } from './magic-menu';
import { SceneMenu } from './scene-menu';
import { Inspector } from './inspector';

//

export const EditorMode = ({ selectedScene, setSelectedScene, selectedRoom, setSelectedRoom }) => {

    const multiplayerConnected = !! selectedRoom;

    //

    return (
        <div>
            <SceneMenu
                multiplayerConnected={ multiplayerConnected }
                selectedScene={ selectedScene }
                setSelectedScene={ setSelectedScene }
                selectedRoom={ selectedRoom }
                setSelectedRoom={ setSelectedRoom }
            />
            <MagicMenu />
            <Inspector />
        </div>
    );

};
