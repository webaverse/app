const PeerCard = (props) => {
  return `
    <div class="twoD-social-peerCard">
      <div class="twoD-social-peerCard-imgWrap">
        <img class="twoD-social-peerCard-avatar" src="../assets/avatar.jpg">
      </div>
      <div class="twoD-social-peerCard-peerName">
        <h2>Peer ID</h2>
        <h1>${props.peerAddress}</h1>
      </div>
      <div class="twoD-social-peerCard-actions">
        <button class="twoD-social-peerCard-teleport">Teleport</button>
        <button class="twoD-social-peerCard-trade" onclick="twoD-social-peerCard-trade" name="${props.peerAddress}">Trade</button>
      </div>
    </div>
  `;
}

const Social = (props) => {
  if (props.peers && props.peers.length > 0) {
    return `
      <div class="twoD-social">
        ${
          props.peers.map((value, index) => {
            if (value.address) {
              return PeerCard({peerAddress: value.address})
            }
            return;
          }).join('')
        }
      </div>
    `;
  } else {
    return `
      <div class="twoD-social">
        <div class="twoD-social-noPeers">
          <h1 class="twoD-social-noPeers-header">Nobody is here</h1>
          <button class="twoD-social-peerCard-shareWorld" onclick="twoD-social-peerCard-shareWorld" value="Copy / Paste">
            <p style="margin: 0;">
              <i class="fal fa-copy" style="padding: 15px;"></i>
              Copy / Paste
            </p>
          </button>
          <input onclick="twoD-social-peerCard-shareWorld" class="twoD-social-peerCard-shareWorldUrl" id="twoD-social-peerCard-shareWorldUrl" value="${window.location.href}" type="text">
        </div>
      </div>
    `;
  }
  
}
export default Social;