
import React, { useEffect, useState, useRef } from 'react';
import classNames from 'classnames';

import styles from './chat.module.css';

//

export const Chat = () => {

    const [ chatOpened, setChatOpened ] = useState( false );
    const chatInput = useRef( null );

    //

    const handleChatBtnClick = ( event ) => {

        event.stopPropagation();

    };

    const sendMessage = () => {

        // todo

    };

    const keyPressHandler = ( event ) => {

        switch ( event.which ) {

            case 13: { // 'enter'

                if ( ! chatOpened ) {

                    setChatOpened( true );
                    chatInput.current.focus();

                } else {

                    setChatOpened( false );
                    sendMessage();

                }

                break;

            };

        }

    };

    useEffect( () => {

        window.addEventListener( 'keypress', keyPressHandler );

        return () => {

            window.removeEventListener( 'keypress', keyPressHandler );

        };

    }, [ chatOpened ] );

    //

    return (
        <div className={ classNames( styles.chat, chatOpened ? styles.open : null ) }>
            <div className={ styles.header } onClick={ handleChatBtnClick }>
                <div className={ styles.icon } />
                World chat
            </div>
            <input className={ styles.chatInput } ref={ chatInput } />
        </div>
    );

};
