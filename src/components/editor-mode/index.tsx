
import React from 'react';

import { SceneSelect } from './scene-select/SceneSelect';
import { WorldObjectsList } from './world-objects-list';

//

export const EditorMode = ({ app, selectedScene, setSelectedScene, selectedRoom, setSelectedRoom }) => {

    const multiplayerConnected = !! selectedRoom;

    //

    return (
        <div>
            <SceneSelect multiplayerConnected={ multiplayerConnected } selectedScene={ selectedScene } setSelectedScene={ setSelectedScene } selectedRoom={ selectedRoom } setSelectedRoom={ setSelectedRoom } />
            <WorldObjectsList app={ app } />
        </div>
    );

};
