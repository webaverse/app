
import React from 'react';

import styles from './hotbar.module.css';

//

export const Hotbar = () => {

    const hotKeys = [ 1, 2, 3, 4, 5, 6, 7, 8 ];

    return (
        <div className={ styles.hotbar } >

            {
                hotKeys.map( ( item ) => {
                    return (
                        <div className={ styles.item } key={ `item${ item }` }>
                            { item }
                        </div>
                    );
                })
            }

        </div>
    );

};
