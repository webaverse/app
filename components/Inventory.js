const InventoryCard = (props) => {
    return `
        <div class="twoD-inventoryCard">
            <img class="twoD-inventoryCardPreview" src="./components/empty.png"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
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
    let inventoryItems = props.inventoryItems || [];
    return `
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <i class="far fa-times-circle twoD-inventoryClose"></i>
                <h1 class="twoD-inventoryHeaderTitle">Inventory</h1>
                <input class="twoD-inventoryUploadBtn" id="twoD-inventoryUploadBtn" type="file"></input>
            </div>
            <hr class="twoD-inventoryDivider"></hr>
            <div class="twoD-inventoryList">
                ${
                    inventoryItems.map((value, index) => {
                        console.log(value)
                        return InventoryCard({ name: value.filename || '' }) 
                    })
                }
            </div>
        </div>
    `;
}
export default Inventory;