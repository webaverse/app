const PeerCard = (props) => {
  console.log(props)
  return `
    <div class="twoD-social-peerCard">
      <h1>${props.peerName}</h1>
    </div>
  `;
}

const Social = (props) => {
  return `
    <div class="twoD-social">
      ${
        props.peers.map((value, index) => {
          return PeerCard({peerName: value.peerConnection.connectionId})
        })
      }
    </div>
  `;
}
export default Social;