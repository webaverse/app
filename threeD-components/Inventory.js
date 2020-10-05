const InventoryCard = (props = {}) => {
    return `
      <a class=tile id=inventory-id-${props.id}>
        <div class=img></div>
        <div class=text>${props.filename}</div>
      </a>
    `;
}

const Inventory = (props = {}) => {
  let inventoryItems = props.inventoryItems || [];
  return `
    <style>
      .threeD-inventory {
      }
      .wrap {
        position: relative;
      }
      .tiles .tile {
        display: flex;
        flex-direction: column;
        background-color: #7e57c2;
        margin-right: 2%;
        margin-bottom: 2%;
        padding-bottom: 0;
      }
      .tiles .tile .img {
        width: 25%;
        height: 25%;
        margin: 2%;
      }
      .tiles .tile .text {
        padding: 2%;
        padding-top: 0;
        color: #FFF;
      }
    </style>
    <div class="threeD-inventory">
      <div class=avatar></div>
      <div class=tiles>
        ${inventoryItems.map(item => InventoryCard(item)).join('\n')}
      </div>
      <div class=details></div>
    </div>
  `;
}
export default Inventory;