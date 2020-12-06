import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'

const styles = csz`/components/Booth.css`


const html = htm.bind(React.createElement)

const Booth = ({
  data,
  cardSize
}) => {
  console.log("Data is", data);
    return html`
        <div className="${styles} booth ${cardSize}">
          <${AssetCardGrid} data=${data.entries} cardSize=${cardSize} />
        </div>
    `;
  };

  export default Booth;

