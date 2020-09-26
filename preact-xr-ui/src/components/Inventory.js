import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import '../styles/inventory.less'

const InventoryCard = (props) => {
    return (
        <div class="twoD-inventoryCard">

        </div>
    );
}

const Inventory = (props) => {
    const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    return (
        <div class="twoD-inventory">
            <div class="twoD-inventoryHeader">
                <h1>Inventory</h1>
            </div>
            <div class="twoD-inventoryList">
                {
                    array.map((value, index) => {
                        return <InventoryCard name={index} />
                    })
                }
            </div>
        </div>
    )
}
export default Inventory;