const InventoryCard = (props = {}) => {
  return `
      <a class="threeD-trade-inventory-card ${props.selected ? 'selected' : ''}" onclick="threeD-trade-inventory-card" name="${props.id}" id="threeD-trade-inventory-card">
          <img class="threeD-trade-inventory-card-preview" src="${props.preview}" style="height: 50px; width: 50px;"></img>
          <h4 class="threeD-trade-inventory-card-name">${props.name}</h4>
      </a>
  `;
}

const PeerCard = (props) => {
  return `
    <a class="threeD-trade-peers-card ${props.selected ? 'selected' : ''}" onclick="threeD-trade-peers-card" name="${props.peerAddress}" id="threeD-trade-peers-card">
      <div class="threeD-trade-peers-card-imgWrap">
        <img class="threeD-trade-peers-card-avatar" src="../assets/avatar.jpg">
      </div>
      <div class="threeD-trade-peers-card-peerName">
        <h2>Peer ID</h2>
        <h1>${props.peerAddress}</h1>
      </div>
    </a>
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
  <style>
  .threeD-trade {
    color: white;
  }
  
  .threeD-trade-content {
    overflow-y: auto;
    height: 82vh;
  }
  
  .threeD-trade-header {
    width: 100%;
    height: 200px;
    background-color: #00a6ff;
    color: white;
    text-align: center;
    padding-top: 1px;
    font-size: 40px;
  }
  
  .threeD-trade-sectionHeader {
    padding-left: 35px;
    font-size: 60px;
  }
  
  .threeD-trade-inventory {
    height: 305px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    margin: 30px;
    border: 4px #d2c1c1 solid;
  }
  
  .threeD-trade-inventory-card {
    height: 260px;
    width: 150px;
    background-color: black;
    color: white;
    margin: 10px;
    box-shadow: 0 3px 3px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24);
    border: 1px #eeeef5 solid;
    text-align: center;
    overflow: hidden;
    cursor: pointer;
  }
  
  .threeD-trade-inventory-card.selected {
    border: 2px #4faeff solid
  }
  
  .threeD-trade-inventory-card-preview {
    height: 100px;
    width: 100px;
  }
  
  .threeD-trade-inventory-card-name {
    margin-bottom: 9px;
    margin-top: 5px;
    font-size: 15px;
  }
  
  .threeD-trade-peers {
    height: 305px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    overflow-y: auto;
    margin: 30px;
    border: 4px #d2c1c1 solid;
  }
  
  .threeD-trade-peers-card {
    width: 410px;
    height: 260px;
    background-color: black;
    padding: 10px;
    box-shadow: 0 3px 3px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24);
    border-radius: 5px;
    border: 1px #eeeef5 solid;
    margin: 15px;
    display: flex;
    cursor: pointer;
  }
  
  .threeD-trade-peers-card.selected {
    border: 2px #4faeff solid
  }
  
  .threeD-trade-peers-card-imgWrap {
    width: 145px;
  }
  
  .threeD-trade-peers-card-avatar {
    height: 100%;
  }
  
  .threeD-trade-peers-card-peerName {
    width: 220px;
  }
  
  .threeD-trade-cancel {
    padding: 15px 20px;
    background-color: #ff0058;
    border: 0;
    color: #FFF;
    font-size: 50px;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    margin-top: 25px;
    margin-bottom: 50px;
    text-align: center;
    margin-right: 30px;
  }
  
  .threeD-trade-accept {
    padding: 15px 20px;
    background-color: #12bd4b;
    border: 0;
    color: #FFF;
    font-size: 50px;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    margin-top: 25px;
    margin-bottom: 50px;
    text-align: center;
  }
  
  .threeD-trade-accept.disabled {
    background-color: #b9b7b7;
    cursor: not-allowed;
    color: #FFF;
  }
  
  .threeD-trade-actions {
    display: flex;
    background-color: #000000b3;
    padding: 25px;
    position: relative;
    bottom: 0;
    right: 0;
    left: 0;
  }
  .threeD-trade-info {
    width: 50%;
  }
  .threeD-trade-info-detail {
    font-size: 50px;
    color: #00a6ff;
  }
  .threeD-trade-info-header {
    padding-left: 50px;
  }
  #threeD-trade-agreement {
    height: 50px;
    width: 50px;
    margin-right: 15px;
  }
  #threeD-trade-agreement-label {
    font-size: 40px !important;
  }
  #threeD-trade-header-backBtn {
    margin: 34px;
    font-size: 65px;
    cursor: pointer;
    position: absolute;
    left: 20px;
  }
  #threeD-trade-header-backBtn:hover {
    color: #ffae94;
  }
  .threeD-spacer {
    width: 100%;
    height: 100px;
  }
  .threeD-trade-inventory-pagination, .threeD-trade-peers-pagination {
    float: right;
    margin-right: 50px;
    text-align: center;
  }
  #threeD-trade-inventory-back, #threeD-trade-peers-back {
    background-color: black;
    display: inline-block;
    width: 80px;
    height: 80px;
    font-size: 80px;
  }
  #threeD-trade-inventory-forward, #threeD-trade-peers-forward {
    background-color: black;
    display: inline-block;
    width: 80px;
    height: 80px;
    font-size: 80px;
    margin-left: 30px;
  }
  .threeD-trade-peers-card-peerName h1 {
    font-size: 40px;
  }

  .threeD-trade-peers-card-peerName h2 {
    font-size: 30px;
  }
  #threeD-trade-inventory-page {
    display: inline;
  }
  #threeD-trade-peers-page {
    display: inline;
  }
  </style>
    <div class="threeD-trade">
      <div class="threeD-trade-header">
        <a class="threeD-trade-header-backBtn" id="threeD-trade-header-backBtn" onclick="threeD-trade-header-backBtn">
          < Back
        </a>
        <h1>Trade</h1>
      </div>
      <div class="threeD-trade-content">
        <h1 class="threeD-trade-sectionHeader">
          Select Item:
          <div class="threeD-trade-inventory-pagination">
            <a id="threeD-trade-inventory-back"><</a>
            <p id="threeD-trade-inventory-page">${props.trade.inventoryPage}</p>
            <a id="threeD-trade-inventory-forward">></a>
          </div>
        </h1>
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
        <h1 class="threeD-trade-sectionHeader">
          Select Peer:
          <div class="threeD-trade-peers-pagination">
            <a id="threeD-trade-peers-back"><</a>
            <p id="threeD-trade-peers-page">${props.trade.peersPage}</p>
            <a id="threeD-trade-peers-forward">></a>
          </div>
        </h1>
        <div class="threeD-trade-peers">
          ${
            peers.map((value, index) => {
                return PeerCard({
                  peerAddress: value.address,
                  selected: value.address === toPeer,
                });
              return;
            }).join('')
          }
        </div>
        <div class="threeD-trade-actions">  
          <div class="threeD-trade-info">
            <h1 class="threeD-trade-info-header">
              Selected Peer: 
              <p class="threeD-trade-info-detail">${toPeer}</p>
            </h1>
            <h1 class="threeD-trade-info-header">
              Item for Trade: 
              <p class="threeD-trade-info-detail">${selectedItem}</p>
            </h1>
          </div>
          <div> 
            <input style="cursor: pointer;" type="checkbox" id="threeD-trade-agreement" name="threeD-trade-agreement" ${agreement ? 'checked' : ''} onclick="threeD-trade-agreement">
            <label style="font-size: 20px; cursor: pointer;" for="threeD-trade-agreement" id="threeD-trade-agreement-label"> I agree to trade my token.</label><br>
            <div class="threeD-spacer"></div>
            <a class="threeD-trade-cancel" id="threeD-trade-cancel" onclick="threeD-trade-cancel">Cancel</a>
            <a class="threeD-trade-accept ${!agreement || !toPeer || !fromPeer || !selectedItem ? 'disabled' : ''}" id="threeD-trade-accept" onclick="threeD-trade-accept">Accept</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
export default Trade;