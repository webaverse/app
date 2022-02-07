
import classNames from 'classnames';
import React from 'react';

import styles from './login-popup.module.css';

//

export const LoginPopup = ({ open, setOpen }) => {

    const handleCloseBtnClick = ( event ) => {

        event.stopPropagation();
        setOpen( false );

    };

    //

    return (
        <div className={ classNames( styles.loginPopupWrapper, open ? styles.opened : null ) }>
            <div className={ styles.loginPopupContent }>
                <div className={ styles.item }>Login via MetaMask</div>
                <div className={ styles.item }>Login via Discord</div>
                <div className={ styles.closeBtn } onClick={ handleCloseBtnClick }>X</div>
            </div>
        </div>
    );

};
