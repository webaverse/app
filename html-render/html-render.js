import Mustache from './mustache.js';
import {PCancelable} from './p-cancelable.js';
import lruCache from './lru-cache.js';
import {waitForLoad, getDefaultStyles} from './default-styler.js';
import {uint8ArrayToArrayBuffer, escapeHtml} from './utils.js';

const svgMimeType = 'image/svg+xml';

/* const _getProxyUrl = src => {
  const parsedUrl = new URL(src);
  parsedUrl.host = parsedUrl.host.replace(/-/g, '--');
  return 'https://' + parsedUrl.origin.replace(/^(https?):\/\//, '$1-').replace(/:([0-9]+)$/, '-$1').replace(/\./g, '-') + '.proxy.exokit.org' + parsedUrl.pathname + parsedUrl.search;
}; */

const canvas = document.createElement('canvas');
canvas.width = 2048;
canvas.height = 2048;
const ctx = canvas.getContext('2d');
// ctx.fillStyle = 'white';
// ctx.fillRect(0, 0, canvas.width, canvas.height);
// ctx.translate(0, canvas.height);
// ctx.scale(1, -1);

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
const textEncoder = new TextEncoder();

const _loadImage = b => new Promise((accept, reject) => {
  const _cleanup = () => {
    URL.revokeObjectURL(u);
  };
  
  const u = URL.createObjectURL(b);
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = u;
  img.onload = () => {
    accept(img);
    _cleanup();
  };
  img.onerror = err => {
    reject(err);
    _cleanup();
  };
});
const convertCanvas = document.createElement('canvas');
const _imgToImageData = img => {
  // console.log('got image spec', img.width, img.height, img.naturalWidth, img.naturalHeight);
  convertCanvas.width = img.naturalWidth;
  convertCanvas.height = img.naturalHeight;
  const ctx = convertCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, convertCanvas.width, convertCanvas.height);
  return imageData;
};
const _getImageDataString = async u => {
  // console.time('lol 1 ' + u);
  const res = await fetch(u);
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  // console.timeEnd('lol 1 ' + u);
  // console.time('lol 2 ' + u);
  const s = `data:image/png;base64,` + uint8ArrayToArrayBuffer(uint8Array);
  // console.timeEnd('lol 2 ' + u);
  return s;
};

