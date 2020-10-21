import {previewHost, previewExt} from '../constants.js';

const Social = (props = {}) => {
  let peers = props.peers || [];
  const {selectedPeerId, selectedId} = props;
  const peerRig = selectedPeerId && peers.find(rig => rig.peerConnection.connectionId === selectedPeerId);
  // console.log('got peers', {peers, selectedPeerId, peerRig});
  const selectedPeerName = peerRig && peerRig.textMesh.text;
  const selectedAvatarUrl = peerRig && peerRig.avatarUrl && `${previewHost}/${peerRig.avatarUrl.match(/([^\/]+)$/)[1]}.vrm/preview.${previewExt}`;
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
      .peer-list .list-placeholder {
        display: flex;
        height: 400px;
        justify-content: center;
        align-items: center;
        font-size: 100px;
      }
      .peer-details {
        width: 400px;
        height: 1000px;
        background-color: #111;
        color: #FFF;
      }
      .peer-details img,
      .peer-details .img-placeholder
      {
        display: flex;
        width: 100%;
        height: 600px;
        background-color: #111;
        color: #FFF;
        justify-content: center;
        align-items: center;
      }
    </style>
    <div class=threeD-social>
      <div class=peer-list>
        ${peers.length > 0 ? peers.map(rig => {
          return `<a class=peer id=peer name=${rig.peerConnection?.connectionId}>
            <div class=name>${rig.textMesh?.text}</div>
            <div class=chevron>&gt;</div>
          </a>`;
        }).join('\n') : `\
          <div class=list-placeholder>No peers</div>
        `}
      </div>
      <div class=peer-details>
        ${selectedPeerId !== null ? `\
          ${selectedAvatarUrl ? `<img src="${selectedAvatarUrl}">` : '<div class=img-placeholder>No avatar</div>'}
          <div class=name>${selectedPeerName}</div>
          ${selectedPeerId !== null ? `<a class="button" id="threeD-social-tradeBtn" name="${selectedPeerId}">Trade</a>` : ''}
        ` : ''}
      <div>
    </div>
    `;
}
export default Social;