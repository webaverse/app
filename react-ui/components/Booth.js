import { React } from '../web_modules/es-react.js';
import htm from '../web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'

const styles = csz`./Booth.css`


const html = htm.bind(React.createElement)

const Booth = ({
  data,
  cardSize
}) => {
    return html`
      <div class=${styles}>
        <div class="booth ${cardSize}">
          <${AssetCardGrid} data=${data.entries} cardSize=${cardSize} />
        </div>
      </div>
    `;
  };

  export default Booth;

