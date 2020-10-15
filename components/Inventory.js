const InventoryCard = (props = {}) => {
    return `
        <div class="twoD-inventoryCard ${props.selected}" draggable dragid="inventory-${props.id}" onclick="twoD-inventory-card" name="${props.id}">
            <img class="twoD-inventoryCardPreview" src="${props.preview}"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
        </div>
    `;
}

const Inventory = (props = {}) => {
    let inventoryItems = props.inventoryItems || [];
    return `
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <button class="twoD-inventoryUploadBtn">
                    <i class="fal fa-arrow-alt-from-top" style="margin-right: 5px;"></i>
                    Upload
                </button>
                <input id="twoD-inventoryUploadBtn" type="file" onchange="inventory-upload">
            </div>
            <div class="twoD-inventory-content">
                <div class="twoD-inventoryList">
                ${
                    inventoryItems.map((value, index) => {
                        return InventoryCard({
                            id: value.id,
                            name: value.filename || '',
                            preview: value.preview || '',
                            selected: value.id === props.inventory?.selectedItem?.id ? 'selected' : ''
                        })
                    }).join('')
                }
                </div>
                <div class="twoD-inventory-preview">
                    <img class="twoD-inventory-preview-img" src="${props.inventory?.selectedItem?.preview || '../assets/avatar.jpg'}"></img>
                    <h1 class="twoD-inventory-preview-header">${props.inventory?.selectedItem?.filename || 'No Items in Inventory'}</h1>
                    <div class="twoD-inventory-preview-actions ${!props.inventory?.selectedItem ? 'hidden' : ''}">
                        <button class="twoD-inventory-preview-spawnBtn" onclick=inventory-spawn name="${props.inventory?.selectedItem?.id}">
                            <i class="fal fa-magic" style="margin-right: 5px;"></i>
                            Spawn
                        </button>
                        <button class="twoD-inventory-preview-wearBtn" onclick=inventory-wear name="${props.inventory?.selectedItem?.id}">
                            <i class="fal fa-tshirt" style="margin-right: 5px;"></i>
                            Wear
                        </button>
                        <button class="twoD-inventory-preview-discardBtn" onclick=inventory-discard name="${props.inventory?.selectedItem?.id}">
                            <i class="fal fa-trash" style="margin-right: 5px;"></i>
                            Discard
                        </button>
                        <button class="twoD-inventory-preview-tradeBtn" onclick="twoD-inventoryCardTradeBtn" name="${props.inventory?.selectedItem?.id}">
                            <i class="fal fa-gift" style="margin-right: 5px;"></i>
                            Trade
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
export default Inventory;