import {storageHost} from './constants';
import url from 'url';

function parseQuery(queryString) {
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
}

export const getScreenshotBlob = async (reqUrl, hash, ext, type, width, height) => {

    var iframeExists = document.getElementsByName('screenshotIframe');

    if(!iframeExists.length) {
        var iframe = document.createElement('iframe');
        iframe.width = '0px';
        iframe.height = '0px';
        iframe.name = 'screenshotIframe';
        document.body.appendChild(iframe);
    }

    if(hash) {
        var tempUrl = `https://app.webaverse.com/${hash}.${ext}/preview.${type}`
    }
    else {
        var tempUrl = `https://app.webaverse.com/screenshot.html?url=${reqUrl}&hash=${hash}&ext=${ext}&type=${type}&width=${width}&height=${height}`;
    }

    const u = url.parse(tempUrl, true);

    const spec = (() => {
        if(!u.search){
          const match = u.pathname.match(/^\/([^\.]+)\.([^\/]+)\/([^\.]+)\.(.+)$/);
          if (match) {
            let hash = match[1];
            let ext = match[2].toLowerCase();
            let type = match[4].toLowerCase();
            let url = `${storageHost}/ipfs/${hash}`;
            return {
              url,
              hash,
              ext,
              type
            }
          }
        }
        else if(u.search){
            return parseQuery(u.search);
        }
        spec = null;
    })();

    if (spec) {
        const {url, hash, ext, type, height, width} = spec;
        var ssUrl = `https://app.webaverse.com/screenshot.html?url=${url}&ext=${ext}&type=${type}&width=${width}&height=${height}`;
    }

    window.open(ssUrl, 'screenshotIframe')

    return new Promise(function (resolve) {

    var f = function(event){
        if(event.data.method == "result") {
            window.removeEventListener("message", f, false);
            var blob = new Blob([event.data.result]);
            resolve(blob)
        }
    }
    window.addEventListener("message", f);
    });

}