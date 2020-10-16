const BrowseCard = (props = {}) => {
  return `
    <div class="twoD-browse-card ${props.selected}" draggable dragid="inventory-${props.id}" onclick="twoD-browse-card" name="${props.id}">
      <img class="twoD-browse-card-preview" src="${props.preview}"></img>
      <h4 class="twoD-browse-card-name">${props.name}</h4>
    </div>
  `;
};
const Browse = (props = {}) => {
  let allItems = props.allItems || [];
  return `
    <div class="twoD-browse">
      <div class="twoD-browse-content">
        <div class="twoD-browse-list">
          ${
            allItems.map((value, index) => {
              return BrowseCard({
                id: value.id,
                name: value.filename,
                preview: value.preview,
                selected: value.id === props.browse?.selectedItem?.id ? 'selected' : ''
              })
            }).join('')
          }
        </div>
        <div class="twoD-browse-preview">
          <div class="twoD-browse-preview-content ${!props.browse?.selectedItem ? 'hidden' : ''}">
            <img class="twoD-browse-preview-img" src="${props.browse?.selectedItem?.preview || '../assets/avatar.jpg'}"></img>
            <h1 class="twoD-browse-preview-header">${props.browse?.selectedItem?.filename || 'No Items in World'}</h1>
            <div class="twoD-browse-preview-actions">
              <button class="twoD-browse-preview-spawnBtn" onclick=browse-spawn name="${props.browse?.selectedItem?.id}">
                <i class="fal fa-magic" style="margin-right: 5px;"></i>
                Spawn
              </button>
              <button class="twoD-browse-preview-wearBtn" onclick=browse-wear name="${props.browse?.selectedItem?.id}">
                <i class="fal fa-tshirt" style="margin-right: 5px;"></i>
                Wear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
export default Browse;