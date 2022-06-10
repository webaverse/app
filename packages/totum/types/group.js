const path = require('path');
const fs = require('fs');
const {fillTemplate, createRelativeFromAbsolutePath, parseIdHash} = require('../util.js');

const templateString = fs.readFileSync(path.join(__dirname, '..', 'type_templates', 'group.js'), 'utf8');
// const cwd = process.cwd();

module.exports = {
  load(id) {
    
    id = createRelativeFromAbsolutePath(id);

    const {
      contentId,
      name,
      description,
      components,
    } = parseIdHash(id);

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