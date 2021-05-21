import HtmlRenderer from './html-render-api.js';

const testImgUrl = 'https://app.webaverse.com/assets/popup3.svg';
const testUserImgUrl = `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?width=128&height=128`;

const _testPopup = async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  
  const result = await htmlRenderer.renderPopup({
    name: 'name',
    tokenId: 42,
    type: 'vrm',
    hash: 'hash',
    description: 'Test',
    minterUsername: 'avaer',
    ownerUsername: 'sacks',
    imgUrl: testImgUrl,
    minterAvatarUrl: testUserImgUrl,
    ownerAvatarUrl: testUserImgUrl,
  });
  console.log('got result', result);
  
  const canvas = document.getElementById('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  canvas.style.cssText = `\
    width: ${result.width / window.devicePixelRatio}px;
    width: ${result.height / window.devicePixelRatio}px;
  `;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(result, 0, 0);
};
const _testContextMenu = async () => {
  console.log('create renderer');
  const htmlRenderer = new HtmlRenderer();
  console.log('wait for load');
  await htmlRenderer.waitForLoad();
  
  const options = [
    'Lol',
    'Zol',
    null,
    'Cancel',
  ];
  const result = await htmlRenderer.renderContextMenu({
    options,
    width: 512,
    height: 512,
  });
  console.log('got result', result);
  
  const canvas = document.getElementById('canvas');
  canvas.width = result.width;
  canvas.height = result.height;
  canvas.style.cssText = `\
    width: ${result.width / window.devicePixelRatio}px;
    width: ${result.height / window.devicePixelRatio}px;
  `;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(result.imageBitmap, 0, 0);
};
// _testPopup();
_testContextMenu();