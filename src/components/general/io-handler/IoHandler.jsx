
import React, { useEffect } from 'react'

import ioManager from '../../../../io-manager.js';

//

const types = [ 'keydown', 'keypress', 'keyup', 'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'wheel', 'paste' ];
const ioEventHandlers = {};

for ( const type of types.concat(['']) ) {

    ioEventHandlers[ type ] = [];

}

function registerIoEventHandler ( type, fn ) {

    ioEventHandlers[ type ].push( fn );

};

function unregisterIoEventHandler ( type, fn ) {

    const hs = ioEventHandlers[ type ];
    const index = hs.indexOf( fn );

    if ( index !== -1 ) {

        hs.splice( index, 1 );

    }

};

//

function IoHandler () {

    useEffect( () => {

        const cleanups = types.map( ( type ) => {

            const fn = ( event ) => {

                let broke = false;

                // type

                for ( let i = 0; i < ioEventHandlers[ type ].length; i ++ ) {

                    const result = ioEventHandlers[ type ][ i ]( event );

                    if ( result === false ) {

                        broke = true;
                        break;

                    }

                }

                // all

                if ( ! broke ) {

                    const type = '';

                    for ( let i = 0; i < ioEventHandlers[ type ].length; i ++ ) {

                        const result = ioEventHandlers[ type ][ i ]( event );

                        if ( result === false ) {

                            broke = true;
                            break;

                        }

                    }

                }

                // default

                if ( ! broke ) {

                    ioManager[ type ]( event );

                } else if ( event.cancelable ) {

                    event.stopPropagation();
                    event.preventDefault();

                }

            };

            window.addEventListener( type, fn, { passive: type === 'wheel' });

            return () => {

                window.removeEventListener( type, fn );

            };

        });

        return () => {

            for ( const fn of cleanups ) {

                fn();

            }

        };

    }, [] );

    //

    return (
        <></>
    );

};

export {
    IoHandler,
    registerIoEventHandler,
    unregisterIoEventHandler
};
