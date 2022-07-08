import {storageHost} from './constants';

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
        reqUrl = `${storageHost}/ipfs/${hash}`;
    }
    var ssUrl = `${window.origin}/screenshot.html?url=${reqUrl}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

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