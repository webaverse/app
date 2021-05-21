const fontFiles = [
  /*'mem5YaGs126MiZpBA-UN_r8OUuhp.woff2',
  'fa-brands-400.woff2',
  'fa-duotone-900.woff2',
  'fa-light-300.woff2',
  'fa-regular-400.woff2',
  'fa-solid-900.woff2',
  'font-awesome.css', */
  // '/assets/fonts/Bangers-Regular.woff2',
  // '/assets/fonts/RobotoCondensed-Light.ttf',
  '/assets/fonts/RobotoCondensed-Regular.ttf',
];
const cssFiles = [
  /* 'open-sans.css',
  'font-awesome.css', */
  // 'bangers.css',
  // 'robotocondensed-light.css',
  'robotocondensed-regular.css',
];
const fontFileCache = {};
const cssFileCache = {};
let stylePrefix;

const base64 = (function(){
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  function encode(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  }
  function decode(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  }
  return {
    encode,
    decode,
  };
})();

const loadPromise = Promise.all(
  fontFiles.map(u =>
    fetch(u)
      .then(res => res.arrayBuffer())
      .then(arraybuffer => {
        fontFileCache[u] = base64.encode(arraybuffer);
      })
  ).concat(cssFiles.map(u =>
    fetch(u)
      .then(res => res.text())
      .then(text => {
        cssFileCache[u] = text.replace(/#/g, '%23');
      })
  ))
).then(async () => {
  for (const k in cssFileCache) {
    let s = cssFileCache[k];
    const ext = k.match(/\.([^\.]+)$/)[1];

    const regex = /(url\()([^\)]+)(\))/g;
    let match;
    while (match = regex.exec(s)) {
      // const res = await fetch(match[2]);
      // if (res.status >= 200 && res.status < 300) {
        // const arraybuffer = await res.arrayBuffer();
        // const b64 = base64.encode(arraybuffer);
        const b64 = fontFileCache[match[2]];
        const inner = match[1] + `"data:font/${ext};charset=utf-8;base64,${b64}"` + match[3];
        s = s.slice(0, match.index) + inner + s.slice(match.index + match[0].length);
        regex.lastIndex = match.index + inner.length;
      /* } else {
        return Promise.reject(new Error(`invalid status code: ${res.status}`));
      } */
    }

    cssFileCache[k] = s;
  }

  stylePrefix = `<style>body {margin: 0;} * {box-sizing: border-box;}</style>` + Object.keys(cssFileCache).map(k => `<style>${cssFileCache[k]}</style>`).join('');
});

const waitForLoad = () => loadPromise;
const getDefaultStyles = () => stylePrefix;
export {
  waitForLoad,
  getDefaultStyles,
};