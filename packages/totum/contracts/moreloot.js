const path = require('path');
const fs = require('fs');
const {fillTemplate, parseIdHash} = require('../util.js');

const templateString = fs.readFileSync(path.join(__dirname, '..', 'contract_templates', 'moreloot.js'), 'utf8');
// const cwd = process.cwd();

module.exports = {
  resolveId(source, importer) {
    return source;
  },
  load(id) {
    // console.log('moreloot load id', {id});
    id = id
      .replace(/^(eth?:\/(?!\/))/, '$1/');
    
    const match = id.match(/^eth:\/\/(0x[0-9a-f]+)\/([0-9]+)$/i);
    if (match) {
      const contractAddress = match[1];
      const tokenId = parseInt(match[2], 10);

      const {
        contentId,
        name,
        description,
        components,
      } = parseIdHash(id);

      const code = fillTemplate(templateString, {
        contractAddress,
        tokenId,
        contentId,
        name,
        description,
        components,
      });

      return {
        code,
        map: null,
      };
    } else {
      return null;
    }
  },
};