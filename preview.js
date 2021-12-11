import {inAppPreviewHost} from './constants';
import { makeId } from './util';
const mountPreviewApp = async () => {
  // check for existing iframe
  let iframe = document.querySelector(`iframe[src^="${inAppPreviewHost}"]`);
  // else create new iframe
  if (!iframe) {
    return new Promise((resolve, reject) => {
      const rejectTimeout = setTimeout(() => {
        // reject();
      }, 30000);
      const f = ({data}) => {
        if (data === 'PreviewAppLoaded') {
          clearTimeout(rejectTimeout);
          window.removeEventListener('message', f);
          resolve(iframe);
        }
      };
      window.addEventListener('message', f);

      iframe = document.createElement('iframe');
      iframe.width = '0px';
      iframe.height = '0px';

      iframe.setAttribute('name', 'preview-frame');
      document.body.appendChild(iframe);
      iframe.src = `${inAppPreviewHost}`;
    });
  }
  return iframe;
};

export const preview = async (url, ext, type, width, height) => {
  const previewRequest = makeId(8);

  const frame = await mountPreviewApp();
  frame.contentWindow.postMessage({
    method: 'preview',
    id: previewRequest,
    data: {url, ext, type, width, height},
  }, inAppPreviewHost);

  return new Promise((resolve, reject) => {
    const f = event => {
      if (event.data.id === previewRequest) {
        window.removeEventListener('message', f);
        resolve(event.data.data);
      }
    };
    window.addEventListener('message', f);
  });
};
