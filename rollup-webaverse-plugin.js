const Babel = require('@babel/core');
const fetch = require('node-fetch');

export default function webaversePlugin() {
  return {
    name: 'webaverse',
    enforce: 'pre',
    resolveId(source, importer) {
      // console.log('resolveId', source);
      if (/^ipfs:\/+/.test(source)) {
        return source;
      } else {
        return null;
      }
    },
    load(id) {
      const match = id.match(/^ipfs:\/+([a-z0-9]+)((?:\/?[^\/\?]*)*)(\?\.(.+))?$/i);
      // console.log('load', id, !!match);
      if (match) {
        return fetch(`https://ipfs.exokit.org/ipfs/${match[1]}${match[2]}`)
          .then(res => res.text());
      } else {
        return null;
      }
    },
    transform(src, id) {
      const match = id.match(/^ipfs:\/+([a-z0-9]+)((?:\/?[^\/\?]*)*)(\?\.(.+))?$/i);
      // console.log('transform', id, match);
      if (match && match[3] === 'jsx') {
        const spec = Babel.transform(src, {
          presets: ['@babel/preset-react'],
          // compact: false,
        });
        const {code} = spec;
        return {
          code,
          map: null // provide source map if available
        }
      }
    }
  }
}