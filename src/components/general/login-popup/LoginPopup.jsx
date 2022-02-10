
import classNames from 'classnames';
import React from 'react';
import * as ceramicApi from '../../../../ceramic.js';

import { discordClientId } from '../../../../constants';

import styles from './login-popup.module.css';

//

export const LoginPopup = ({ open, setOpen, loginInState, setLoginInState, setAddress }) => {

    const handleCloseBtnClick = ( event ) => {

        event.stopPropagation();
        setOpen( false );

    };

    const handleMetaMaskBtnClick = async () => {

        if ( ! loginInState ) {

            setLoginInState( 'in-progress' );

            try {

                const { address, profile } = await ceramicApi.login();
                setAddress( address );
                // setLoginFrom('metamask');

            } catch ( err ) {

                console.warn( err );

            } finally {

                setLoginInState( 'done' );

            }

        }

    };

    //

    return (
        <div className={ classNames( styles.loginPopupWrapper, open ? styles.opened : null ) }>
            <div className={ styles.loginPopupContent }>
                <div className={ styles.item } onClick={ handleMetaMaskBtnClick }>Login via MetaMask</div>
                <a className={ styles.item } href={`https://discord.com/api/oauth2/authorize?client_id=${ discordClientId }&redirect_uri=${ window.location.origin }%2Flogin&response_type=code&scope=identify`}>Login via Discord</a>
                <div className={ styles.closeBtn } onClick={ handleCloseBtnClick }>X</div>
            </div>
        </div>
    );

};
