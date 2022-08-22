import {loadImage, makeSquareImage, blob2img, canvas2blob} from '../../util.js';
import {imageAIEndpointUrl} from '../../constants.js';

class ImageAI {
  async txt2img(prompt, {
    n,
    noise,
  } = {}) {
    const url = new URL(imageAIEndpointUrl);
    url.pathname = '/image';
    url.searchParams.set('s', prompt);
    if (n !== undefined) {
      url.searchParams.set('n', n);
    }
    if (noise !== undefined) {
      url.searchParams.set('noise', noise);
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
}
const imageAI = new ImageAI();
export default imageAI;