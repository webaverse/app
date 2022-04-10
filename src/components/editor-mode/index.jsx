
import React, { useEffect } from 'react';

import game from '../../../game';

import { MagicMenu } from './magic-menu';
import { SceneMenu } from './scene-menu';
import { Inspector } from './inspector';
import { registerIoEventHandler, unregisterIoEventHandler } from '../general/io-handler';

//

export const EditorMode = ({ selectedScene, setSelectedScene, selectedRoom, setSelectedRoom }) => {

    const multiplayerConnected = !! selectedRoom;

    //

    useEffect( () => {

        const handleKeyPress = ( event ) => {

            if ( game.inputFocused() ) return true;

            switch ( event.which ) {

                case 192: { // tilda '~' -> enable EditMode

                    game.toggleEditMode();
                    return false;

                }

                case 69: { // E -> rotate object

                    if ( game.canRotate() ) {

                        game.menuRotate( -1 );

                    } else {

                        game.menuActivateDown();

                    }

                    return false;

                }

                case 82: { // R -> rotate object

                    if ( game.canRotate() ) {

                        game.menuRotate( 1 );

                    } else {

                        game.dropSelectedApp();

                    }

                    return true;

                }

            }

            return true;

        };

        registerIoEventHandler( 'keyup', handleKeyPress );

        //

        return () => {

            unregisterIoEventHandler( 'keyup', handleKeyPress );

        };

    }, [] );

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