const imgCache = new lruCache({
  max: 50,
});
const _getImgDataUrl = async src => {
  if (src && /^https?:/.test(src)) {
    const entry = imgCache.get(src);
    if (entry) {
      return entry;
    } else {
      const dataUrl = await new Promise((accept, reject) => {
        const newImg = new Image();
        newImg.crossOrigin = 'Anonymous';
        newImg.onload = () => {
          accept(newImg);
        };
        newImg.onerror = err => {
          console.warn(err);
          accept(null);
        };
        newImg.src = src;
      })
      .then(oldImg => {
        if (oldImg) {
          const canvas = document.createElement('canvas');
          canvas.width = oldImg.width;
          canvas.height = oldImg.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(oldImg, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          return dataURL;
        } else {
          return null;
        }
      });
      dataUrl && imgCache.set(src, dataUrl);
      return dataUrl;
    }
  } else {
    return src;
  }
};

window.render = (htmlString, templateData, width, height, transparent, bitmap) => new PCancelable((accept, reject, onCancel) => {
let cancelled = false;
onCancel(() => {
  cancelled = true;
});
(async () => {
  await waitForLoad();
  if (cancelled) return;
  
  const stylePrefix = getDefaultStyles();

  let error, result;
  try {
    const renderedHtmlString = templateData ? Mustache.render(htmlString, templateData) : htmlString;
    const dom = new DOMParser().parseFromString(renderedHtmlString, 'text/html');
    const {head, body} = dom;
    const html = body.parentNode;
    // console.log('got dom', html);

    const styles = [];
    Array.from(html.querySelectorAll('style')).forEach(style => {
      styles.push(style.textContent);
    });
    /* await Promise.all(Array.from(html.querySelectorAll('link')).map(link => new Promise((accept, reject) => {
      if (link.rel === 'stylesheet' && link.href) {
        fetch(link.href)
          .then(res => {
            if (res.status >= 200 && res.status < 300) {
              return res.text();
            } else {
              return Promise.reject(new Error(`invalid status code: ${res.status}`));
            }
          })
          .then(async s => {
            const regex = /(url\()([^\)]+)(\))/g;
            let match;
            while (match = regex.exec(s)) {
              const res = await fetch(match[2]);
              if (res.status >= 200 && res.status < 300) {
                const arraybuffer = await res.arrayBuffer();
                const b64 = base64.encode(arraybuffer);
                const inner = match[1] + '"data:font/woff;charset=utf-8;base64,' + b64 + '"' + match[3];
                s = s.slice(0, match.index) + inner + s.slice(match.index + match[0].length);
                regex.lastIndex = match.index + inner.length;
              } else {
                return Promise.reject(new Error(`invalid status code: ${res.status}`));
              }
            }

            // console.log('got style text', s);
            // const style = document.createElement('style');
            // style.textContent = s;
            // console.log('got style', style);
            styles.push(s);
          })
          .then(accept)
          .catch(err => {
            console.warn(err);
            accept();
          });
      } else {
        accept();
      }
    }))); */

    Array.from(html.querySelectorAll('script')).forEach(script => {
      script.parentNode.removeChild(script);
    });

    // console.log('got 2');

    await Promise.all(
      Array.from(html.querySelectorAll('img'))
        .map(async img => {
          const dataUrl = await _getImgDataUrl(img.src);
          /* if (!dataUrl) {
            console.warn('fail', img, img.src, dataUrl);
            debugger;
          } */

          await new Promise((accept, reject) => {
            const newImg = new Image();
            newImg.setAttribute('class', img.getAttribute('class'));
            newImg.onload = () => {
              img.replaceWith(newImg);
              accept();
            };
            newImg.onerror = err => {
              console.warn(err);
              accept();
            };
            newImg.src = dataUrl;
          });
        })
    );
    if (cancelled) return;

    // console.log('got 3');

    const o = await new Promise((accept, reject) => {
      const start = Date.now();

      const img = new Image();
      img.src = ('data:image/svg+xml;charset=utf-8,' +
        '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'' + width + '\' height=\'' + height + '\'>' +
          stylePrefix + 
          styles.map(style => '<style>' + style + '</style>').join('') +
          '<foreignObject width=\'100%\' height=\'100%\' x=\'0\' y=\'0\'' + (transparent ? '' : ' style=\'background-color: white;\'') + '>' +
            new XMLSerializer().serializeToString(body) +
          '</foreignObject>' +
        '</svg>').replace(/#/g, '%23');
      // .replace(/\n/g, '');
      // console.log('got src', img.src);
      // img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (cancelled) return;

        console.log('got img time', Date.now() - start);

        const {naturalWidth: width, naturalHeight: height} = img;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        (() => {
          if (!bitmap) {
            let {data} = imageData;
            data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            return Promise.resolve(data);
          } else {
            return createImageBitmap(imageData);
          }
        })().then(data => {
          if (cancelled) return;

          document.head.appendChild(head);
          document.body.appendChild(body);

          const anchors = ['a', 'nav', 'input']
            .flatMap(q => Array.from(body.querySelectorAll(q)))
            .map(el => {
              const {id, href, name} = el;
              if (!id && !href) {
                console.warn('anchor missing id or href', el);
              }
              const rect = JSON.parse(JSON.stringify(el.getBoundingClientRect()));
              return Object.assign(rect, {id, href, name});
            });

          document.head.removeChild(head);
          document.body.removeChild(body);

          accept([null, {width, height, data, anchors}]);
        }, err => {
          if (cancelled) return;

          accept([err.stack, null]);
        });
      };
      img.onerror = err => {
        console.warn('img error', err);
        accept([err.stack, null]);
      };
    });
    if (cancelled) return;

    // console.log('got 4', !!error, !!result);

    error = o[0];
    result = o[1];
  } catch (err) {
    error = err.stack;
  }

  return {error, result};
})()
  .then(accept, reject);
});
window.renderPopup = (
  name,
  tokenId,
  type,
  hash,
  description,
  imgUrl,
  minterUsername,
  ownerUsername,
  minterAvatarUrl,
  ownerAvatarUrl,
) => new PCancelable((accept, reject, onCancel) => {
let cancelled = false;
onCancel(() => {
  cancelled = true;
});
const logTiming = false;
(async () => {
  await waitForLoad();
  if (cancelled) return;

  let error, result;
  try {
    if (logTiming) {
      console.time('render 1');
    }

    const {
      s,
      doc,
      minterImageData,
      ownerImageData,
    } = await (async () => {
      const [
        {
          s,
          doc,
        },
        minterImageData,
        ownerImageData,
      ] = await Promise.all([
        (async () => {
          const res = await fetch(imgUrl);
          const s = await res.text();
          const doc = domParser.parseFromString(s, svgMimeType);
          return {s, doc};
        })(),
        _getImageDataString(minterAvatarUrl),
        _getImageDataString(ownerAvatarUrl),
      ]);
      return {
        s,
        doc,
        minterImageData,
        ownerImageData,
      };
    })();
    if (logTiming) {
      console.timeEnd('render 1');
    }
    if (cancelled) return;
    
    const _splitLines = (s, lineSize = 40) => {
      const ls = [];
      for (let i = 0; i < s.length; i += lineSize) {
        let l = s.slice(i, i + lineSize);
        l = l.replace(/^\s+/, '').replace(/\s+$/, '');
        ls.push(l);
      }
      return ls;      
    };
    
    const svg = doc.childNodes[1];
    document.body.appendChild(svg);
    
    const leftEl = svg.querySelector('#left');
    
    const middleEl = svg.querySelector('#middle');
    middleEl.childNodes[0].innerHTML = name;
    middleEl.childNodes[1].innerHTML = tokenId;
    middleEl.childNodes[2].innerHTML = type;
    middleEl.childNodes[3].innerHTML = hash;
    
    // console.log('got left el', leftEl);
    {
      const textNode = middleEl.childNodes[4];
      const bbox = textNode.getBBox();
      textNode.parentNode.removeChild(textNode);
      const descriptionLines = _splitLines(description);
      // console.log('got box', bbox, descriptionLines);
      for (let i = 0; i < descriptionLines.length; i++) {
        const s = descriptionLines[i];
        const el = textNode.cloneNode();
        // console.log('got el', el, middleEl.childNodes);

        el.innerHTML = escapeHtml(s);
        const y = bbox.y + (i * bbox.height) + bbox.height;
        // console.log('got y', y, bbox.y, i, bbox.height);
        el.setAttribute('y', y);
        middleEl.appendChild(el);
      }
    }
    const rightEl = svg.querySelector('#right');
    rightEl.childNodes[1].innerHTML = 'noob';
    rightEl.childNodes[3].innerHTML = 'toob';
    
    if (logTiming) {
      console.time('render 2');
    }
    const creatorImageEl = svg.querySelector('#creator-image');
    creatorImageEl.setAttribute('xlink:href', minterImageData);
    
    const ownerImageEl = svg.querySelector('#owner-image')
    ownerImageEl.setAttribute('xlink:href', ownerImageData);
    if (logTiming) {
      console.timeEnd('render 2');
    }
    
    if (logTiming) {
      console.time('render 3');
    }
    doc.appendChild(svg);
    let s2 = xmlSerializer.serializeToString(doc);
    if (logTiming) {
      console.timeEnd('render 3');
    }
    
    if (logTiming) {
      console.time('render 4');
    }
    const stylePrefix = getDefaultStyles();
    s2 = s2.replace(/(<style)/, stylePrefix + '$1');
    if (logTiming) {
      console.timeEnd('render 4');
    }
    
    if (logTiming) {
      console.time('render 5');
    }
    const b = new Blob([
      s2,
    ], {
      type: svgMimeType,
    });
    // console.log('load image 1', b);
    const img = await _loadImage(b);
    if (cancelled) return;
    if (logTiming) {
      console.timeEnd('render 5');
    }
    
    if (logTiming) {
      console.time('render 6');
    }
    result = await createImageBitmap(img);
    if (logTiming) {
      console.timeEnd('render 6');
    }
  } catch (err) {
    console.warn(err);
    error = err.stack;
  }

  return {error, result};
})()
  .then(accept, reject);
});
window.renderContextMenu = (options, selectedOptionIndex, width, height) => new PCancelable((accept, reject, onCancel) => {
let cancelled = false;
onCancel(() => {
  cancelled = true;
});
(async () => {
  await waitForLoad();
  if (cancelled) return;
  
  const stylePrefix = getDefaultStyles();
  const transparent = true;

  let error, result;
  try {
    const styleString = `\
      body {
        display: flex;
        width: 100%;
        height: 100%;
        flex-direction: column;
      }
      .options {
        display: flex;
        width: 100%;
        flex-direction: column;
        background-color: #111;
        border-radius: 15px;
        padding: 5px;
        flex: 1;
      }
      .options .option {
        padding: 20px;
        background-color: #333;
        border-radius: 15px;
        font-family: RobotoCondensed-Regular;
        font-size: 24px;
        color: #FFF;
      }
      .options .option + .option {
        margin-top: 5px;
      }
      .options .option.selected {
        background-color: #42a5f5;
      }
      .options .bar {
        margin: 10px 0;
        /* border-bottom: 2px solid #666; */
      }
    `;
    const renderedHtmlString = `\
      <style>
        ${styleString}
      </style>
      <div class="options">
        ${options.map((option, i) => option ? `\
          <a class="option ${i === selectedOptionIndex ? 'selected' : ''}" id=${option}>
            <div id="${option}">${option}</div>
          </a>
        ` : `\
          <div class="bar"></div>
        `).join('\n')}
      </div>
    `;
    const dom = new DOMParser().parseFromString(renderedHtmlString, 'text/html');
    const {head, body} = dom;
    const html = body.parentNode;
    // console.log('got dom', html);

    const styles = [];
    Array.from(html.querySelectorAll('style')).forEach(style => {
      styles.push(style.textContent);
    });
    /* await Promise.all(Array.from(html.querySelectorAll('link')).map(link => new Promise((accept, reject) => {
      if (link.rel === 'stylesheet' && link.href) {
        fetch(link.href)
          .then(res => {
            if (res.status >= 200 && res.status < 300) {
              return res.text();
            } else {
              return Promise.reject(new Error(`invalid status code: ${res.status}`));
            }
          })
          .then(async s => {
            const regex = /(url\()([^\)]+)(\))/g;
            let match;
            while (match = regex.exec(s)) {
              const res = await fetch(match[2]);
              if (res.status >= 200 && res.status < 300) {
                const arraybuffer = await res.arrayBuffer();
                const b64 = base64.encode(arraybuffer);
                const inner = match[1] + '"data:font/woff;charset=utf-8;base64,' + b64 + '"' + match[3];
                s = s.slice(0, match.index) + inner + s.slice(match.index + match[0].length);
                regex.lastIndex = match.index + inner.length;
              } else {
                return Promise.reject(new Error(`invalid status code: ${res.status}`));
              }
            }

            // console.log('got style text', s);
            // const style = document.createElement('style');
            // style.textContent = s;
            // console.log('got style', style);
            styles.push(s);
          })
          .then(accept)
          .catch(err => {
            console.warn(err);
            accept();
          });
      } else {
        accept();
      }
    }))); */

    /* Array.from(html.querySelectorAll('script')).forEach(script => {
      script.parentNode.removeChild(script);
    }); */

    // console.log('got 2');

    await Promise.all(
      Array.from(html.querySelectorAll('img'))
        .map(async img => {
          const dataUrl = await _getImgDataUrl(img.src);
          /* if (!dataUrl) {
            console.warn('fail', img, img.src, dataUrl);
            debugger;
          } */

          await new Promise((accept, reject) => {
            const newImg = new Image();
            newImg.setAttribute('class', img.getAttribute('class'));
            newImg.onload = () => {
              img.replaceWith(newImg);
              accept();
            };
            newImg.onerror = err => {
              console.warn(err);
              accept();
            };
            newImg.src = dataUrl;
          });
        })
    );
    if (cancelled) return;

    // console.log('got 3');

    const o = await new Promise((accept, reject) => {
      const start = Date.now();

      const img = new Image();
      img.src = ('data:image/svg+xml;charset=utf-8,' +
        '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'' + width + '\' height=\'' + height + '\'>' +
          stylePrefix + 
          styles.map(style => '<style>' + style + '</style>').join('') +
          '<foreignObject width=\'100%\' height=\'100%\' x=\'0\' y=\'0\'' + (transparent ? '' : ' style=\'background-color: red;\'') + '>' +
            new XMLSerializer().serializeToString(body) +
          '</foreignObject>' +
        '</svg>').replace(/#/g, '%23');
      // .replace(/\n/g, '');
      // console.log('got src', img.src);
      // img.crossOrigin = 'Anonymous';
      img.onload = async () => {
        if (cancelled) return;

        // console.log('got img time', Date.now() - start);

        const {naturalWidth: width, naturalHeight: height} = img;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const imageBitmap = await createImageBitmap(imageData);
        /* (() => {
          if (!bitmap) {
            let {data} = imageData;
            data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            return Promise.resolve(data);
          } else {
            return createImageBitmap(imageData);
          }
        })().then(data => { */
        if (cancelled) return;

        document.head.appendChild(head);
        document.body.appendChild(body);
        document.body.style.width = `${width}px`;
        document.body.style.height = `${height}px`;

        const anchors = ['a', 'nav', 'input']
          .flatMap(q => Array.from(body.querySelectorAll(q)))
          .map(el => {
            const {id, href, name} = el;
            if (!id && !href) {
              console.warn('anchor missing id or href', el);
            }
            const rect = JSON.parse(JSON.stringify(el.getBoundingClientRect()));
            return Object.assign(rect, {id, href, name});
          });

        document.head.removeChild(head);
        document.body.removeChild(body);
        document.body.style.width = null;
        document.body.style.height = null;

        accept([null, {width, height, imageBitmap, anchors}]);
        /* }, err => {
          if (cancelled) return;

          accept([err.stack, null]);
        }); */
      };
      img.onerror = err => {
        console.warn('img error', err);
        accept([err.stack, null]);
      };
    });
    if (cancelled) return;

    // console.log('got 4', !!error, !!result);

    error = o[0];
    result = o[1];
  } catch (err) {
    error = err.stack;
  }

  return {error, result};
})()
  .then(accept, reject);
});

let currentPromise = null;
const queue = [];
const _handleMessage = async data => {
  const {method} = data;

  // console.log('method', JSON.stringify(method));

  switch (method) {
    case 'render': {
      if (!currentPromise) {
        const {id, htmlString, templateData, width, height, transparent, bitmap, port} = data;
        const localCurrentPromise = currentPromise = window.render(htmlString, templateData, width, height, transparent, bitmap);
        localCurrentPromise.id = id;
        const o = await localCurrentPromise;
        if (localCurrentPromise === currentPromise) {
          const {error, result} = o;
          if (error || result) {
            port.postMessage({error, result}, [ArrayBuffer.isView(result.data) ? result.data.buffer : result.data]);
          }

          currentPromise = null;
          if (queue.length > 0) {
            _handleMessage(queue.shift());
          }
        }
      } else {
        queue.push(data);
      }
      break;
    }
    case 'cancel': {
      const {id} = data;
      if (currentPromise && currentPromise.id === id) {
        const localCurrentPromise = currentPromise;
        currentPromise = null;
        localCurrentPromise.cancel();

        if (queue.length > 0) {
          _handleMessage(queue.shift());
        }
      } else {
        const index = queue.findIndex(e => e.id === id);
        if (index !== -1) {
          queue.splice(index, 1);
        }
      }
      break;
    }
    case 'renderPopup': {
      // console.log('got renderPopup', data);
      
      if (!currentPromise) {
        const {
          id,
          name,
          tokenId,
          type,
          hash,
          description,
          imgUrl,
          minterUsername,
          ownerUsername,
          minterAvatarUrl,
          ownerAvatarUrl,
          transparent,
          port,
        } = data;
        
        const localCurrentPromise = currentPromise = window.renderPopup(
          name,
          tokenId,
          type,
          hash,
          description,
          imgUrl,
          minterUsername,
          ownerUsername,
          minterAvatarUrl,
          ownerAvatarUrl,
        );
        localCurrentPromise.id = id;
        const o = await localCurrentPromise;
        if (localCurrentPromise === currentPromise) {
          const {error, result} = o;
          if (error || result) {
            port.postMessage({error, result}, [result]);
          }

          currentPromise = null;
          if (queue.length > 0) {
            _handleMessage(queue.shift());
          }
        }
      } else {
        queue.push(data);
      }
      break;
    }
    case 'renderContextMenu': {
      // console.log('got renderContextMenu', data);
      
      if (!currentPromise) {
        const {
          id,
          options,
          selectedOptionIndex,
          width,
          height,
          port,
        } = data;
        
        const localCurrentPromise = currentPromise = window.renderContextMenu(
          options,
          selectedOptionIndex,
          width,
          height,
        );
        localCurrentPromise.id = id;
        const o = await localCurrentPromise;
        if (localCurrentPromise === currentPromise) {
          const {error, result} = o;
          if (error || result) {
            port.postMessage({error, result}, result ? [result.imageBitmap] : []);
          }

          currentPromise = null;
          if (queue.length > 0) {
            _handleMessage(queue.shift());
          }
        }
      } else {
        queue.push(data);
      }
      break;
    }
  }
};
window.addEventListener('message', e => {
  const {data} = e;
  if (data && data.method) {
    _handleMessage(data);
  }
});

/* window.onload = () => {
  const _recurse = () => {
    console.log('start work');
    let start = Date.now();
    for (;;) {
      if ((Date.now() - start) < 3000) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        document.body.removeChild(div);
      } else {
        break;
      }
    }
    setTimeout(_recurse, 1000);
    console.log('end work');
  };
  _recurse();
}; */