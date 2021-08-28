const Babel = require('@babel/core');

export default function webaversePlugin() {
  return {
    name: 'webaverse',
    transform(src, id) {
      if (/\.t\.js$/.test(id)) {
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