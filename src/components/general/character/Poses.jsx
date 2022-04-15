
import React, { useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';

import styles from './poses.module.css';

const poses = [
    'dance',
    'happy',
];

//

export const Poses = ({
    parentOpened,
}) => {
    const [ posesOpen, setPosesOpen ] = useState( false );
    const posesRef = useRef();

    return (
        <div
            className={classnames(
                styles.poses,
                parentOpened ? styles.parentOpened : null,
                posesOpen ? styles.open : null,
            )}
            onMouseEnter={e => {
                setPosesOpen(true);
            }}
            onMouseLeave={e => {
                setPosesOpen(false);
            }}
            ref={posesRef}
        >
            {poses.map((pose, poseIndex) => {
                return (
                    <div
                        className={styles.pose}
                        key={pose}
                    >
                        <img src={`images/poses/${pose}.svg`} className={styles.poseIcon} />
                        <div className={styles.poseName}>{pose}</div>
                    </div>
                );
            })}
        </div>
    );
};