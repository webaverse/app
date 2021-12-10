import {storageHost} from './constants';

export const generatePreview = async (reqUrl, ext, type, width, height) => {

    // check for existing iframe
    var iframe = document.querySelector(`iframe[src^="${window.origin}/screenshot.html"]`);

    // else create new iframe
	if (!iframe) {
		iframe = document.createElement('iframe');
		iframe.width = '0px';
		iframe.height = '0px';
		document.body.appendChild(iframe);
	}

    // check either first param is url or hash
	if (!isValidURL(reqUrl)) {
		reqUrl = `${storageHost}/ipfs/${reqUrl}`;
	}

    // create URL
	var ssUrl = `${window.origin}/screenshot.html?url=${reqUrl}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

    // set src attr for iframe
	iframe.src = ssUrl;

    // event listener for postMessage from screenshot.js
	return new Promise(function(resolve) {
		var f = function(event) {
			if (event.data.method == "result") {
				window.removeEventListener("message", f, false);
				var blob = new Blob([event.data.result]);
				resolve(blob)
			}
		}
		window.addEventListener("message", f);
	});

}

// URL validate function
function isValidURL(string) {
	var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
	return (res !== null)
};