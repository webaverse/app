const InventoryCard = (props = {}) => {
  return `\
    <a class=tile id=inventory-item name=${props.id}>
      <div class="border top-left"></div>
      <div class="border top-right"></div>
      <div class="border bottom-left"></div>
      <div class="border bottom-right"></div>
      <div class=text>${props.filename}</div>
    </a>
  `;
};
const InventoryDetails = props => {
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <div class=details>
      <div class=id>${selectedId}</div>
      <div class=id>${selectedHash}</div>
      <div class=id>${selectedFileName}</div>
      <a class=button>Spawn</a>
    </div>
  `;
};

const Inventory = (props = {}) => {
  let inventoryItems = props.inventoryItems || [];
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <style>
      .threeD-inventory {
        display: flex;
      }
      .wrap {
        position: relative;
      }
      .avatar {
        display: flex;
        width: 400px;
        height: 800px;
        background-color: #111;
      }
      .details {
        display: flex;
        width: 400px;
        height: 800px;
        background-color: #111;
      }
      .tiles {
        display: flex;
        flex: 1;
      }
      .tiles .tile {
        display: flex;
        position: relative;
        width: 200px;
        height: 200px;
        flex-direction: column;
        background-color: #7e57c2;
        margin-right: 2%;
        margin-bottom: 2%;
        padding-bottom: 0;
      }
      .tiles .tile .text {
        padding: 20px;
        padding-top: 0;
        color: #FFF;
      }
      .border {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 20px solid #111;
      }
      .border.top-left {
        top: 0;
        left: 0;
        border-bottom: 0;
        border-right: 0;
      }
      .border.top-right {
        top: 0;
        right: 0;
        border-bottom: 0;
        border-left: 0;
      }
      .border.bottom-left {
        bottom: 0;
        left: 0;
        border-top: 0;
        border-right: 0;
      }
      .border.bottom-right {
        bottom: 0;
        right: 0;
        border-top: 0;
        border-left: 0;
      }
      .details {
        display: flex;
        flex-direction: column;
        color: #FFF;
        font-size: 80px;
      }
    </style>
    <div class="threeD-inventory">
      <div class=avatar></div>
      <div class=tiles>
        ${inventoryItems.map(item => InventoryCard(item)).join('\n')}
      </div>
      ${InventoryDetails({
        selectedId,
        selectedHash,
        selectedFileName,
      })}
    </div>
  `;
}
export default Inventory;