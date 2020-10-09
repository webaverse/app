const BrowseCard = (props = {}) => {
  return `
    <div class="twoD-browse-card" draggable dragid="inventory-${props.id}">
      <img class="twoD-browse-card-preview" src="${props.preview}"></img>
      <h4 class="twoD-browse-card-name">${props.name}</h4>
      <div class="twoD-browse-card-actions">
        <button class="twoD-browse-card-wearBtn" onclick=inventory-spawn name="${props.id}">
          <i class="fal fa-magic" style="margin-right: 5px;"></i>
          Spawn
        </button>
        <button class="twoD-browse-card-wearBtn" onclick=inventory-wear name="${props.id}">
          <i class="fal fa-tshirt" style="margin-right: 5px;"></i>
          Wear
        </button>
        <button class="twoD-browse-card-discardBtn" onclick=inventory-discard name="${props.id}">
          <i class="fal fa-trash" style="margin-right: 5px;"></i>
          Discard
        </button>
        <button class="twoD-browse-card-inspectBtn">
          <i class="fal fa-search-plus" style="margin-right: 5px;"></i>
          Inspect
        </button>
      </div>
    </div>
  `;
};
const Browse = (props = {}) => {
  let allItems = props.allItems || [];
  return `
    <div class="twoD-browse">
      <div class="twoD-browse-list">
        ${
          allItems.map((value, index) => {
            return BrowseCard({
              id: value.id,
              name: value.filename,
              preview: value.preview
            })
          }).join('')
        }
      </div>
    </div>
  `;
};
export default Browse;