const InventoryCard = (props = {}) => {
    return `
        <div class="twoD-inventoryCard" draggable dragid="inventory-${props.id}">
            <img class="twoD-inventoryCardPreview" src="${props.preview}"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
        </div>
    `;
}

const lol = (props) => `
<div class="twoD-inventoryCardActions">
<button class="twoD-inventoryCardWearBtn" onclick=inventory-spawn name="${props.id}">
    <i class="fal fa-magic" style="margin-right: 5px;"></i>
    Spawn
</button>
<button class="twoD-inventoryCardWearBtn" onclick=inventory-wear name="${props.id}">
    <i class="fal fa-tshirt" style="margin-right: 5px;"></i>
    Wear
</button>
<button class="twoD-inventoryCardDiscardBtn" onclick=inventory-discard name="${props.id}">
    <i class="fal fa-trash" style="margin-right: 5px;"></i>
    Discard
</button>
<button class="twoD-inventoryCardTradeBtn" onclick="twoD-inventoryCardTradeBtn" name="${props.id}">
    <i class="fal fa-gift" style="margin-right: 5px;"></i>
    Trade
</button>
</div>`

const Inventory = (props = {}) => {
    let inventoryItems = props.inventoryItems || [];
    return `
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <button class="twoD-inventoryUploadBtn">
                    <i class="fal fa-arrow-alt-from-top" style="margin-right: 5px;"></i>
                    Upload
                    <input id="twoD-inventoryUploadBtn" type="file" onchange="inventory-upload">
                </button>
            </div>
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