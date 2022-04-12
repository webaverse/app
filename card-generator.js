import metaversefile from 'metaversefile';
import {generateStats, types} from './procgen/procgen.js';
import {screenshotObjectApp} from './object-screenshotter.js';
import {screenshotAvatarUrl} from './avatar-screenshotter.js';
import {generateGlyph} from './glyph-generator.js';

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
// const cardsSvgUrl = `${baseUrl}cards.svg`;
const cardsSvgUrl = `./images/cards-01.svg`;

let cardSvgSource = null;
const _loadCachedSvgSource = async () => {
  if (cardSvgSource === null) {
    const res = await fetch(cardsSvgUrl);
    cardSvgSource = await res.text();
  }
  return cardSvgSource;
};
const _waitForAllCardFonts = () => Promise.all([
  'FuturaLT',
  'MS-Gothic',
  'FuturaStd-BoldOblique',
  'GillSans',
  'GillSans-CondensedBold',
  'FuturaStd-Heavy',
  'FuturaLT-CondensedLight',
  'SanvitoPro-LtCapt',
  'FuturaLT-Book',
]
.map(fontFamily => document.fonts.load(`16px "${fontFamily}"`)))
.catch(err => {
  console.warn(err);
});

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

const _previewImage = (image, width, height) => {
  image.style.cssText = `\
    position: fixed;
    top: 0;
    left: 0;
    width: ${width}px;
    /* height: ${height}px; */
    z-index: 100;
  `;
  // console.log('got image', image);
  document.body.appendChild(image);
};

export const generateObjectUrlCard = async ({
  start_url,
  width = 300,
  height = 300,
}) => {
  const app = await metaversefile.createAppAsync({
    start_url,
  });
  return await generateObjectCard({
    app,
    width,
    height,
  });
};
export const generateObjectCard = async ({
  app,
  width = 300,
  height = 300,
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

  let objectImage = await screenshotObjectApp({
    app,
  });
  objectImage = await _getCanvasDataUrl(objectImage);

  let minterAvatarPreview = await screenshotAvatarUrl({
    start_url: `./avatars/4205786437846038737.vrm`,
  });
  minterAvatarPreview = await _getCanvasDataUrl(minterAvatarPreview);

  let glyphImage = generateGlyph(url);
  glyphImage = await _getCanvasDataUrl(glyphImage);

  // _previewImage(minterAvatarPreview, width, height);
  const minterUsername = 'Scillia';
  console.log('call generate card', {
    stats,
    width,
    name,
    description,
    objectImage,
    minterUsername,
    minterAvatarPreview,
    glyphImage,
  });
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
  });
  _previewImage(cardImg, width, height);
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
} = {}) => {
  const cardSvgSource = await _loadCachedSvgSource();
  await _waitForAllCardFonts();

  const cardHeight = cardWidth / 2.5 * 3.5;

  // console.log('card procgen', {name, description});

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

    /* {
      const lines = description.split('\n');
      const descriptionHeaderTextEl = el.querySelector('#description-header-text');
      descriptionHeaderTextEl.innerHTML = lines[0];
      const descriptionBodyTextEl = el.querySelector('#description-body-text');
      descriptionBodyTextEl.innerHTML = lines.slice(1).join('\n');
    } */
    {
      const linearGradientName = 'linear-gradient-120';
      const stopEls = el.querySelectorAll(`#${linearGradientName} > stop`);
      // const c = `stop-color:${spec.art.colors[0]}`;
      stopEls[1].style.cssText = `stop-color:${spec.art.colors[0]}`;
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

    const outerHTML = svg.outerHTML;
    // console.log('outer html', outerHTML);
    const blob = new Blob([outerHTML], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    image.src = url;

    function cleanup() {
      URL.revokeObjectURL(url);
    }
  });

  return image;
};