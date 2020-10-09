import {getExt} from '../util.js';
import {previewHost, previewExt} from '../constants.js';

export const InventoryAvatar = props => {
  const ext = (props.avatarFileName && getExt(props.avatarFileName)) || 'bin';
  return `<div class=avatar>
    ${props.avatarHash ? `\
      <img src="${previewHost}/${props.avatarHash}.${ext}/preview.${previewExt}">
    ` : `\
      <div class=avatar-placeholder>No avatar</div>
    `}
    <div class=name>${props.username}</div>
    <div class=name>${props.balance} FT</div>
  </div>`;
};
export const InventoryDetails = props => {
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <div class=details>
      ${selectedId !== null ? `\
        <div class=text>${selectedId}</div>
        <div class=text>${selectedHash}</div>
        <div class=text>${selectedFileName}</div>
        <div class=buttons>
          <a class=button id=inventory-spawn name=${selectedId}>Spawn</a>
          <a class=button id=inventory-wear name=${selectedId}>Wear</a>
          <a class=button id=inventory-discard name=${selectedId}>Discard</a>
        </div>
      ` : ''}
    </div>
  `;
};
export const InventoryCard = (props = {}) => {
  const ext = getExt(props.filename) || 'bin';
  return `\
    <a class=tile id=${props.anchor} name=${props.id}>
      ${props.selected ? '<div class=outline></div>' : ''}
      <img src="${previewHost}/${props.hash}.${ext}/preview.${previewExt}">
      <div class="border top-left"></div>
      <div class="border top-right"></div>
      <div class="border bottom-left"></div>
      <div class="border bottom-right"></div>
      <div class=text>${props.filename}</div>
      <div class=balance>${props.balance}</div>
    </a>
  `;
};

export const Inventory = (props = {}) => {
  let inventoryItems = props.inventoryItems || [];
  const {username, avatarHash, avatarFileName, balance, selectedId, selectedHash, selectedFileName} = props;
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
        width: ${2048 - 400}px;
        padding-top: 20px;
        padding-left: 20px;
        flex-wrap: wrap;
        align-content: flex-start;
      }
      .tiles .tile {
        display: inline-flex;
        position: relative;
        width: 200px;
        height: 200px;
        flex-direction: column;
        background-color: #7e57c2;
        margin-right: 20px;
        margin-bottom: 20px;
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
      .tiles .tile .text,
      .tiles .tile .balance
      {
        padding: 10px;
        background-color: #111;
        color: #FFF;
        font-size: 50px;
      }
      .tiles .tile .text {
        position: absolute;
        top: 0;
        left: 0;
        font-size: 30px;
      }
      .tiles .tile .balance {
        position: absolute;
        bottom: 0;
        left: 0;
      }
      .tiles .tile .outline {
        position: absolute;
        left: -20px;
        right: -20px;
        top: -20px;
        bottom: -20px;
        background-color: #ff7043;
      }
      .border {
        position: absolute;
        width: 10px;
        height: 10px;
        border: 10px solid #111;
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
        width: 400px;
        color: #FFF;
        font-size: 50px;
        flex-direction: column;
        overflow: hidden;
      }
      .details .text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .details .buttons {
        display: flex;
        margin-top: auto;
        flex-direction: column;
      }
      .details .button {
        border: 5px solid;
        padding: 10px;
      }
    </style>
    <div class="threeD-inventory">
      ${InventoryAvatar({
        username,
        avatarHash,
        avatarFileName,
        balance,
      })}
      <div class=tiles>
        ${inventoryItems.map(item => InventoryCard({
          anchor: 'inventory-item',
          id: item.id,
          hash: item.hash,
          filename: item.filename,
          balance: item.balance,
          selected: selectedId === item.id,
        })).join('\n')}
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