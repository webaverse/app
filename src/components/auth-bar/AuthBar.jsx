
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import { discordClientId } from '../../../constants';

import { AppContext } from '../app';

import styles from './auth-bar.module.css';

//

export const AuthBar = () => {

    const { address, setAddress, authManager, authInProcess, state, setState } = useContext( AppContext );
    const [ ensName, setEnsName ] = useState('');
    const [ avatarUrl, setAvatarUrl ] = useState('');

    //

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleLogoutBtnClick = () => {

        authManager.logout();
        setAddress( null );
        setEnsName( null );
        setAvatarUrl( null );

    };

    const handleLoginLabelBtnClick = () => {

        if ( state.openedPanel !== 'LoginPanel' ) {

            setState({ openedPanel: 'LoginPanel' });

        } else {

            setState({ openedPanel: null });

        }

    };

    const handleCancelBtnClick = () => {

        setState({ openedPanel: null });

    };

    const openUserPanel = e => {

        setState({ openedPanel: 'UserPanel' });

    };

    const handleMaskLoginBtnClick = async () => {

        await authManager.authenticate();
        setState({ openedPanel: null });

    };

    //

    useEffect( async () => {

        if ( address ) {

            const ensName = await authManager.getEnsName( address );
            setEnsName( ensName );

            if ( ensName ) {
                const avatarUrl = await authManager.getAvatarUrl( ensName );
                setAvatarUrl( avatarUrl );
            }

        }

    }, [ address ] );

    //

    return (
        <div className={ classnames( styles.authBar, state.openedPanel === 'LoginPanel' ? styles.open : null ) } onClick={ stopPropagation } >

            <div className={ classnames( styles.loggingInPlaceholder, authInProcess ? styles.active : null ) }>Logging in</div>

            <div className={ classnames( styles.keyWrap, ( address === null && ! authInProcess ) ? styles.active : null ) } onClick={ handleLoginLabelBtnClick } >
                <div className={ styles.key } >
                    <div className={ styles.bow } >
                        <img className={ styles.icon } src="./images/log-in.svg" />
                    </div>
                    <div className={ styles.blade } >
                        <div className={ styles.background } />
                        <div className={ styles.text } >ログイン Log in</div>
                    </div>
                </div>
            </div>

            <div className={ classnames( styles.userWrap, ( address && ! authInProcess ) ? styles.active : null ) }>
                <div className={ styles.userBar } >
                    {
                        avatarUrl ? (
                            <div className={ styles.avatarUrl } onClick={ openUserPanel } >
                                <img className={ styles.img } src={ avatarUrl } crossOrigin='Anonymous' />
                            </div>
                        ) : null
                    }
                    <div className={ styles.address } onClick={openUserPanel} >
                        { ensName || address || '' } <img className={ styles.verifiedIcon } src="./images/verified.svg" />
                    </div>
                </div>
                <div className={ styles.logoutBtn } onClick={ handleLogoutBtnClick } >Logout</div>
            </div>

            <div className={ classnames( styles.userLoginMethodsModal, ( state.openedPanel === 'LoginPanel' ? styles.opened : null ) ) } >
                <div className={ styles.title } >
                    <span>Log in</span>
                    <div className={ styles.background } />
                </div>
                <div className={ styles.methodBtn } onClick={ handleMaskLoginBtnClick } >
                    <img src="images/metamask.png" alt="metamask" width="28px" />
                    <span className={ styles.methodBtnText } >MetaMask</span>
                </div>
                <a href={ `https://discord.com/api/oauth2/authorize?client_id=${ discordClientId }&redirect_uri=${ window.location.origin }%2Flogin&response_type=code&scope=identify` } >
                    <div className={ styles.methodBtn } >
                        <img src="images/discord.png" alt="discord" width="28px" />
                        <span className={ styles.methodBtnText } >Discord</span>
                    </div>
                </a>
                <div className={ styles.methodBtn } onClick={ handleCancelBtnClick } >
                    <span className={ styles.methodBtnText } >Cancel</span>
                </div>
            </div>

        </div>
    );

};
