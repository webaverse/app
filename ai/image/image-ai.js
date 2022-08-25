import {loadImage, makeSquareImage, blob2img, img2canvas, canvas2blob} from '../../util.js';
import {imageAIEndpointUrl, imageCaptionAIEndpointUrl} from '../../constants.js';
import materialColors from '../../material-colors.json';
import ColorScheme from '../../color-scheme.js';

const baseColors = Object.keys(materialColors).map(k => materialColors[k][400].slice(1));
/* const baseColors = Object.keys(materialColors).map(k => {
  const v = materialColors[k];
  return Object.keys(v).map(k2 => {
    return v[k2].slice(1);
  });
}).flat(); */

// create a seeded random canvas with width, height,
// n random color rectangles around radius r with power distribution p
const createSeedImage = (
  w, // width
  h, // height
  rw, // radius width
  rh, // radius height
  p, // power distribution of radius
  n, // number of rectangles
  {
    color = null,
    monochrome = false,
    // blur = 0,
  } = {},
) =>{
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  // ctx.filter = blur ? `blur(${blur}px) saturate(1.5)` : '';
  
  const baseColor = color ?? baseColors[Math.floor(Math.random() * baseColors.length)];
  const scheme = new ColorScheme();
  scheme.from_hex(baseColor)
    .scheme(monochrome ? 'mono' : 'triade')   
    // .variation('hard');
  const colors = scheme.colors();

  for (let i = 0; i < n; i++) {
    const x = w / 2 + rng() * rw;
    const y = h / 2 + rng() * rh;
    const sw = Math.pow(Math.random(), p) * rw;
    const sh = Math.pow(Math.random(), p) * rh;
    // ctx.fillStyle = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
    ctx.fillStyle = '#' + colors[Math.floor(Math.random() * colors.length)];
    // ctx.fillStyle = '#' + baseColors[Math.floor(Math.random() * baseColors.length)];

    ctx.fillRect(x - sw / 2, y - sh / 2, sw, sh);

    /* const cx = x + sw / 2;
    const cy = y + sh / 2;
    const r = Math.random() * Math.PI * 2;

    ctx.translate(cx, cy);
    ctx.rotate(r);
    ctx.translate(-cx, -cy);

    ctx.fillRect(x - sw / 2, y - sh / 2, sw, sh);

    ctx.resetTransform(); */
  }

  return canvas;
};
const rng = () => (Math.random() * 2) - 1;

