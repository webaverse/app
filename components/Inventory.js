import inventory from '../inventory.js';
import { updateProps } from './App.js';

const InventoryCard = (props = {}) => {
    return `
        <div class="twoD-inventoryCard">
            <img class="twoD-inventoryCardPreview" src="${props.preview}"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
            <div class="twoD-inventoryCardActions">
                <button class="twoD-inventoryCardWearBtn" onclick=inventory-wear inventoryid=${props.id}>
                    <i class="fal fa-hand-sparkles" style="margin-right: 5px;"></i>
                    Wear
                </button>
                <button class="twoD-inventoryCardInspectBtn">
                    <i class="fal fa-search-plus" style="margin-right: 5px;"></i>
                    Inspect
                </button>
            </div>
        </div>
    `;
}

const Inventory = (props = {}) => {
    let inventoryItems = props.inventoryItems || [];
    return `
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <i class="fal fa-backpack twoD-inventoryIcon"></i>
                <h1 class="twoD-inventoryHeaderTitle">Inventory</h1>
                <button class="twoD-inventoryUploadBtn">
                    <i class="fal fa-arrow-alt-from-top" style="margin-right: 5px;"></i>
                    Upload
                    <input id="twoD-inventoryUploadBtn" type="file" onchange="inventory-upload">
                </button>
            </div>
            <hr class="twoD-inventoryDivider"></hr>
            <div class="twoD-inventoryList">
                ${
                    inventoryItems.map((value, index) => {
                        return InventoryCard({
                            id: value.id,
                            name: value.filename || '',
                            preview: value.preview || ''
                        })
                    }).join('')
                }
            </div>
        </div>
    `;
}
export default Inventory;