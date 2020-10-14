const InventoryCard = (props = {}) => {
  return `
      <div class="twoD-trade-inventory-card ${props.selected ? 'selected' : ''}" onclick="twoD-trade-inventory-card" name="${props.id}" id="twoD-trade-inventory-card-${props.id}">
          <img class="twoD-trade-inventory-card-preview" src="${props.preview}"></img>
          <h4 class="twoD-trade-inventory-card-name">${props.name}</h4>
      </div>
  `;
}

const PeerCard = (props) => {
  return `
    <div class="twoD-trade-peers-card ${props.selected ? 'selected' : ''}" onclick="twoD-trade-peers-card" name="${props.peerAddress}" id="twoD-trade-peers-card-${props.peerAddress}">
      <div class="twoD-trade-peers-card-imgWrap">
        <img class="twoD-trade-peers-card-avatar" src="../assets/avatar.jpg">
      </div>
      <div class="twoD-trade-peers-card-peerName">
        <h2>Peer ID</h2>
        <h1>${props.peerAddress}</h1>
      </div>
    </div>
  `;
}

const Trade = props => {
  let inventoryItems = props.inventoryItems;
  let peers = props.peers;
  let toPeer = props.trade.toPeer;
  let fromPeer = props.trade.fromPeer;
  let selectedItem = props.trade.selectedItem;
  let agreement = !!props.trade.agreement;
  return `
    <div class="twoD-trade">
      <div class="twoD-trade-header">
        <i class="fal fa-arrow-left twoD-trade-header-backBtn" onclick="twoD-trade-cancel"></i>
        <h1>Trade</h1>
      </div>
      <h1 class="twoD-trade-sectionHeader">Select Item:</h1>
      <div class="twoD-trade-inventory">
        ${
          inventoryItems.map((value, index) => {
              return InventoryCard({
                  id: value.id,
                  name: value.filename,
                  preview: value.preview,
                  selected: selectedItem == value.id,
              })
          }).join('')
        }
      </div>
      <h1 class="twoD-trade-sectionHeader">Select Peer:</h1>
      <div class="twoD-trade-peers">
        ${
          peers.map((value, index) => {
            if (value.address) {
              return PeerCard({
                peerAddress: value.address,
                selected: value.address === toPeer,
              });
            }
            return;
          }).join('')
        }
      </div>
      <div class="twoD-trade-actions">
        <div class="twoD-trade-info">
          <h1 class="twoD-trade-info-header">Selected Peer: <p class="twoD-trade-info-detail">${toPeer}</p></h1>
          <h1 class="twoD-trade-info-header">Item for Trade: <p class="twoD-trade-info-detail">${selectedItem}</p></h1>
        </div>
        <div> 
          <input style="cursor: pointer;" type="checkbox" id="twoD-trade-agreement" name="twoD-trade-agreement" ${agreement ? 'checked' : ''} onclick="twoD-trade-agreement">
          <label style="font-size: 20px; cursor: pointer;" for="twoD-trade-agreement"> I agree to trade my token.</label><br>
          <br/>
          <button class="twoD-trade-cancel" onclick="twoD-trade-cancel">Cancel</button>
          <button class="twoD-trade-accept ${!agreement || !toPeer || !fromPeer || !selectedItem ? 'disabled' : ''}" onclick="twoD-trade-accept">Accept</button>
        </div>
      </div>
    </div>
  `;
}
export default Trade;