const InventoryCard = (props = {}) => {
    return `
        <div class="threeD-inventoryCard" draggable dragid="inventory-${props.id}">
            <img class="threeD-inventoryCardPreview" src="${props.preview}"></img>
            <h4 class="threeD-inventoryCardName">${props.name}</h4>
            <div class="threeD-inventoryCardActions">
                <a id="threeD-inventoryCardWearBtn" onclick=inventory-wear inventoryid="${props.id}">
                    <i class="fal fa-hand-sparkles" style="margin-right: 5px;"></i>
                    Wear
                </a>
                <a id="threeD-inventoryCardDiscardBtn" onclick=inventory-discard inventoryid="${props.id}">
                    <i class="fal fa-trash" style="margin-right: 5px;"></i>
                    Discard
                </a>
                <a id="threeD-inventoryCardInspectBtn">
                    <i class="fal fa-search-plus" style="margin-right: 5px;"></i>
                    Inspect
                </a>
            </div>
        </div>
    `;
}

const Inventory = (props = {}) => {
    let inventoryItems = props.inventoryItems || [];
    return `
        <style>
        .threeD-inventory {

        }
        
        .threeD-inventory .threeD-inventoryHeader {
            padding: 70px 35px 70px 35px;
        }
        
        .threeD-inventory .threeD-inventoryHeader .threeD-inventoryIcon {
            margin-right: 20px;
            font-size: 30px;
        }
        
        .threeD-inventory .threeD-inventoryHeader .threeD-inventoryHeaderTitle {
            display: inline;
            font-size: 30px;
        }
        
        .threeD-inventory .threeD-inventoryHeader #threeD-inventoryUploadBtn {
            padding: 20px 20px;
            background-color: #42a5f5;
            border: 0;
            color: #FFF;
            border-radius: 30px;
            font-size: 60px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 20px;
        }
        
        .threeD-inventory .threeD-inventoryDivider {
            border-color: white;
            margin: 0px 30px 10px 30px;
        }
        
        .threeD-inventory .threeD-inventoryList {
            max-height: calc(80vh - 155px);
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-start;
            overflow-y: auto;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard {
            height: 500px;
            width: 600px;
            background-color: #e6e8ef;
            margin: 10px;
            box-shadow: 0 3px 3px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24);
            border-radius: 5px;
            border: 1px #eeeef5 solid;
            text-align: center;
            overflow: hidden;
            cursor: pointer;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardName {
            margin-bottom: 9px;
            margin-top: 5px;
            font-size: 60px;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardPreview {
            height: 200px;
            width: 100%;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardActions {
            margin-top: 40px;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardActions #threeD-inventoryCardWearBtn {
            padding: 6px 10px;
            background-color: #2ec19c;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 50px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardActions #threeD-inventoryCardInspectBtn {
            padding: 6px 10px;
            background-color: #a049e8;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 50px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        
        .threeD-inventory .threeD-inventoryList .threeD-inventoryCard .threeD-inventoryCardActions #threeD-inventoryCardDiscardBtn {
            padding: 6px 10px;
            background-color:#c12e5a;
            border: 0;
            color: #FFF;
            border-radius: 8px;
            font-size: 50px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            user-select: none;
            margin: 5px;
        }
        </style>
        <div class="threeD-inventory">
            <div class="threeD-inventoryHeader">
                <a id="threeD-inventoryUploadBtn">
                    <i class="fal fa-arrow-alt-from-top" style="margin-right: 5px;"></i>
                    Upload
                    <input id="threeD-inventoryUploadBtn" type="file" onchange="inventory-upload">
                </a>
            </div>
            <div class="threeD-inventoryList">
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