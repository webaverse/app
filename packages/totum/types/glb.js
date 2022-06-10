const path = require('path');
const fs = require('fs');
const {fillTemplate, createRelativeFromAbsolutePath, parseIdHash} = require('../util.js');

const templateString = fs.readFileSync(path.join(__dirname, '..', 'type_templates', 'glb.js'), 'utf8');
// const cwd = process.cwd();

/* function parseQuery(queryString) {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    const k = decodeURIComponent(pair[0]);
    if (k) {
      const v = decodeURIComponent(pair[1] || '');
      query[k] = v;
    }
  }
  return query;
} */

module.exports = {
  load(id) {
    id = createRelativeFromAbsolutePath(id);

    const {
      contentId,
      name,
      description,
      components,
    } = parseIdHash(id);

    // console.log('parse glb id', {id, contentId, name, description, components});

    const code = fillTemplate(templateString, {
      srcUrl: JSON.stringify(id),
      contentId: JSON.stringify(contentId),
      name: JSON.stringify(name),
      description: JSON.stringify(description),
      components: JSON.stringify(components),
    });
    return {
      code,
      map: null,
    };
  },
};