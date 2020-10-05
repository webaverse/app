const Social = (props = {}) => {
  let peers = props.peers || [];
  const {selectedPeerId} = props;
  console.log('got peers', peers);
  return `
    <style>
      .threeD-social {
        display: flex;
        font-size: 80px;
      }
      .peer-list {
        display: flex;
        flex: 1;
        flex-direction: column;
      }
      .peer-list .peer {
        display: flex;
        padding: 30px;
        background-color: #7e57c2;
        color: #FFF;
      }
      .peer-list .peer .name {
        display: flex;
        flex: 1;
      }
      .peer-list .placeholder {
        display: flex;
        height: 400px;
        justify-content: center;
        align-items: center;
        font-size: 100px;
      }
      .peer-details {
        width: 600px;
        height: 1000px;
        background-color: #111;
        color: #FFF;
      }
    </style>
    <div class=threeD-social>
      <div class=peer-list>
        ${peers.length > 0 ? peers.map(rig => {
          return `<a class=peer id=peer name=${rig.peerConnection.connectionId}>
            <div class=name>${rig.textMesh.text}</div>
            <div class=chevron>&gt;</div>
          </a>`;
        }).join('\n') : `\
          <div class=placeholder>No peers</div>
        `}
      </div>
      <div class=peer-details>
        ${selectedPeerId !== null ? `\
          <div class=name>${selectedPeerId}</div>
          <div class=></div>
        ` : ''}
      <div>
    </div>
    `;
}
export default Social;