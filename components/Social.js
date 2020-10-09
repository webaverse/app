const PeerCard = (props) => {
  console.log(props)
  return `
    <div class="twoD-social-peerCard">
      <div style="width: 220px;">
        <img class="twoD-social-peerCard-avatar" src="https://media.istockphoto.com/vectors/default-avatar-profile-icon-gray-placeholder-photo-vector-id844061224?b=1&k=6&m=844061224&s=612x612&w=0&h=adm3xmgWwC3YTVC2swWz02NDmtZ6vFaIw8a_XBGsOLk=">
      </div>
      <div style="width: 220px;">
        <h2>Peer ID</h2>
        <h1>${props.peerName}</h1>
      </div>
      <div style="width: 220px; text-align: center; padding-top: 20px;">
        <button class="twoD-social-peerCard-teleport">Teleport</button>
        <button class="twoD-social-peerCard-trade">Trade</button>
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
            return PeerCard({peerName: value.peerConnection.connectionId})
          })
        }
      </div>
    `;
  } else {
    return `
      <div class="twoD-social">
        <div style="text-align: center; width: 100%;">
          <h1 style="margin-top: 15vh; font-size: 45px;">World is Empty</h1>
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