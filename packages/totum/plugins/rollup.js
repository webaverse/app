const path = require('path');
const fs = require('fs');
const url = require('url');
const fetch = require('node-fetch');
const mimeTypes = require('mime-types');
// const {resolveFileFromId, fetchFileFromId} = require('../util.js');
const {contractNames} = require('../constants.js');

const cryptovoxels = require('../contracts/cryptovoxels.js');
const moreloot = require('../contracts/moreloot.js');
const loomlock = require('../contracts/loomlock.js');
const contracts = {
  cryptovoxels,
  moreloot,
  loomlock,
};

/* const weba = require('../protocols/weba.js');
const protocols = {
  weba,
}; */

const jsx = require('../types/jsx.js');
const metaversefile = require('../types/metaversefile.js');
const glb = require('../types/glb.js');
const vrm = require('../types/vrm.js');
const vox = require('../types/vox.js');
const image = require('../types/image.js');
const gif = require('../types/gif.js');
const glbb = require('../types/glbb.js');
const gltj = require('../types/gltj.js');
const html = require('../types/html.js');
const scn = require('../types/scn.js');
const light = require('../types/light.js');
const text = require('../types/text.js');
//const fog = require('../types/fog.js');
// const background = require('../types/background.js');
const rendersettings = require('../types/rendersettings.js');
const spawnpoint = require('../types/spawnpoint.js');
const wind = require('../types/wind.js');
const lore = require('../types/lore.js');
const quest = require('../types/quest.js');
const npc = require('../types/npc.js');
const mob = require('../types/mob.js');
const react = require('../types/react.js');
const group = require('../types/group.js');
const directory = require('../types/directory.js');
const loaders = {
  js: jsx,
  jsx,
  metaversefile,
  glb,
  vrm,
  vox,
  png: image,
  jpg: image,
  jpeg: image,
  svg: image,
  gif,
  glbb,
  gltj,
  html,
  scn,
  light,
  text,
  // fog,
  // background,
  rendersettings,
  spawnpoint,
  lore,
  quest,
  npc,
  mob,
  react,
  group,
  wind,
  '': directory,
};
const upath = require('unix-path');

