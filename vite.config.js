/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
import fs from 'fs';
import {transform} from 'esbuild';
import glob from 'glob';
import {dependencies} from './package.json';


const esbuildLoaders = ['js', 'jsx', 'mjs', 'cjs'];
let plugins = [
  // reactRefresh()
];

const baseDirectory = 'assets';

let entryPoints = [
  {
    path: './avatars/**/*.js',
    exclude: ['./avatars/avatars.js'],
    replaceExpression: '.',
    glob: true,
  },
];

//entryPoints = [];

const build = () => {
  const _entryPoints = [];
  const base = path.resolve('.', 'node_modules');
  const exportPaths = {};

  const resolveEntryOfModule = (_path) =>{
    console.log(_path);
    let packageJSON = JSON.parse(fs.readFileSync(path.resolve(base , _path, 'package.json')).toString());
    let moduleEntryFile = packageJSON.module || packageJSON.main || 'index.js';
    let entryPoint = `./${path.normalize(`node_modules/${_path}/${moduleEntryFile}`)}` ;
    let hasBin = (()=>{
      if(packageJSON.bin){
        return `./${path.normalize(`node_modules/${_path}/${packageJSON.bin}`)}`
      }
      return undefined;
    })()
    
    console.log('-- Resolved entry point at', moduleEntryFile);

    entryPoints.push({
      path:entryPoint,
      replaceExpression: './node_modules'
    });

    exportPaths[_path] = entryPoint.replace('./node_modules',baseDirectory);
    exportPaths[_path + '.meta'] = {
      moduleEntryFile,
      files: packageJSON.files
    }


    if(packageJSON.files){
      for (const file of packageJSON.files) {

        const fp = path.join(base,_path,file);
        let isFile; 
        try {
          isFile = fs.statSync(fp).isFile();
          if(isFile && !esbuildLoaders.includes(path.parse(fp).ext.replace('.',''))){
            console.log('---- Skipping file ',fp);
            continue;
          }         
        } catch (error) {
          /** Definitely a blob */
          isFile = false;
        }
        const isEntryPoint = fp === entryPoint;

        if(isFile && !isEntryPoint){
          entryPoints.push({
            path: `./${path.normalize(`node_modules/${_path}/${file}`)}`,
            replaceExpression: './node_modules'
          })
          console.log('---- Resolved file at', file);
        }else{
          entryPoints.push(
            {
              path: `./node_modules/${_path}/${file}/**/*.*`,
              replaceExpression: './node_modules',
              exclude: [entryPoint, hasBin],
              glob: true,
            }, 
          )
          console.log('---- Resolved folder at', file);         
        }
        
      }

    }

  }

  for (const dependency in dependencies) {
    resolveEntryOfModule(dependency);
    console.log('---------------------------');
  }

  // process.exit(0)

  const resolveGlob = pathToExpand => {
    return new Promise((resolve, reject) => {
      glob(pathToExpand, {}, (err, files) => {
        if (err) reject(err);
        resolve(files);
      });
    });
  };

  return {
    name: 'build-provider',
    post: true,
    renderDynamicImport({moduleId}) {
      if (moduleId.includes('metaversefile')) {
        return {
          left: 'import(`/@import/${',
          right: '}`)',
        };
      }
    },

    async buildStart() {
      for (const iterator of entryPoints) {
        iterator.exclude = iterator.exclude || [];
        if (iterator.glob) {
          const files = await resolveGlob(iterator.path);
          for (const file of files) {
            let parseFile = path.parse(file);
            if(!iterator.exclude.includes(file) && esbuildLoaders.includes(parseFile.ext.replace('.',''))){
              const replacedPath = `${path.normalize(file.replace(iterator.replaceExpression, baseDirectory))}`;
              exportPaths[file.replace('./node_modules/','')] = replacedPath;
              const entry = this.emitFile({
                type: 'chunk',
                id: file,
                fileName:replacedPath,
              });
              _entryPoints.push(entry);  
            }
          }
        } else {

          let _name = iterator.name;
          iterator.path = `./${path.normalize(iterator.path)}` 
          if(iterator.replaceExpression){
            _name = iterator.path.replace(iterator.replaceExpression, baseDirectory);
          }
          // console.log('Emitting', iterator);
          const entry = this.emitFile({
            type: 'chunk',
            id: iterator.path,
            fileName: _name,
          });
          _entryPoints.push(entry);
        }
      }
    },
    generateBundle(options, bundle) {
      /** testing exports */

      if (process.env.OUTPUT_EXPORTS) {
        const exports = {
        };

        for (const chunk of Object.keys(bundle)) {
          if (bundle[chunk].exports) {
            for (const _export of bundle[chunk].exports) {
              exports[_export] = chunk;
            }
          }
        }

        fs.writeFileSync('dist/dependencies.json', JSON.stringify(exports, null, 4));
        fs.writeFileSync('dist/actualBundle.json', JSON.stringify(bundle, null, 4));
      }
      fs.writeFileSync('dist/exports.json', JSON.stringify(exportPaths, null, 4));
      return null;
    },
    transform: (code, id) => {
      if(code.startsWith('#!/usr/bin/env node')){
        return code.replace(/[\s\n]*#!.*[\s\n]*/, '');
      }
      return null;
    },
    resolveImportMeta(property, {moduleId}) {
      /** Send force null to avoid import.meta transformation */
      return null;
    },
  };
};

/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([
  build(),
]);

/** Vite config for production */
const viteConfigProduction = {
  build: {
    polyfillModulePreload: false,
    format: 'es',
    target: 'esnext',
    manifest: true,
    minify: false,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      output: {
        // __vite_skip_esbuild__: true,
        exports: 'named',
        minifyInternalExports: false,
        format: 'es',
        strict: false,
        manualChunks: id => {
          if (id.includes('ceramic')) {
            return 'ceramic';
          }  
          else if (id.includes('web3.min.js')) {
            return 'web3';
          }
          else if (id.includes('metaverse-modules.js')) {
            return 'metaverse-modules';
          }
          else if (id.includes('app/util.js')) {
            return 'util';
          }

          //return 'app';
        },
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
};

const defaultConfig = {
  plugins,
  logLevel: 'info',
  server: {
    fs: {
      strict: true,
    },
  },
};

const config = {
  ...defaultConfig,
  ...process.env.NODE_ENV === 'production' ? viteConfigProduction : {},
};

console.log('Using Node Env', process.env.NODE_ENV);
console.log('Using Config', config);
console.log('Using Entry Points', entryPoints);

// https://vitejs.dev/config/
export default defineConfig(config);
