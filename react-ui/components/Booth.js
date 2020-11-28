import { React } from '../web_modules/es-react.js';
import htm from '../web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'

const html = htm.bind(React.createElement)

const Booth = ({
  data,
  cardSize
}) => {
    return html`
      <div class="assetDataGrid">
        <${AssetCardGrid} data=${data.entries} cardSize=${cardSize} />
      </div>
    `;
  };

  export default Booth;

