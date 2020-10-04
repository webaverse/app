const InventoryCard = (props = {}) => {
    return `
        <div class="twoD-inventoryCard" draggable dragid="inventory-${props.id}">
            <img class="twoD-inventoryCardPreview" src="${props.preview}"></img>
            <h4 class="twoD-inventoryCardName">${props.name}</h4>
            <div class="twoD-inventoryCardActions">
                <button class="twoD-inventoryCardWearBtn" onclick=inventory-wear inventoryid="${props.id}">
                    <i class="fal fa-hand-sparkles" style="margin-right: 5px;"></i>
                    Wear
                </button>
                <button class="twoD-inventoryCardDiscardBtn" onclick=inventory-discard inventoryid="${props.id}">
                    <i class="fal fa-trash" style="margin-right: 5px;"></i>
                    Discard
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
        <style>
        .twoD-inventory {

        }
        
        .twoD-inventory .twoD-inventoryHeader {
            padding: 25px 35px 20px 35px;
        }
        
        .twoD-inventory .twoD-inventoryHeader .twoD-inventoryIcon {
            margin-right: 20px;
            font-size: 30px;
        }
        
        .twoD-inventory .twoD-inventoryHeader .twoD-inventoryHeaderTitle {
            display: inline;
            font-size: 30px;
        }
        
        .twoD-inventory .twoD-inventoryHeader .twoD-inventoryUploadBtn {
            padding: 10px 20px;
            background-color: #42a5f5;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 16px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
        }
        
        .twoD-inventory .twoD-inventoryDivider {
            border-color: white;
            margin: 0px 30px 10px 30px;
        }
        
        .twoD-inventory .twoD-inventoryList {
            max-height: calc(80vh - 155px);
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-start;
            overflow-y: auto;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard {
            height: 240px;
            width: 250px;
            background-color: #e6e8ef;
            margin: 10px;
            box-shadow: 0 3px 3px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24);
            border-radius: 5px;
            border: 1px #eeeef5 solid;
            text-align: center;
            overflow: hidden;
            cursor: pointer;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard:hover {
            height: 320px;
            transition: height 0.5s;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard:hover {
            border: 1px #eeeef5 solid;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardName {
            margin-bottom: 9px;
            margin-top: 5px;
            font-size: 15px;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardPreview {
            height: 200px;
            width: 100%;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardActions {
        
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardActions .twoD-inventoryCardWearBtn {
            padding: 6px 10px;
            background-color: #2ec19c;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 14px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardActions .twoD-inventoryCardInspectBtn {
            padding: 6px 10px;
            background-color: #a049e8;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 14px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        
        .twoD-inventory .twoD-inventoryList .twoD-inventoryCard .twoD-inventoryCardActions .twoD-inventoryCardDiscardBtn {
            padding: 6px 10px;
            background-color:#c12e5a;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 14px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        </style>
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