import React, { useEffect, useState, useRef, useContext } from 'react';
import classnames from 'classnames';

import { defaultPlayerName } from '../../../../ai/lore/lore-model.js';
import * as sounds from '../../../../sounds.js';
// import cameraManager from '../../../../camera-manager.js';
import {
    hp,
    mp,
    atk,
    def,
    vit,
    spr,
    dex,
    lck,
} from '../../../../player-stats.js';

import { AppContext } from '../../app';

import { Emotions } from './Emotions';
import { Poses } from './Poses';
import { BigButton } from '../../../BigButton';

import styles from './character.module.css';

const mainStatSpecs = [
    {
        // imgSrc: 'images/stats/noun-support-cure-2360283.svg',
        // imgSrc: 'images/stats/noun-heart-1014575.svg',
        // imgSrc: 'images/stats/noun-heart-4690409.svg',
        imgSrc: 'images/stats/noun-angel-heart-1927972.svg',
        name: 'HP',
        className: 'hp',
        progress: hp,
    },
    {
        // imgSrc: 'images/stats/noun-item-crystal-2360128.svg',
        // imgSrc: 'images/stats/noun-lightning-132277.svg',
        // imgSrc: 'images/stats/noun-lightning-bolt-102450.svg',
        // imgSrc: 'images/stats/noun-galaxy-1903702.svg',
        // imgSrc: 'images/stats/noun-vortex-2806401.svg',
        imgSrc: 'images/stats/noun-vortex-2806369.svg',
        name: 'MP',
        className: 'mp',
        progress: mp,
    },
];
const statSpecs = [
    {
        // imgSrc: 'images/noun-abnormal-bleeding-2360001.svg',
        imgSrc: 'images/stats/noun-skill-sword-swing-2360242.svg',
        // imgSrc: 'images/noun-effect-circle-strike-2360022.svg',
        name: 'Atk',
        value: atk,
    },
    {
        imgSrc: 'images/stats/noun-abnormal-burned-2359995.svg',
        name: 'Def',
        value: def,
    },
    {
        // imgSrc: 'images/stats/noun-skill-magic-shock-2360168.svg',
        // imgSrc: 'images/noun-classes-magician-2360012.svg',
        imgSrc: 'images/stats/noun-skill-dna-2360269.svg',
        name: 'Vit',
        value: vit,
    },
    {
        imgSrc: 'images/stats/noun-skill-magic-chain-lightning-2360268.svg',
        name: 'Spr',
        value: spr,
    },
    {
        imgSrc: 'images/stats/noun-skill-speed-down-2360205.svg',
        name: 'Dex',
        value: dex,
    },
    {
        imgSrc: 'images/stats/noun-effect-circle-strike-2360022.svg',
        name: 'Lck',
        value: lck,
    },
];

//

const Stat = ({
    statSpec,
}) => {
    return (
        <div className={styles.stat}>
            <img className={styles.icon} src={statSpec.imgSrc} />
            <div className={styles.wrap}>
                <div className={styles.row}>
                    <div className={styles.statName}>{statSpec.name}</div>
                    <div className={styles.statValue}>{statSpec.value}</div>
                </div>
                {statSpec.progress ? (
                    <progress className={styles.progress} value={statSpec.progress} />
                )  : null}
            </div>
        </div>
    );
};

//

export const Character = ({ game, /* wearActions,*/ dioramaCanvasRef }) => {

    const { state, setState } = useContext( AppContext );
    const [ open, setOpen ] = useState(false);
    const [ characterSelectOpen, setCharacterSelectOpen ] = useState(false);

    const sideSize = 400;

    //

    /* const handleCharacterBtnClick = () => {

        setState({ openedPanel: ( state.openedPanel === 'CharacterPanel' ? null : 'CharacterPanel' ) });

        if ( state.openedPanel === 'CharacterPanel' ) {

            cameraManager.requestPointerLock();

        }

    }; */

    //

    useEffect( () => {

        if ( game.playerDiorama ) {

            const canvas = dioramaCanvasRef.current;

            if ( canvas && state.openedPanel === 'CharacterPanel' ) {

                game.playerDiorama.addCanvas( canvas );

                return () => {

                    game.playerDiorama.removeCanvas( canvas );

                };

            }

        }

    }, [ dioramaCanvasRef, state.openedPanel ] );


    useEffect( () => {

        const lastOpen = open;
        const lastCharacterSelectOpen = characterSelectOpen;

        const newOpen = state.openedPanel === 'CharacterPanel';
        const newCharacterSelectOpen = state.openedPanel === 'CharacterSelect';

        if (!lastOpen && newOpen) {

            sounds.playSoundName('menuOpen');

        } else if (lastOpen && !newOpen) {

            sounds.playSoundName('menuClose');

        }

        setOpen(newOpen);
        setCharacterSelectOpen(newCharacterSelectOpen);

    }, [ state.openedPanel ] );

    function onCanvasClick () {

        game.playerDiorama.toggleShader();

        const soundFiles = sounds.getSoundFiles();
        const audioSpec = soundFiles.menuNext[Math.floor(Math.random() * soundFiles.menuNext.length)];
        sounds.playSound(audioSpec);

    };

    function onCharacterSelectClick(e) {

        setState({ openedPanel: ( state.openedPanel === 'CharacterSelect' ? null : 'CharacterSelect' ) });

        /* if ( state.openedPanel === 'CharacterSelect' ) {

            // cameraManager.requestPointerLock();

        } */
    }
    function onDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        game.handleDropJsonItemToPlayer(e.dataTransfer.items[0]);
    }

    //

    return (
        <div
            className={ classnames( styles.characterWrapper, open ? styles.opened : null ) }
            onDrop={onDrop}
        >
            <div className={ styles.characterPanel } >
                <Poses
                    parentOpened={open}
                />
                
                <Emotions
                    parentOpened={open}
                />

                <canvas className={ styles.avatar } ref={ dioramaCanvasRef } width={ sideSize } height={ sideSize } onClick={ onCanvasClick } />

                <div className={styles['panel-body']}>
                    <div className={styles['panel-header']}>
                        <div className={styles.row}>
                            <div className={classnames(styles['panel-section'], styles.name)}>
                                <h1>{defaultPlayerName}</h1>
                            </div>
                            <div className={classnames(styles['panel-section'], styles.level)}>
                                <h2>Lv. {6}</h2>
                                <progress className={styles.progress} value={20} max={100} />
                            </div>
                        </div>
                    </div>
                    <div className={classnames(styles.stats, styles.main)}>
                        {mainStatSpecs.map((statSpec, i) => {
                            return <Stat statSpec={statSpec} key={i} />;
                        })}
                    </div>
                    <div className={classnames(styles.stats, styles.sub)}>
                        {statSpecs.map((statSpec, i) => {
                            return <Stat statSpec={statSpec} key={i} />;
                        })}
                    </div>
                </div>

                <BigButton
                  highlight={characterSelectOpen}
                  onClick={onCharacterSelectClick}
                >Character Select</BigButton>

            </div>

        </div>
    );

};
