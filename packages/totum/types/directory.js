const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const {cwd, fillTemplate, createRelativeFromAbsolutePath} = require('../util.js');
const metaversefileLoader = require('./metaversefile.js');

const templateString = fs.readFileSync(path.join(__dirname, '..', 'type_templates', 'html.js'));

const _resolveHtml = (id, importer) => {
  const code = fillTemplate(templateString, {
    srcUrl: id,
  });
  return {
    code,
    map: null,
  };
};

module.exports = {
  async resolveId(id, importer) {
    const oldId = id;
    
    id = createRelativeFromAbsolutePath(id);

    // console.log('load directory', oldId, id, /^https?:\/\//.test(id), /\/$/.test(id));
    if (/^https?:\/\//.test(id) && /\/$/.test(id)) {
      const metaversefilePath = id + '.metaversefile';
      const res = await fetch(metaversefilePath, {
        method: 'HEAD',
      });
      if (res.ok) {
        const metaversefileStartUrl = await metaversefileLoader.resolveId(metaversefilePath, id);
        // console.log('got metaversefile', {metaversefilePath, metaversefileStartUrl, id: id + '.fakeFile'});
        return metaversefileStartUrl;
      } else {
        // console.log('got html', id, importer);
        
        const indexHtmlPath = id + 'index.html';
        const res = await fetch(indexHtmlPath, {
          method: 'HEAD',
        });
        if (res.ok) {
          return indexHtmlPath;
        } else {
          return null;
        }
      }
    } else if (/^\//.test(id)) {
      // console.log('got pre id 1', {id});
      id = path.resolve(id);
      const idFullPath = path.join(cwd, id);
      const isDirectory = await new Promise((accept, reject) => {
        fs.lstat(idFullPath, (err, stats) => {
          accept(!err && stats.isDirectory());
        });
      });
      if (isDirectory) {
        const metaversefilePath = path.join(id, '.metaversefile');
        const metaversefileFullPath = path.join(cwd, metaversefilePath);
        const metaversefileExists = await new Promise((accept, reject) => {
          fs.lstat(metaversefileFullPath, (err, stats) => {
            accept(!err && stats.isFile());
          });
        });
        // console.log('got pre id 2', {id, metaversefilePath, metaversefileFullPath, metaversefileExists});
        if (metaversefileExists) {
          const fakeImporter = path.join(id, '.fakeFile');
          const fakeId = path.join(path.dirname(fakeImporter), '.metaversefile');
          // console.log('exists 1.1', {metaversefilePath, fakeId, fakeImporter});
          const metaversefileStartUrl = await metaversefileLoader.resolveId(fakeId, fakeImporter);
          // console.log('exists 1.2', {metaversefilePath, metaversefileStartUrl});
          // console.log('got metaversefile', {metaversefilePath, metaversefileStartUrl, id: id + '.fakeFile'});
          return metaversefileStartUrl;
        } else {
          // console.log('exists 2');
          
          const indexHtmlPath = path.join(id, 'index.html');
          const indexHtmlFullPath = path.join(cwd, indexHtmlPath);
          const indexHtmlExists = await new Promise((accept, reject) => {
            fs.lstat(indexHtmlFullPath, (err, stats) => {
              accept(!err && stats.isFile());
            });
          });

          if (indexHtmlExists) {
            // console.log('exists 3', {indexHtmlPath});
            return indexHtmlPath;
          } else {
            // console.log('exists 4');
            return null;
          }
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  },
  load(id) {
    if (id === '/@react-refresh') {
      return null;
    } else {
      id = id.replace(/^\/@proxy\//, '');
      return _resolveHtml(id);
    }
  }
};