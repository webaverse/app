import {previewHost} from '../constants.js';

const _getExt = fileName => {
  const match = fileName.match(/\.(.+)$/);
  return match && match[1];
};

const InventoryCard = (props = {}) => {
  const ext = _getExt(props.filename) || 'bin';
  return `\
    <a class=tile id=inventory-item name=${props.id}>
      <div class="border top-left"></div>
      <div class="border top-right"></div>
      <div class="border bottom-left"></div>
      <div class="border bottom-right"></div>
      <img src="${previewHost}/${props.hash}.${ext}/preview.png">
      <div class=text>${props.filename}</div>
    </a>
  `;
};
const InventoryAvatar = props => {
  return `<div class=avatar>
    ${props.avatarHash ? `\
      <img src="${previewHost}/${props.avatarHash}.vrm/preview.png">
    ` : `\
      <div class=avatar-placeholder>No avatar</div>
    `}
    <div class=name>${props.username}</div>
  </div>`;
};
const InventoryDetails = props => {
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <div class=details>
      ${selectedId !== null ? `\
        <div class=id>${selectedId}</div>
        <div class=id>${selectedHash}</div>
        <div class=id>${selectedFileName}</div>
        <a class=button id=inventory-spawn name=${selectedId}>Spawn</a
      ` : ''}
    </div>
  `;
};

const Inventory = (props = {}) => {
  let inventoryItems = props.inventoryItems || [];
  const {username, avatarHash, selectedId, selectedHash, selectedFileName} = props;
  return `\
    <style>
      .threeD-inventory {
        display: flex;
      }
      .wrap {
        position: relative;
      }
      .avatar {
        display: flex;
        width: 400px;
        flex-direction: column;
        background-color: #111;
        color: #FFF;
        font-size: 80px;
      }
      .avatar img,
      .avatar .avatar-placeholder
      {
        display: flex;
        width: 100%;
        height: 800px;
        justify-content: center;
        align-items: center;
      }
      .details {
        display: flex;
        width: 400px;
        height: 800px;
        background-color: #111;
      }
      .tiles {
        display: flex;
        flex: 1;
      }
      .tiles .tile {
        display: flex;
        position: relative;
        width: 200px;
        height: 200px;
        flex-direction: column;
        background-color: #7e57c2;
        margin-right: 2%;
        margin-bottom: 2%;
        padding-bottom: 0;
      }
      .tiles .tile img {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        width: 200px;
        height: 200px;
      }
      .tiles .tile .text {
        padding: 20px;
        padding-top: 0;
        color: #FFF;
      }
      .border {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 20px solid #111;
      }
      .border.top-left {
        top: 0;
        left: 0;
        border-bottom: 0;
        border-right: 0;
      }
      .border.top-right {
        top: 0;
        right: 0;
        border-bottom: 0;
        border-left: 0;
      }
      .border.bottom-left {
        bottom: 0;
        left: 0;
        border-top: 0;
        border-right: 0;
      }
      .border.bottom-right {
        bottom: 0;
        right: 0;
        border-top: 0;
        border-left: 0;
      }
      .details {
        display: flex;
        flex-direction: column;
        color: #FFF;
        font-size: 80px;
      }
    </style>
    <div class="threeD-inventory">
      ${InventoryAvatar({
        username,
        avatarHash,
      })}
      <div class=tiles>
        ${inventoryItems.map(item => InventoryCard(item)).join('\n')}
      </div>
      ${InventoryDetails({
        selectedId,
        selectedHash,
        selectedFileName,
      })}
    </div>
  `;
}
export default Inventory;