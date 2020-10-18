const InventoryCard = (props = {}) => {
  return `
      <div class="threeD-trade-inventory-card ${props.selected ? 'selected' : ''}" onclick="threeD-trade-inventory-card" name="${props.id}" id="threeD-trade-inventory-card-${props.id}">
          <img class="threeD-trade-inventory-card-preview" src="${props.preview}"></img>
          <h4 class="threeD-trade-inventory-card-name">${props.name}</h4>
      </div>
  `;
}

const PeerCard = (props) => {
  return `
    <div class="threeD-trade-peers-card ${props.selected ? 'selected' : ''}" onclick="threeD-trade-peers-card" name="${props.peerAddress}" id="threeD-trade-peers-card-${props.peerAddress}">
      <div class="threeD-trade-peers-card-imgWrap">
        <img class="threeD-trade-peers-card-avatar" src="../assets/avatar.jpg">
      </div>
      <div class="threeD-trade-peers-card-peerName">
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
    <div class="threeD-trade">
      <div class="threeD-trade-header">
        <i class="fal fa-arrow-left threeD-trade-header-backBtn" onclick="threeD-trade-cancel"></i>
        <h1>Trade</h1>
      </div>
      <div class="threeD-trade-content">
        <h1 class="threeD-trade-sectionHeader">Select Item:</h1>
        <div class="threeD-trade-inventory">
          ${
            inventoryItems.map((value, index) => {
                return InventoryCard({
                    id: value.id,
                    name: value.filename,
                    preview: value.preview,
                    selected: selectedItem === value.id,
                })
            }).join('')
          }
        </div>
        <h1 class="threeD-trade-sectionHeader">Select Peer:</h1>
        <div class="threeD-trade-peers">
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
        <div class="threeD-trade-actions">
          <div class="threeD-trade-info">
            <h1 class="threeD-trade-info-header">Selected Peer: <p class="threeD-trade-info-detail">${toPeer}</p></h1>
            <h1 class="threeD-trade-info-header">Item for Trade: <p class="threeD-trade-info-detail">${selectedItem}</p></h1>
          </div>
          <div> 
            <input style="cursor: pointer;" type="checkbox" id="threeD-trade-agreement" name="threeD-trade-agreement" ${agreement ? 'checked' : ''} onclick="threeD-trade-agreement">
            <label style="font-size: 20px; cursor: pointer;" for="threeD-trade-agreement"> I agree to trade my token.</label><br>
            <br/>
            <button class="threeD-trade-cancel" onclick="threeD-trade-cancel">Cancel</button>
            <button class="threeD-trade-accept ${!agreement || !toPeer || !fromPeer || !selectedItem ? 'disabled' : ''}" onclick="threeD-trade-accept">Accept</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
export default Trade;