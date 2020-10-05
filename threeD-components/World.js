const World = (props = {}) => {
    let peers = props.peers || [];
    return `
        <style>
        
        </style>
        <div class="threeD-world">
            <div class="threeD-peerList">
                ${
                    peers.map((value, index) => {
                        return '<div></div>';
                    }).join('')
                }
            </div>
        </div>
    `;
}
export default World;