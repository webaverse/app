const Social = (props = {}) => {
    let peers = props.peers || [];
    return `
        <style>
        
        </style>
        <div class="threeD-social">
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
export default Social;