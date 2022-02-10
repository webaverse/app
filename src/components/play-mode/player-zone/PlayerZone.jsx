
import React from 'react';
import classNames from 'classnames';

import metaversefile from 'metaversefile';

import styles from './player-zone.module.css';

//

export const PlayerZone = ({ username, loginInState, setLoginOpenPopupOpened }) => {

    const localPlayer = metaversefile.useLocalPlayer();

    //

    const handleLoginBtnClick = ( event ) => {

        setLoginOpenPopupOpened( true );

    };

    //

    return (
        <div className={ styles.playerZone } >

            {
                ( loginInState === 'in-progress' ) ?(
                    <div className={ styles.loginBtn }>Login in...</div>
                ) : (
                    ( loginInState === 'done' ) ? (
                        <div className={ styles.avatar } />
                    ) : (
                        <div className={ styles.loginBtn } onClick={ handleLoginBtnClick }>Login</div>
                    )
                )
            }

            <div className={ styles.username }>{ username }</div>

            <div className={ classNames( styles.progressBar, styles.manaBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

            <div className={ classNames( styles.progressBar, styles.healthBar ) } >
                <div className={ styles.progressBarFill } />
            </div>

        </div>
    );

};
