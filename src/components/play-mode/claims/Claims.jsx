
import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import { world } from '../../../../world';
import { AppContext } from '../../app';

import styles from './claims.module.css';

//

export const Claims = () => {

    const { state, setState } = useContext( AppContext );
    const [ claims, setClaims ] = useState([]);

    const stopPropagation = ( event ) => {

        event.stopPropagation();

    };

    const handleClaimsBtnClick = ( event ) => {

        event.stopPropagation();
        setState({ openedPanel: state.openedPanel === 'ClaimsPanel' ? null : 'ClaimsPanel' });

    };

    //

    useEffect(() => {

        const handleItemPickup = ( event ) => {

            const { app } = event.data;
            const { contentId } = app;
            const newClaims = claims.slice();

            newClaims.push({ contentId });
            setClaims( newClaims );

        };

        world.appManager.addEventListener( 'pickup', handleItemPickup );

        return () => {

            world.appManager.removeEventListener( 'pickup', handleItemPickup );

        };

    }, [ claims ] );

    //

    return (
        <div className={ classnames( styles.claimsWrapper, ( claims.length ? styles.show : null ) ) } onClick={ stopPropagation } >
            <div className={ styles.claimsBtn } onClick={ handleClaimsBtnClick } >
                <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
                <span className={styles.text}>品 Claims ({claims.length})</span>
            </div>
            <div className={ classnames( styles.claimsPanel, ( state.openedPanel === 'ClaimsPanel' ? styles.opened : null ) ) } >
                <div className={ styles.claimsList } >
                    {
                        claims.map( ( claim, index ) => {

                            return (
                                <div className={ styles.claimItem } key={ index } >{ claim.contentId }</div>
                            )

                        })
                    }
                </div>
                <div className={ styles.buttonsBar }>
                    <button className={styles.button}>Claim all</button>
                    <button className={styles.button}>Reject</button>
                </div>
            </div>
        </div>
    );

};
