import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import '../styles/inventory.less'

const InventoryCard = (props) => {
    return (
        <div class="twoD-inventoryCard">
            <img class="twoD-inventoryCardPreview" src="https://www.pinpng.com/pngs/m/5-52212_avatar-3d-model-free-hd-png-download.png"/>
            <h4 class="twoD-inventoryCardName">item name</h4>
            <div class="twoD-inventoryCardActions">
                <button class="twoD-inventoryCardWearBtn">Wear</button>
                <button class="twoD-inventoryCardInspectBtn">Inspect</button>
            </div>
        </div>
    );
}

const Inventory = (props) => {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    return (
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <h1 style={{ display: 'inline'}}>Inventory</h1>
                <button class="twoD-inventoryUploadBtn">Upload</button>
            </div>
            <div class="twoD-inventoryList">
                {
                    array.map((value, index) => {
                        return <InventoryCard name={index} />
                    })
                }
            </div>
        </div>
    )
}
export default Inventory;