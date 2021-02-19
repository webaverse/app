import Model from '../model.js';
import {_loadItemSpec1} from '../../../../../../weapons-manager.js';

const items = [
  {
    name: 'Build',
    icon: './assets/noun_wall_3213150.svg',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Build</b> lets you build walls, floors, and structures.
      `,
    cb() {
      _loadItemSpec1('./assets/type/object.geo');
    },
  },
  {
    name: 'Model',
    icon: 'fa-alien-monster',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Model</b> lets you place a 3D model in GLTF format.
      `,
    cb() {
      _loadItemSpec1('./assets/type/robot.glb');
    },
  },
  {
    name: 'Avatar',
    icon: 'fa-user-ninja',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Avatar</b> lets you place an avatar model in VRM format.
      `,
    cb() {
      _loadItemSpec1('./assets/type/37023052771851054.vrm');
    },
  },
  {
    name: 'Image',
    icon: 'fa-image',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Image</b> lets you place a simple image billboard.
      `,
    cb() {
      _loadItemSpec1('./assets/type/Rainbow_Dash.png');
    },
  },
  {
    name: 'Audio',
    icon: 'fa-headphones',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Audio</b> lets you place spatial audio.
      `,
    cb() {
      _loadItemSpec1('./assets/type/br.mp3');
    },
  },
  {
    name: 'Voxel',
    icon: 'fa-cube',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Voxel</b> lets you place a voxel model in VOX format.
      `,
    cb() {
      _loadItemSpec1('./assets/type/square_hedge.vox');
    },
  },
  {
    name: 'Link',
    icon: 'fa-portal-enter',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Link</b> lets you create a web link portal.
      `,
    cb() {
      _loadItemSpec1('./assets/type/dcl.url');
    },
  },
  {
    name: 'Web Frame',
    icon: 'fa-browser',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Web Frame</b> lets you place a web content iframe.
      `,
    cb() {
      _loadItemSpec1('./assets/type/deviantart.iframe');
    },
  },
  {
    name: 'Media Stream',
    icon: 'fa-signal-stream',
    image: './assets/screenshot.jpg',
    details: `\
        <b>Media Stream</b> lets you stream audio, video, and screenshares.
      `,
    cb() {
      _loadItemSpec1('./assets/type/object.mediastream');
    },
  },
];

export default new Model({items});