class ImageCreator {
  constructor() {
    this.debug = false;
  }
  setDebug(debug) {
    this.debug = debug;
  }
  #makeUnseededMethod({
    promptFn,
  }) {
    const self = this;

    return async function(
      name,
    ) {
      const prompt = promptFn(name);

      let img2 = await imageAI.txt2img(prompt);
      if (self.debug) {
        document.body.appendChild(img2); 
        img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
      }
      return img2;
    };
  }
  #makeSeededMethod({
    seedArgs: [
      w,
      h,
      rw,
      rh,
      p,
      n,
      seedOptions,
    ],
    promptFn,
  }) {
    const self = this;

    return async function(
      name,
    ) {
      const canvas = createSeedImage(
        w,
        h,
        rw,
        rh,
        p,
        n,
        seedOptions,
      );
      const prompt = promptFn(name);
      if (self.debug) {
        document.body.appendChild(canvas);
        canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
      }
      let img2 = await imageAI.img2img(canvas, prompt);
      if (self.debug) {
        document.body.appendChild(img2);
        img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
      }
      return img2;
    };
  }
  makeCharacter = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 128, 1, 256],
    promptFn() {
      return `anime style video game character concept, full body`;
    },
  })
  makeBackpack = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 128, 1, 256],
    promptFn(name = 'backpack') {
      return `video game item concept render, ${name}`;
    },
  })
  makeSword = this.#makeSeededMethod({
    seedArgs: [512, 512, 32, 128, 1, 256, {
      // monochrome: true,
    }],
    promptFn(name = 'huge sword') {
      return `video game item concept render, ${name}`;
    },
  })
  makeRifle = this.#makeSeededMethod({
    seedArgs: [512, 512, 128, 64, 1, 256],
    promptFn(name = 'rifle') {
      return `video game item concept art render, ${name}`;
    },
  })
  makePistol = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 64, 1, 256],
    promptFn(name = 'pistol') {
      return `video game item concept art render, ${name}`;
    },
  })
  makePotion = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 64, 1, 256],
    promptFn(name = 'potion') {
      return `video game item concept art render, ${name}`;
    },
  })
  makeChestArmor = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 128, 1, 256],
    promptFn(name = 'chest armor') {
      return `video game item concept art, ${name}`;
    },
  })
  makeLegArmor = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 128, 1, 256],
    promptFn(name = 'leg armor') {
      return `video game item concept art, ${name}`;
    },
  })
  makeHelmet = this.#makeSeededMethod({
    seedArgs: [512, 512, 64, 64, 1, 256],
    promptFn(name = 'helmet') {
      return `video game item concept art, ${name}`;
    },
  })
  makeLocation = this.#makeUnseededMethod({
    promptFn(name = 'magical jungle') {
      return `anime style video game location concept art, screenshot, without text, ${name}`;
    },
  })
  makeMap = this.#makeUnseededMethod({
    promptFn(name = 'sakura forest') {
      return `anime style map page side render, without text, trending on ArtStation, ${name}`;
    },
  })
}

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
    transferType = 'image/jpeg',
  } = {}) {
    if (typeof image === 'string') {
      image = await loadImage(image);
    }
    const canvas = makeSquareImage(image);
    const blob = await canvas2blob(canvas, transferType);

    // document.body.appendChild(canvas);
    // canvas.style.cssText = `position: absolute; top: 0; left: 512px; z-index: 100;`;

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
  async img2txt(image, {
    transferType = 'image/jpeg',
  } = {}) {
    const blob = await (async () => {
      if (typeof image === 'string') {
        const res = await fetch(image);
        const blob = await res.blob();
        return blob;
      } else if (image instanceof HTMLImageElement) {
        const canvas = img2canvas(image);
        const blob = await canvas2blob(canvas, transferType);
        return blob;
      } else if (image instanceof HTMLCanvasElement) {
        const blob = await canvas2blob(image, transferType);
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
  creator = new ImageCreator();
}
const imageAI = new ImageAI();
// globalThis.imageAI = imageAI; // XXX hack
/* globalThis.makeCharacter = async () => {
  let canvas = createSeedImage(512, 512, 64, 128, 1, 256);
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `anime style video game character concept, full body`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// backpack
globalThis.makeBackpack = async (name = 'backpack') => {
  let canvas = createSeedImage(512, 512, 64, 128, 1, 256);
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept render, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// sword
globalThis.makeSword = async (name = 'huge sword') => {
  let canvas = createSeedImage(512, 512, 32, 128, 1, 256, {
    // monochrome: true,
  });
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art render, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// rifle
globalThis.makeRifle = async (name = 'assault rifle') => {
  let canvas = createSeedImage(512, 512, 128, 64, 1, 256, {
    // monochrome: true,
  });
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art render, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// pistol
globalThis.makePistol = async (name = 'pistol') => {
  let canvas = createSeedImage(512, 512, 64, 64, 1, 256, {
    // monochrome: true,
  });
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art render, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// potion
globalThis.makePotion = async (name = 'potion') => {
  let canvas = createSeedImage(512, 512, 64, 64, 1, 256, {
    // monochrome: true,
  });
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// chest armor
globalThis.makeChestArmor = async (name = 'chest armor') => {
  let canvas = createSeedImage(512, 512, 64, 128, 1, 256);
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// leg armor
globalThis.makeLegArmor = async (name = 'leg armor') => {
  let canvas = createSeedImage(512, 512, 64, 128, 1, 256);
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// helmet
globalThis.makeHelmet = async (name = 'helmet') => {
  let canvas = createSeedImage(512, 512, 64, 64, 1, 256);
  document.body.appendChild(canvas);
  canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.img2img(canvas, `video game item concept art, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// location
globalThis.makeLocation = async (name = 'magical jungle') => {
  // let canvas = imageAI.createSeedImage(512, 512, 256, 256, 2, 256);
  // document.body.appendChild(canvas);
  // canvas.style.cssText = `position: absolute; top: 0; left: 0; z-index: 100;`;
  let img2 = await imageAI.txt2img(`anime style video game location concept art, screenshot, without text, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
};
// map
globalThis.makeMap = async (name = 'mysterious forest labyrinth') => {
  let img2 = await imageAI.txt2img(`anime style map side render, without text, trending on ArtStation, ${name}`);
  document.body.appendChild(img2);
  img2.style.cssText = `position: absolute; top: 0; right: 0; z-index: 100;`;
  return img2;
}; */
export default imageAI;