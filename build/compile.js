import Babel from '@babel/core';
import fs from 'fs';
import nollup from '@prefresh/nollup';

const esbuildLoaders = ['js', 'jsx', 'mjs', 'cjs'];
const distDirectory = 'dist';
const baseDirectory = 'assets';
const relativeDistAssets = `./${distDirectory}/${baseDirectory}`;

const resolveEntryOfModule = _path => {
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

export const rewrite = (id, _code) => {
  const {code} = Babel.transform(_code, {
    plugins: [
      ['babel-plugin-custom-import-path-transform',
        {
          caller: id,
          transformImportPath: './build/moduleRewrite.js',
        }],
    ],
  });
  return code;
};

export const compile = node_module => {

};
