import {loadImage, makeSquareImage, blob2img, img2canvas, canvas2blob} from '../../util.js';
import {imageAIEndpointUrl, imageCaptionAIEndpointUrl} from '../../constants.js';

class ImageAI {
  async txt2img(prompt, {
    n,
    noise,
    clear,
    color,
  } = {}) {
    const url = new URL(imageAIEndpointUrl);
    if (!clear) {
      url.pathname = '/image';
    } else {
      url.pathname = '/mod';
    }
    url.searchParams.set('s', prompt);
    if (n !== undefined) {
      url.searchParams.set('n', n);
    }
    if (noise !== undefined) {
      url.searchParams.set('noise', noise);
    }
    if (color !== undefined) {
      url.searchParams.set('color', color);
    }

    const img = await loadImage(url);
    return img;
  }
  async img2img(image, prompt, {
    n,
    noise,
  } = {}) {
    if (typeof image === 'string') {
      image = await loadImage(image);
    }
    const canvas = makeSquareImage(image);
    const blob = await canvas2blob(canvas);

    const url = new URL(imageAIEndpointUrl);
    url.pathname = '/mod';
    url.searchParams.set('s', prompt);
    if (n !== undefined) {
      url.searchParams.set('n', n);
    }
    if (noise !== undefined) {
      url.searchParams.set('noise', noise);
    }

    const res = await fetch(url, {
      method: 'POST',
      body: blob,
    });
    const resultBlob = await res.blob();
    const resultImg = await blob2img(resultBlob);
    return resultImg;
  }
  async img2txt(image) {
    const blob = await (async () => {
      if (typeof image === 'string') {
        const res = await fetch(image);
        const blob = await res.blob();
        return blob;
      } else if (image instanceof HTMLImageElement) {
        const canvas = img2canvas(image);
        const blob = await canvas2blob(canvas);
        return blob;
      } else if (image instanceof HTMLCanvasElement) {
        const blob = await canvas2blob(image);
        return blob;
      } else {
        throw new Error('invalid image');
      }
    })();

    const url = new URL(imageCaptionAIEndpointUrl);
    url.pathname = '/caption';
    const res = await fetch(url, {
      method: 'POST',
      body: blob,
    });

    const text = await res.text();
    return text;
  }
}
const imageAI = new ImageAI();
globalThis.imageAI = imageAI;
export default imageAI;