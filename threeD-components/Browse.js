import {getExt} from '../util.js';
import {InventoryDetails, InventoryCard} from './Inventory.js';

export const Browse = (props = {}) => {
  let allItems = props.allItems || [];
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <style>
      .threeD-browse {
        display: flex;
        height: ${2048 - 200}px;
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
        padding: 10px;
      }
      .arrows {
        display: flex;
        flex-direction: column;
      }
      .arrows .arrow {
        display: flex;
        width: 150px;
        height: 150px;
        background-color: #111;
        justify-content: center;
        align-items: center;
        color: #FFF;
        font-size: 80px;
      }
      .arrows .arrow.up {
        margin-bottom: auto;
        transform: rotateZ(180deg);
      }
      .arrows .arrow.down {
        
      }
    </style>
    <div class=threeD-browse>
      <div class=tiles>
        ${allItems.map(item => InventoryCard({
          anchor: 'browse-item',
          id: item.id,
          hash: item.properties.hash,
          filename: item.properties.filename,
          selected: selectedId === item.id,
        })).join('\n')}
      </div>
      <div class=arrows>
        <a class="arrow up" id="browse-arrow-up">v</a>
        <a class="arrow down" id="browse-arrow-down">v</a>
      </div>
      ${InventoryDetails({
        selectedId,
        selectedHash,
        selectedFileName,
        owned: false,
      })}
    </div>
  `;
}
export default Browse;