const WorldCard = (props) => {
  return `
    <div class="twoD-worlds-card">
      <img class="twoD-worlds-card-img" src="https://techtrends.tech/wp-content/uploads/2017/11/Blockchain-Virtual-Reality-Social-VR-Consultancy-Decentraland-Linden-Lab-Second-Life-Sansar-Bitcoin-tech-trends-MANA.png">
      <a href="${window.location.href + '?u=' + props.worldName.split('.')[0]}" target="__blank">
        <h2 class="twoD-worlds-card-url">${props.worldName}</h2>
      </a>
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