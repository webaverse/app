import {storageHost} from './constants';
import url from 'url';

var adr = 'http://localhost:8080/default.htm?year=2017&month=february';
//Parse the address:
var q = url.parse(adr, true);
console.log(q);

var hash = 'QmfWz3evqUpRgNdX9WsU1h9EtDxVif3GP5q172DR4pqtRp';

let url2 = `${storageHost}/ipfs/${hash}`;
// console.log(url2);

export const getScreenshotBlob = async (reqUrl, ext, type, width, height) => {

    var iframeExists = document.getElementsByName('screenshotIframe');

    if(!iframeExists.length) {
        var iframe = document.createElement('iframe');
        iframe.width = '500px';
        iframe.height = '500px';
        iframe.name = 'screenshotIframe';
        document.body.appendChild(iframe);
    }

    reqUrl = url2;
    console.log('reqUrl', reqUrl)
    var ssUrl = `https://localhost:3000/screenshot.html?url=${reqUrl}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

    window.open(ssUrl, 'screenshotIframe')

    // var adr = 'http://localhost:8080/default.htm?year=2017&month=february';
    // var q = url.parse(adr, true);
    // console.log(q);

    // window.open('https://localhost:3000/screenshot.html?url=https://webaverse.github.io/assets/male.vrm&ext=vrm&type=png&width=100&height=100', 'screenshotIframe')

    // http://127.0.0.1/QmfWz3evqUpRgNdX9WsU1h9EtDxVif3GP5q172DR4pqtRp.png/preview.png

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

// const u = url.parse(req.url, true);
// const spec = (() => {

//   if(!u.search){
//       const match = u.pathname.match(/^\/([^\.]+)\.([^\/]+)\/([^\.]+)\.(.+)$/);
//       if (match) {
//         let hash = match[1];
//         let ext = match[2].toLowerCase();
//         let type = match[4].toLowerCase();
//         let url = `${storageHost}/ipfs/${hash}`;
//         let width = match[3]?.match(/(?<=\/)[\w+.-]+.+?(?=x)/)?.[0];
//         let height = match[3]?.match(/(?<=x)[\w+.-]+/)?.[0];
//         return {
//           url,
//           hash,
//           ext,
//           type,
//           width,
//           height
//         }
//       }
//   }else if(u.search){
//     return parseQuery(u.search);
//   }
//   return null;
// })();