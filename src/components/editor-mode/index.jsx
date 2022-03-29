
import React from 'react';

import { SceneMenu } from './scene-menu';

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
        </div>
    );

};
