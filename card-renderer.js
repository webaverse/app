import metaversefile from 'metaversefile';
import {generateStats, types} from './procgen/procgen.js';
import {screenshotObjectApp} from './object-screenshotter.js';
import {screenshotAvatarUrl} from './avatar-screenshotter.js';
import {generateGlyph} from './glyph-generator.js';
import {splitLinesToWidth} from './util.js';
import {charactersSelectManager} from './characters-select-manager.js';

const cardsSvgUrl = `./images/cards-01.svg`;

const _loadSvg = async () => {
  const res = await fetch(cardsSvgUrl);
  const cardSvgSource = await res.text();
  return cardSvgSource;
};
let svgLoadPromise = null;
const _waitForSvgLoad = () => {
  if (svgLoadPromise === null) {
    svgLoadPromise = _loadSvg();
  }
  return svgLoadPromise;
};

const _loadFonts = () => Promise.all([
  'FuturaLT-Condensed',
  'GillSans-CondensedBold',
  'FuturaStd-Heavy',
  'PlazaITC-Normal',
  'MS-Gothic',
  'GillSans',
  'GillSans-ExtraBoldDisplay',
  'FuturaLT-CondensedBold',
  'SanvitoPro-Regular',
].map(fontFamily => document.fonts.load(`16px "${fontFamily}"`)))
.catch(err => {
  console.warn(err);
});
let fontsLoadPromise = null;
const _waitForFontsLoad = () => {
  if (fontsLoadPromise === null) {
    fontsLoadPromise = _loadFonts();
  }
  return fontsLoadPromise;
};

const _getCanvasBlob = canvas => new Promise((resolve, reject) => {
  canvas.toBlob(blob => {
    resolve(blob);
  });
});
const _getBlobDataUrl = async blob => new Promise((resolve, reject) => {
  const fileReader = new FileReader();
  fileReader.onload = () => {
    resolve(fileReader.result);
  };
  fileReader.onerror = reject;
  fileReader.readAsDataURL(blob);
});
const _getCanvasDataUrl = async canvas => {
  const blob = await _getCanvasBlob(canvas);
  const url = await _getBlobDataUrl(blob);
  return url;
};

/* const _previewImage = (image, width, height) => {
  image.style.cssText = `\
    position: fixed;
    top: 0;
    left: 0;
    width: ${width}px;
    z-index: 100;
  `;
  // console.log('got image', image);
  document.body.appendChild(image);
}; */

export const generateObjectUrlCard = async ({
  start_url,
  width = 300,
  // height = width,
  flipY = false,
  signal = null,
}) => {
  const app = await metaversefile.createAppAsync({
    start_url,
  });
  if (signal?.aborted) throw new Error();
  const result = await generateObjectCard({
    app,
    width,
    // height,
    flipY,
  });
  if (signal?.aborted) throw new Error();
  return result;
};
export const generateObjectCard = async ({
  app,
  width = 300,
  // height = width,
  flipY = false,
}) => {
  const stats = generateStats(app.contentId);
  const {
    name,
    description,
    contentId,
    appType,
  } = app;
  const url = contentId;
  const type = appType;

  const defaultCharacterSpec = await charactersSelectManager.getDefaultSpecAsync();
  const [
    objectImage,
    minterAvatarPreview,
    glyphImage,
  ] = await Promise.all([
    (async () => {
      let objectImage = await screenshotObjectApp({
        app,
      });
      objectImage = await _getCanvasDataUrl(objectImage);
      return objectImage;
    })(),
    (async () => {
      let minterAvatarPreview = await screenshotAvatarUrl({
        start_url: defaultCharacterSpec.avatarUrl,
      });
      minterAvatarPreview = await _getCanvasDataUrl(minterAvatarPreview);
      return minterAvatarPreview;
    })(),
    (async () => {
      let glyphImage = generateGlyph(url);
      glyphImage = await _getCanvasDataUrl(glyphImage);
      return glyphImage;
    })(),
  ]);

  const minterUsername = defaultCharacterSpec.name;
  const cardImg = await generateCard({
    stats,
    width,
    name,
    description,
    url,
    type,
    objectImage,
    minterUsername,
    minterAvatarPreview,
    glyphImage,
    flipY,
  });
  return cardImg;
};