const dataUrlRegex = /^data:([^;,]+)(?:;(charset=utf-8|base64))?,([\s\S]*)$/;
const _getType = id => {
  id = id.replace(/^\/@proxy\//, '');
  
  const o = url.parse(id, true);
  // console.log('get type', o, o.href.match(dataUrlRegex));
  let match;
  if (o.href && (match = o.href.match(dataUrlRegex))) {
    let type = match[1] || '';
    if (type === 'text/javascript') {
      type = 'application/javascript';
    }
    let extension;
    let match2;
    if (match2 = type.match(/^application\/(light|text|rendersettings|spawnpoint|lore|quest|npc|mob|react|group|wind)$/)) {
      extension = match2[1];
    } else if (match2 = type.match(/^application\/(javascript)$/)) {
      extension = 'js';
    } else {
      extension = mimeTypes.extension(type);
    }
    // console.log('got data extension', {type, extension});
    return extension || '';
  } else if (o.hash && (match = o.hash.match(/^#type=(.+)$/))) {
    return match[1] || '';
  } else if (o.query && o.query.type) {
    return o.query.type;
  } else if (match = o.path.match(/\.([^\.\/]+)$/)) {
    return match[1].toLowerCase() || '';
  } else {
    return '';
  }
};

const _resolvePathName = (pathName , source) => {
  /**
   * This check is specifically added because of windows 
   * as windows is converting constantly all forward slashes into
   * backward slash
   */
  if(process.platform === 'win32'){
    pathName = pathName.replaceAll('\\','/').replaceAll('//','/');
    pathName = path.resolve(upath.parse(pathName).dir, source);
    /** 
     * Whenever path.resolve returns the result in windows it add the drive letter as well
     * Slice the drive letter (c:/, e:/, d:/ ) from the path and change backward slash 
     * back to forward slash.
     */
     pathName = pathName.slice(3).replaceAll('\\','/');
  }else{
    pathName = path.resolve(path.dirname(pathName), source);
  }
  return pathName;
}

const _resolveLoaderId = loaderId => {
  /**
   * This check is specifically added because of windows 
   * as windows is converting constantly all forward slashes into
   * backward slash
   */
  //console.log(loaderId);
  const cwd = process.cwd();
  if(process.platform === 'win32'){
    //if(loaderId.startsWith(cwd) || loaderId.replaceAll('/','\\').startsWith(cwd)){
    //  loaderId = loaderId.slice(cwd.length);
    //}else if(loaderId.startsWith('http') || loaderId.startsWith('https')){
    //  loaderId = loaderId.replaceAll('\\','/');
    //}
    loaderId = loaderId.replaceAll('\\','/');

    // if(loaderId.startsWith('http') || loaderId.startsWith('https')){
    //   loaderId = loaderId.replaceAll('\\','/');
    // }
  }
  return loaderId;
}

module.exports = function metaversefilePlugin() {
  return {
    name: 'metaversefile',
    enforce: 'pre',
    async resolveId(source, importer) {
      // do not resolve node module subpaths
      {
        if (/^((?:@[^\/]+\/)?[^\/:\.][^\/:]*)(\/[\s\S]*)$/.test(source)) {
          return null;
        }
      }

      // console.log('rollup resolve id', {source, importer});
      let replaced = false;
      if (/^\/@proxy\//.test(source)) {
        source = source
          .replace(/^\/@proxy\//, '')
          .replace(/^(https?:\/(?!\/))/, '$1/');
        replaced = true;
      }
      if (/^ipfs:\/\//.test(source)) {
        source = source.replace(/^ipfs:\/\/(?:ipfs\/)?/, 'https://cloudflare-ipfs.com/ipfs/');
        
        const o = url.parse(source, true);
        if (!o.query.type) {
          const res = await fetch(source, {
            method: 'HEAD',
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            const typeTag = mimeTypes.extension(contentType);
            if (typeTag) {
              source += `#type=${typeTag}`;
            } else {
              console.warn('unknown IPFS content type:', contentType);
            }
            // console.log('got content type', source, _getType(source));
          }
        }
      }

      let match;
      if (match = source.match(/^eth:\/\/(0x[0-9a-f]+)\/([0-9]+)$/)) {
        const address = match[1];
        const contractName = contractNames[address];
        const contract = contracts[contractName];
        const resolveId = contract?.resolveId;
        // console.log('check contract', resolveId);
        if (resolveId) {
          const source2 = await resolveId(source, importer);
          return source2;
        }
      }
      /* if (/^weba:\/\//.test(source)) {
        const {resolveId} = protocols.weba;
        const source2 = await resolveId(source, importer);
        return source2;
      } */
      
      const type = _getType(source);
      const loader = loaders[type];
      const resolveId = loader?.resolveId;
      if (resolveId) {
        const source2 = await resolveId(source, importer);
        // console.log('resolve rewrite', {type, source, source2});
        if (source2 !== undefined) {
          return source2;
        }
      }
      if (replaced) {
        // console.log('resolve replace', source);
        return source;
      } else {
        if (/^https?:\/\//.test(importer)) {
          o = url.parse(importer);
          if (/\/$/.test(o.pathname)) {
            o.pathname += '.fakeFile';
          }
          o.pathname = _resolvePathName(o.pathname,source);
          s = '/@proxy/' + url.format(o);
          // console.log('resolve format', s);
          return s;
        } else {
          // console.log('resolve null');
          return null;
        }
      }
    },
    async load(id) {
      id = id
        // .replace(/^\/@proxy\//, '')
        .replace(/^(eth:\/(?!\/))/, '$1/')
        // .replace(/^(weba:\/(?!\/))/, '$1/');
      
      let match;
      // console.log('contract load match', id.match(/^eth:\/\/(0x[0-9a-f]+)\/([0-9]+)$/));
      if (match = id.match(/^eth:\/\/(0x[0-9a-f]+)\/([0-9]+)$/)) {
        const address = match[1];
        const contractName = contractNames[address];
        const contract = contracts[contractName];
        const load = contract?.load;
        // console.log('load contract 1', load);
        if (load) {
          const src = await load(id);
          
          // console.log('load contract 2', src);
          if (src !== null && src !== undefined) {
            return src;
          }
        }
      }
      /* if (/^weba:\/\//.test(id)) {
        const {load} = protocols.weba;
        const src = await load(id);
        if (src !== null && src !== undefined) {
          return src;
        }
      } */
      
      // console.log('load 2');
      
      const type = _getType(id);
      const loader = loaders[type];
      const load = loader?.load;

      if (load) {
        id = _resolveLoaderId(id);
        const src = await load(id);
        if (src !== null && src !== undefined) {
          return src;
        }
      }
      
      // console.log('load 2', {id, type, loader: !!loader, load: !!load});
      
      if (/^https?:\/\//.test(id)) {
        const res = await fetch(id)
        const text = await res.text();
        return text;
      } else if (match = id.match(dataUrlRegex)) {
        // console.log('load 3', match);
        // const type = match[1];
        const encoding = match[2];
        const src = match[3];
        // console.log('load data url!!!', id, match);
        if (encoding === 'base64') {
          return atob(src);
        } else {
          return decodeURIComponent(src);
        }
      } else {
        return null;
      }
    },
    async transform(src, id) {
      const type = _getType(id);
      const loader = loaders[type];
      const transform = loader?.transform;
      if (transform) {
        return await transform(src, id);
      }
      return null;
    },
  };
}