import {getExt} from '../util.js';
import {previewHost} from '../constants.js';
import {InventoryDetails, InventoryCard} from './Inventory.js';

export const Browse = (props = {}) => {
  let allItems = props.allItems || [];
  const {selectedId, selectedHash, selectedFileName} = props;
  return `\
    <style>
      .threeD-browse {
        display: flex;
      }
      .wrap {
        position: relative;
      }
      .details {
        display: flex;
        width: 400px;
        height: 800px;
        background-color: #111;
      }
      .tiles {
        display: flex;
        width: ${2048 - 400 - 100}px;
        margin-right: auto;
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
      .arrows {
        display: flex;
        flex-direction: column;
      }
      .arrows .arrow {
        display: flex;
        width: 100px;
        height: 100px;
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
    <div class="threeD-browse">
      <div class=tiles>
        ${allItems.map(item => InventoryCard({
          anchor: 'browse-item',
          id: item.id,
          hash: item.hash,
          filename: item.filename,
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
      })}
    </div>
  `;
}
export default Browse;