export const generateCard = async ({
  stats: spec,
  width: cardWidth,
  name,
  description,
  url,
  type,
  objectImage,
  minterUsername,
  minterAvatarPreview,
  glyphImage,
  flipY,
} = {}) => {
  description = description || 'A great mystery.';
  
  const cardSvgSource = await _waitForSvgLoad();
  await _waitForFontsLoad();

  const cardHeight = cardWidth / 2.5 * 3.5;

  const svg = document.createElement('svg');
  svg.setAttribute('xmlns', `http://www.w3.org/2000/svg`);
  svg.setAttribute('width', cardWidth);
  svg.setAttribute('height', cardHeight);
  svg.innerHTML = cardSvgSource;

  {
    const el = svg;

    // name
    {
      const nameEl = el.querySelector('#name');
      nameEl.innerHTML = name;
    }

    // type
    {
      const typeEl = el.querySelector('#type');
      typeEl.innerHTML = type.toUpperCase();
    }

    // illustrator name
    {
      const illustratorNameEl = el.querySelector('#illustrator-name');
      illustratorNameEl.innerHTML = minterUsername;
    }

    // type icon
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const typeEl = el.querySelector('#type-' + type);
      typeEl.style.display = type === spec.stats.type ? 'block' : 'none';
    }

    // stat values
    [
      'level',
      'hp',
      'mp',
      'atk',
      'def',
      'mag',
      'spr',
      'dex',
      'lck',
    ].forEach(statName => {
      const statEl = el.querySelector('#' + statName + '-value');
      statEl.innerHTML = escape(spec.stats[statName] + '');
    });

    // main image
    {
      const mainImageEl = el.querySelector('#main-image');
      mainImageEl.setAttribute('xlink:href', objectImage);
    }

    // illustrator image
    {
      const illustartorImageEl = el.querySelector('#illustrator-image');
      illustartorImageEl.setAttribute('xlink:href', minterAvatarPreview);
    }

    // url
    {
      const urlEl = el.querySelector('#url');
      urlEl.innerHTML = url;
    }

    // glyph image
    {
      const glyphImageEl = el.querySelector('#glyph-image');
      glyphImageEl.setAttribute('image-rendering', 'pixelated');
      glyphImageEl.setAttribute('xlink:href', glyphImage);
    }

    {
      const descriptionEl = el.querySelector('#description');

      document.body.appendChild(svg);
      const bbox = descriptionEl.getBBox();
      const {width, height} = bbox;
      document.body.removeChild(svg);

      const font = '12px SanvitoPro-Regular';
      let description2 = splitLinesToWidth(description, font, width);
      if (description2.length > 2) {
        description2 = description2.slice(0, 2);
        description2[description2.length - 1] += '…';
      }

      descriptionEl.innerHTML = description2
        .map((l, i) => `<tspan x="0" y="${i * height * 1}">${l}</tspan>`)
        .join('');
    }

    {
      const linearGradientName = 'linear-gradient-120';
      const stopEls = el.querySelectorAll(`#${linearGradientName} > stop`);
      stopEls[1].style.cssText = `stop-color:${spec.art.colors[0]}80`;
      stopEls[3].style.cssText = `stop-color:${spec.art.colors[1]}`;
    }
  }

  const image = await new Promise((accept, reject) => {
    const image = document.createElement('img');
    image.onload = () => {
      accept(image);
      cleanup();
    };
    image.onerror = err => {
      reject(err);
      cleanup();
    };
    image.crossOrigin = 'Anonymous';

    const blob = new Blob([svg.outerHTML], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    image.src = url;

    function cleanup() {
      URL.revokeObjectURL(url);
    }
  });
  const imageBitmap = await createImageBitmap(image, {
    imageOrientation: flipY ? 'flipY' : 'none',
  });
  return imageBitmap;
};