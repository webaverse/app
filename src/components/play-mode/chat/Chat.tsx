
import React from 'react';

import styles from './chat.module.css';

//

export const Chat = () => {

    const handleChatBtnClick = ( event ) => {

        event.stopPropagation();

    };

    //

    return (
        <div className={ styles.chat } >
            <div className={ styles.chatBtn } onClick={ handleChatBtnClick }>Chat</div>
        </div>
    );

};
