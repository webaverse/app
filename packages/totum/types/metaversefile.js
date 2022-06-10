const path = require('path');
// const fs = require('fs');
const url = require('url');
// const fetch = require('node-fetch');
const {cwd, fetchFileFromId, createRelativeFromAbsolutePath} = require('../util.js');

const _jsonParse2 = s => {
  try {
    const result = JSON.parse(s);
    return {result};
  } catch(error) {
    return {error};
  }
};

/* const cwd = process.cwd();
const isSubpath = (parent, dir) => {
  const relative = path.relative(parent, dir);
  const isSubdir = !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  return isSubdir;
}; */

module.exports = {
  async resolveId(id, importer) {
    const s = await fetchFileFromId(id, importer, 'utf8');

    if (s !== null) {
      const {result, error} = _jsonParse2(s);

      if (!error) {
        const {name, description, start_url, components} = result;

        if (start_url) {
          const _mapUrl = () => {
            if (/^https?:\/\//.test(start_url)) {
              const o = url.parse(start_url, true);
              let s = url.format(o);
              return s;
            } else if (/^https?:\/\//.test(id)) {
              const o = url.parse(id, true);
              o.pathname = path.join(path.dirname(o.pathname), start_url);
              let s = url.format(o);
              return s;
            } else if (/^\//.test(id)) {
              id = createRelativeFromAbsolutePath(id);
              
              const o = url.parse(id, true);
              o.pathname = path.join(path.dirname(o.pathname), start_url);
              let s = url.format(o);
              if (/^\//.test(s)) {
                s = cwd + s;
              }
              return s;
            } else {
              console.warn('.metaversefile scheme unknown');
              return null;
            }
          };
          const _makeHash = mapped_start_url => {
            const searchParams = new URLSearchParams();

            searchParams.set('contentId', mapped_start_url);
            if (name) {
              searchParams.set('name', name);
            }
            if (description) {
              searchParams.set('description', description);
            }
            if (Array.isArray(components)) {
              searchParams.set('components', JSON.stringify(components));
            }
            const s = searchParams.toString();
            return s ? ('#' + s) : '';
          };

          let u = _mapUrl();
          if (u) {
            u += _makeHash(u);
            return u;
          } else {
            return u;
          }
        } else {
          console.warn('.metaversefile has no "start_url": string', {j, id, s});
          return null;
        }
      } else {
        console.warn('.metaversefile could not be parsed: ' + error.stack);
        return null;
      }
    } else {
      console.warn('.metaversefile could not be loaded');
      return null;
    }
  }
};