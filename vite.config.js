/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
import fs from 'fs';
import {transform} from 'esbuild';
import glob from 'glob';
import {dependencies} from './package.json';
import {copySync} from 'fs-extra';

const esbuildLoaders = ['js', 'jsx', 'mjs', 'cjs'];
let plugins = [
  // reactRefresh()
];

const distDirectory = 'dist';
const baseDirectory = 'assets';
const relativeDistAssets = `./${distDirectory}/${baseDirectory}`;
let appBuiltOnce = false;
const dontIncludeFiles = [
  'build/three.js',
  'build/three.min.js',
  'examples/js',
  'examples/fonts',
  'LICENSE',
  'package.json',
  'README.md',
  'src',
];

const entryPoints = [
  {
    path: './avatars/**/*.js',
    exclude: ['./avatars/avatars.js'],
    replaceExpression: '.',
    glob: true,
  },
  {
    path: './*worker.js',
    exclude: [],
    replaceExpression: '.',
    glob: true,
  },
];

// entryPoints = [];

const build = () => {
  const _entryPoints = [];
  const base = path.resolve('.', 'node_modules');
  const exportPaths = {};
  let toCopy = [

  ];

  const resolveEntryOfModule = _path => {
    console.log(_path);
    const packageJSON = JSON.parse(fs.readFileSync(path.resolve(base, _path, 'package.json')).toString());
    const moduleEntryFile = packageJSON.module || packageJSON.main || 'index.js';
    const entryPoint = `./${path.normalize(`node_modules/${_path}/${moduleEntryFile}`)}`;
    const hasBin = (() => {
      if (packageJSON.bin) {
        return `./${path.normalize(`node_modules/${_path}/${packageJSON.bin}`)}`;
      }
      return undefined;
    })();

    console.log('-- Resolved entry point at', moduleEntryFile);

    entryPoints.push({
      path: entryPoint,
      replaceExpression: './node_modules',
    });

    exportPaths[_path] = entryPoint.replace('./node_modules', baseDirectory);
    exportPaths[_path + '.meta'] = {
      moduleEntryFile,
      files: packageJSON.files,
    };

    if (packageJSON.files) {
      for (const file of packageJSON.files) {
        if (dontIncludeFiles.includes(file)) {
          continue;
        }
        const fp = path.join(base, _path, file);
        let isFile;
        try {
          isFile = fs.statSync(fp).isFile();
          if (isFile && !esbuildLoaders.includes(path.parse(fp).ext.replace('.', ''))) {
            console.log('---- Skipping file ', fp);
            continue;
          }
        } catch (error) {
          /** Definitely a blob */
          isFile = false;
        }
        const isEntryPoint = fp === entryPoint;

        if (isFile && !isEntryPoint) {
          entryPoints.push({
            path: `./${path.normalize(`node_modules/${_path}/${file}`)}`,
            replaceExpression: './node_modules',
          });
          console.log('---- Resolved file at', file);
        } else {
          entryPoints.push(
            {
              path: `./node_modules/${_path}/${file}/**/*.*`,
              replaceExpression: './node_modules',
              exclude: [entryPoint, hasBin],
              glob: true,
            },
          );
          console.log('---- Resolved folder at', file);
        }
      }
    } else {
      toCopy.push(
        {
          path: `./node_modules/${_path}/**/*.*`,
          replaceExpression: './node_modules',
          exclude: [entryPoint, hasBin],
          glob: true,
        },
      );
    }
  };

  const resolveGlob = pathToExpand => {
    return new Promise((resolve, reject) => {
      glob(pathToExpand, {}, (err, files) => {
        if (err) reject(err);
        resolve(files);
      });
    });
  };

  const copyfn = async () => {
    for (const toc of toCopy) {
      if (toc.glob) {
        const files = await resolveGlob(toc.path);
        for (const file of files) {
          console.log(`** Copying ${file}`);
          copySync(file, file.replace(toc.replaceExpression, relativeDistAssets), {
            overwrite: false,
          });
        }
      }
    }

    copySync('./scenes', './dist/scenes');
    copySync('./metaverse_modules', './dist/metaverse_modules');
    copySync('./metaverse_modules', './dist/metaverse_modules');
    copySync('./public', './dist/public');
  };

  const createESMTree = async esmIncludes => {
    const filesToCopy = [];
    const allFiles = [...(await resolveGlob('./!(deadcode|node_modules|test|packages|dist|metaverse_modules|public)/**/*.js')).map(file => {
      return path.resolve(process.cwd(), file);
    }), ...(await resolveGlob('./!(deadcode|node_modules|test|packages|dist|metaverse_modules|public)**.js')).map(file => {
      return path.resolve(process.cwd(), file);
    })];

    for (const file of allFiles) {
      if (!esmIncludes.has(file)) {
        filesToCopy.push(
          {
            path: `.${file.replace(process.cwd(), '')}`,
            replaceExpression: '.',
            glob: true,
          },
        );
      }
    }

    toCopy = [...filesToCopy, ...toCopy];
  };

  if (!appBuiltOnce) {
    for (const dependency in dependencies) {
      resolveEntryOfModule(dependency);
    }
  }

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
      if (!appBuiltOnce) {
        for (const iterator of entryPoints) {
          iterator.exclude = iterator.exclude || [];
          if (iterator.glob) {
            const files = await resolveGlob(iterator.path);
            for (const file of files) {
              const parseFile = path.parse(file);
              if (!iterator.exclude.includes(file) && esbuildLoaders.includes(parseFile.ext.replace('.', ''))) {
                const replacedPath = `${path.normalize(file.replace(iterator.replaceExpression, baseDirectory))}`;
                exportPaths[file.replace('./node_modules/', '')] = replacedPath;
                const entry = this.emitFile({
                  type: 'chunk',
                  id: file,
                  fileName: replacedPath,
                });
                _entryPoints.push(entry);
              }
            }
          } else {
            let _name = iterator.name;
            iterator.path = `./${path.normalize(iterator.path)}`;
            if (iterator.replaceExpression) {
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
      }
    },
    async generateBundle(options, bundle) {
      /** testing exports */

      if (!appBuiltOnce) {
        const exports = {
        };

        /** Refers to set of files included in the build */
        const esmTree = new Set();

        for (const modulePath of Object.keys(bundle)) {
          const module = bundle[modulePath];
          const absoluteModulePath = modulePath.facadeModuleId;

          if (module.exports) {
            for (const _export of module.exports) {
              exports[_export] = modulePath;
            }
          }

          if (!esmTree.has(absoluteModulePath)) {
            esmTree.add(absoluteModulePath);
          }

          if (module.modules) {
            for (const subModuleAbsolutePath in module.modules) {
              if (!esmTree.has(subModuleAbsolutePath)) {
                esmTree.add(subModuleAbsolutePath);
              }
            }
          }
        }

        if (process.env.OUTPUT_EXPORTS) {
          fs.writeFileSync('dist/dependencies.json', JSON.stringify(exports, null, 4));
          fs.writeFileSync('dist/actualBundle.json', JSON.stringify(bundle, null, 4));
        }

        /** ESM tree will help the application find the file
       * which are missed by the application in first phase of build
       * it may restart the build and push all files listed in
       * .esmcache/files.json to entry points. This is important for
       * workers and non - worker files that might have missed due to
       * first phase of build
       *  */
        await createESMTree(esmTree);

        await copyfn();

        fs.writeFileSync('dist/exports.json', JSON.stringify(exportPaths, null, 4));
        appBuiltOnce = true;
        return null;
      }
    },
    transform: (code, id) => {
      if (code.startsWith('#!/usr/bin/env node')) {
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

/** Use metaversefile if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([
  build(),
]);

/** Vite config for production */
const viteConfigProduction = {
  build: {
    polyfillModulePreload: false,
    format: 'es',
    target: 'esnext',
    ...(process.argv.find(a => a === '--watch') ? {
      watch: {
        clearScreen: true,
        include: '**/**',
        exclude: 'node_modules/**',
      },
    } : {}),
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
        manualChunks: undefined,
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