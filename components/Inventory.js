const InventoryCard = (props = {}) => {
    return `
        <div class="twoD-inventoryCard">
            <img class="twoD-inventoryCardPreview" src="./components/empty.png"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
            <div class="twoD-inventoryCardActions">
                <button class="twoD-inventoryCardWearBtn">
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
                    <input id="twoD-inventoryUploadBtn" type="file">
                </button>
            </div>
            <hr class="twoD-inventoryDivider"></hr>
            <div class="twoD-inventoryList">
                ${
                    inventoryItems.map((value, index) => {
                        return InventoryCard({ name: value.filename || '' })
                    }).join('')
                }
            </div>
        </div>
    `;
}
export default Inventory;