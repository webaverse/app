
import React, { useContext, cloneElement, Children } from 'react';
import classNames from 'classnames';

import { AppContext } from '../../app';

import styles from './ui-mode.module.css';

//

export const UIMode = ({ hideDirection = 'left', children }) => {

    const { uiMode } = useContext( AppContext );
    let modeClassName = styles.normal;

    if ( uiMode === 'none' ) modeClassName = styles.hide;

    //

    return (
        Children.map( children, child =>
            cloneElement( child, {
                className: classNames( child.props.className, styles.uiBlock, modeClassName, styles[ hideDirection + 'HideDirection' ] )
            })
        )
    );

};
