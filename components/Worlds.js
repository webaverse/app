const WorldCard = (props) => {
  return `
    <div class="twoD-worlds-card">
      <img class="twoD-worlds-card-img" src="./world-placeholder.png">
      <div class="twoD-worlds-card-meta">
        <a href="${window.location.href + '?u=' + props.worldName}">
        <h2 class="twoD-worlds-card-url">${props.worldName}</h2>
        </a>
      </div>
    </div>
  `;
}

const Worlds = (props) => {
  console.log(props)
  return `
    <div class="twoD-worlds">
    ${
      props.worlds.map((value, index) => {
          return WorldCard({worldName: value})
      }).join('')
    }
    </div>
  `;
}
export default Worlds;