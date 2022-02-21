
import classNames from 'classnames';
import React from 'react';

import styles from './item-info.module.css';

//

export const ItemInfo = ({ opened, setOpened }) => {

    const handleBackToInventoryBtnClick = () => {

        setOpened( false );

    };

    //

    return (
        <div className={ classNames( styles.itemInfo, opened ? styles.opened : null ) } >
            <div className={ styles.itemInfoBackBtn } onClick={ handleBackToInventoryBtnClick } >&#8592; BACK</div>
            <div className={ styles.title } >Some title</div>
            <div className={ styles.generalInfoBlock } >
                <div className={ styles.image } />
                <div className={ styles.textBlock } >
                    <div className={ styles.author } >Create by noname</div>
                    <div className={ styles.text } >Some description</div>
                </div>
                <div className={ styles.clearfix } />
                <div className={ styles.propList } >
                    <div className={ styles.property } >
                        <div className={ styles.propTitle } >Background</div>
                        <div className={ styles.propDescription } >Green</div>
                        <div className={ styles.propRarity } >7%</div>
                    </div>
                    <div className={ styles.property } >
                        <div className={ styles.propTitle } >Background</div>
                        <div className={ styles.propDescription } >Green</div>
                        <div className={ styles.propRarity } >7%</div>
                    </div>
                    <div className={ styles.property } >
                        <div className={ styles.propTitle } >Background</div>
                        <div className={ styles.propDescription } >Green</div>
                        <div className={ styles.propRarity } >7%</div>
                    </div>
                </div>
                <div className={ styles.clearfix } />
            </div>
            <div className={ styles.descriptionBlock }>
                <div className={ styles.descriptionTitle } >Details</div>
                <div className={ styles.descriptionLine } >
                    <div className={ styles.descriptionItemTitle } >Contact address</div>
                    <div className={ styles.descriptionItemValue } >0xff...dsdc</div>
                </div>
                <div className={ styles.descriptionLine } >
                    <div className={ styles.descriptionItemTitle } >Token ID</div>
                    <div className={ styles.descriptionItemValue } >1930</div>
                </div>
                <div className={ styles.descriptionLine } >
                    <div className={ styles.descriptionItemTitle } >Token Standard</div>
                    <div className={ styles.descriptionItemValue } >ERC-721</div>
                </div>
                <div className={ styles.descriptionLine } >
                    <div className={ styles.descriptionItemTitle } >Blockchain</div>
                    <div className={ styles.descriptionItemValue } >Ethereum</div>
                </div>
            </div>
        </div>
    );

};
