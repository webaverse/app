const InventoryCard = (props) => {
    return `
        <div class="twoD-inventoryCard">
            <img class="twoD-inventoryCardPreview" src="https://www.pinpng.com/pngs/m/5-52212_avatar-3d-model-free-hd-png-download.png"></img>
            <h4 class="twoD-inventoryCardName">item name</h4>
            <div class="twoD-inventoryCardActions">
                <button class="twoD-inventoryCardWearBtn">
                    <i class="fal fa-hand-sparkles" style={{ marginRight: 5 }}></i>
                    Wear
                </button>
                <button class="twoD-inventoryCardInspectBtn">
                    <i class="fal fa-search-plus" style={{ marginRight: 5 }}></i>
                    Inspect
                </button>
            </div>
        </div>
    `;
}

const Inventory = (props) => {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    return `
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <i class="far fa-times-circle twoD-inventoryClose"></i>
                <h1 class="twoD-inventoryHeaderTitle">Inventory</h1>
                <button class="twoD-inventoryUploadBtn">
                    <i class="fal fa-arrow-alt-from-top" style={{ marginRight: 10 }}></i>
                    Upload
                </button>
            </div>
            <hr class="twoD-inventoryDivider"></hr>
            <div class="twoD-inventoryList">
                ${
                    array.map((value, index) => {
                        return InventoryCard({ name: index }) 
                    })
                }
            </div>
        </div>
    `;
}
export default Inventory;