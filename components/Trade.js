const InventoryCard = (props = {}) => {
  return `
      <div class="twoD-trade-inventory-card" onclick="twoD-trade-inventory-card" name="${props.name}">
          <img class="twoD-trade-inventory-card-preview" src="${props.preview}"></img>
          <h4 class="twoD-trade-inventory-card-name">${props.name}</h4>
      </div>
  `;
}

const PeerCard = (props) => {
  return `
    <div class="twoD-trade-peers-card" onclick="twoD-trade-peers-card" name="${props.peerName}">
      <div class="twoD-trade-peers-card-imgWrap">
        <img class="twoD-trade-peers-card-avatar" src="../assets/avatar.jpg">
      </div>
      <div class="twoD-trade-peers-card-peerName">
        <h2>Peer ID</h2>
        <h1>${props.peerName}</h1>
      </div>
    </div>
  `;
}

const Trade = (props) => {
  let inventoryItems = props.inventoryItems || [];
  let peers = props.peers || [];
  let toPeer = props.trade.toPeer || '';
  let selectedItem = props.trade.selectedItem || '';
  return `
    <div class="twoD-trade">
      <div class="twoD-trade-header">
        <h1>Trade</h1>
      </div>
      <h1 class="twoD-trade-sectionHeader">Select Item:</h1>
      <div class="twoD-trade-inventory">
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
      <h1 class="twoD-trade-sectionHeader">Select Peer:</h1>
      <div class="twoD-trade-peers">
        ${
          peers.map((value, index) => {
            return PeerCard({peerName: value.peerConnection.connectionId})
          }).join('')
        }
      </div>
      <div style="display: flex;">
        <div style="width: 50%">
          <h1 class="twoD-trade-sectionHeader">Selected Peer: <p>${toPeer}</p></h1>
          <h1 class="twoD-trade-sectionHeader">Item for Trade: <p>${selectedItem}</p></h1>
        </div>
        <div>
          <button class="twoD-trade-cancel" onclick="twoD-trade-cancel">Cancel</button>
          <button class="twoD-trade-accept" onclick="twoD-trade-accept">Accept</button>
        </div>
      </div>
    </div>
  `;
}
export default Trade;