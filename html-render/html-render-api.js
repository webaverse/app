class HtmlRenderer {
  constructor() {
    const iframe = document.createElement('iframe');
    iframe.src = '/html-render/';
    iframe.style.cssText = `\
      position: absolute;
      top: -10000px;
      /* left: -10000px; */
      width: 4096px;
      height: 4096px;
      visibility: hidden;
      overflow: hidden;
    `;
    this.iframe = iframe;
    document.body.appendChild(iframe);
    
    this.ids = 0;
    
    this.loadPromise = (async () => {
      await new Promise((accept, reject) => { 
        iframe.addEventListener('load', e => {
         accept();
        });
        iframe.addEventListener('error', reject);
      });
    })();
  }
  destroy() {
    document.body.removeChild(this.iframe);
    this.iframe = null;
  }
  async waitForLoad() {
    return await this.loadPromise;
  }
  async render(htmlString) {
    const {contentWindow} = this.iframe;
    
    const messageChannel = new MessageChannel();
    const p = new Promise((accept, reject) => {
      messageChannel.port2.addEventListener('message', e => {
        // console.log('got render result', e.data.error, e.data.result);
        const {error, result} = e.data;
        if (!error) {
          accept(result);
        } else {
          reject(error);
        }
      });
    });
    messageChannel.port2.start();
    
    {
      const id = ++this.ids;
      const templateData = null;
      const width = canvas.width;
      const height = canvas.height;
      const transparent = true;
      const bitmap = null;
      const port = messageChannel.port1;
      // console.log('post message 1');
      contentWindow.postMessage({
        method: 'render',
        id,
        htmlString,
        templateData,
        width,
        height,
        transparent,
        bitmap,
        port,
      }, '*', [port]);
      // console.log('post message 2');
    }
    
    const result = await p;
    return result;
  }
  async renderPopup({
    name,
    tokenId,
    type,
    hash,
    description,
    minterUsername,
    ownerUsername,
    imgUrl,
    minterAvatarUrl,
    ownerAvatarUrl,
    transparent,
  }) {
    const {contentWindow} = this.iframe;
    
    const messageChannel = new MessageChannel();
    const p = new Promise((accept, reject) => {
      messageChannel.port2.addEventListener('message', e => {
        // console.log('got popup result', e.data.error, e.data.result);
        const {error, result} = e.data;
        if (!error) {
          accept(result);
        } else {
          reject(error);
        }
      });
    });
    messageChannel.port2.start();
    
    {
      const id = ++this.ids;
      const port = messageChannel.port1;
      // console.log('post message 1');
      contentWindow.postMessage({
        method: 'renderPopup',
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
      }, '*', [port]);
    }
    
    const result = await p;
    return result;
  }
  async renderContextMenu({
    width,
    height,
    options,
    selectedOptionIndex,
  }) {
    const {contentWindow} = this.iframe;
    // console.log('render context menu', options);
    
    const messageChannel = new MessageChannel();
    const p = new Promise((accept, reject) => {
      messageChannel.port2.addEventListener('message', e => {
        // console.log('got contextmenu result', e.data.error, e.data.result);
        const {error, result} = e.data;
        if (!error) {
          accept(result);
        } else {
          reject(error);
        }
      });
    });
    messageChannel.port2.start();
    
    {
      const id = ++this.ids;
      const port = messageChannel.port1;
      // console.log('post render context menu');
      contentWindow.postMessage({
        method: 'renderContextMenu',
        id,
        width,
        height,
        options,
        selectedOptionIndex,
        port,
      }, '*', [port]);
    }
    
    const result = await p;
    return result;
  }
}
export default HtmlRenderer;