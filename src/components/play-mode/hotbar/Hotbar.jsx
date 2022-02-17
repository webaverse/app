
import React from 'react';

import styles from './hotbar.module.css';

//

export const Hotbar = () => {

    const itemsNum = 8;

    return (
        <div className={ styles.hotbar } >

            {
                ( () => {

                    const items = Array( itemsNum );

                    for ( let i = 0; i < itemsNum; i ++ ) {

                        items[ i ] = (
                            <div className={ styles.item } key={ i } >
                                <div className={ styles.box } />
                                <div className={ styles.label }>{ i + 1 }</div>
                            </div>
                        );

                    }

                    return items;

                })()
            }

        </div>
    );

};
