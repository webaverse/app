import {getExt} from '../util.js';
import {previewHost, previewExt} from '../constants.js';

export const InventoryAvatar = props => {
  return `<div class=avatar>
    ${props.avatarUrl ? `\
      <img src="${props.avatarPreview}">
    ` : `\
      <div class=avatar-placeholder>No avatar</div>
    `}
    <div class=name>${props.username}</div>
    <div class=name>${props.balance} FT</div>
  </div>`;
};
export const InventoryDetails = props => {
  const {selectedId, selectedHash, selectedFileName, owned} = props;
  return `\
    <div class=details>
      ${selectedId !== null ? `\
        <div class=texts>
          <div class=text>${selectedId}</div>
          <div class=text>${selectedHash}</div>
          <div class=text>${selectedFileName}</div>
        </div>
        <div class=buttons>
          <a class=button id=inventory-spawn name=${selectedId}>Spawn</a>
          <a class=button id=inventory-wear name=${selectedId}>Wear</a>
          ${owned ? `<a class=button id=inventory-discard name=${selectedId}>Discard</a>` : ''}
          ${owned ? `<a class=button id=inventory-trade name=${selectedId}>Trade</a>` : ''}
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
      <img src="${previewHost}/${props.hash.slice(2)}.${ext}/preview.${previewExt}">
      <div class="border top-left"></div>
      <div class="border top-right"></div>
      <div class="border bottom-left"></div>
      <div class="border bottom-right"></div>
      <div class=text>${props.filename}</div>
      ${props.balance !== undefined ? `<div class=balance>${props.balance}</div>` : ''}
    </a>
  `;
};

export const Inventory = (props = {}) => {
  let inventoryItems = props.inventoryItems || [];
  const {username, avatarUrl, avatarFileName, avatarPreview, balance, selectedId, selectedHash, selectedFileName} = props;
  return `\
    <style>
      .threeD-inventory {
        display: flex;
        height: ${2048 - 200}px;
        background-color: rgba(255, 255, 255, 0.7);
      }
      .avatar {
        display: flex;
        width: 400px;
        height: 100%;
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
        justify-content: center;
        align-items: center;
      }
      .tiles {
        display: flex;
        width: ${2048 - 400}px;
        height: 100%;
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
        width: 20px;
        height: 20px;
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
        height: 100%;
        background-color: #111;
        color: #FFF;
        font-size: 50px;
        flex-direction: column;
        overflow: hidden;
      }
      .details .texts {
        height: 250px;
      }
      .details .text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .details .buttons {
        display: flex;
        flex-direction: column;
      }
      .details .button {
        border: 5px solid;
        padding: 20px;
        margin: 20px 0px;
      }
    </style>
    <div class=threeD-inventory>
      ${InventoryAvatar({
        username,
        avatarUrl,
        avatarFileName,
        avatarPreview,
        balance,
      })}
      <div class=tiles>
        ${inventoryItems.map(item => InventoryCard({
          anchor: 'inventory-item',
          id: item.id,
          hash: item.properties.hash,
          filename: item.properties.filename,
          balance: item.balance,
          selected: selectedId === item.id,
        })).join('\n')}
      </div>
      ${InventoryDetails({
        selectedId,
        selectedHash,
        selectedFileName,
        owned: true,
      })}
    </div>
  `;
}
export default Inventory;