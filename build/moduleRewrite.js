const path = require('path');
const fs = require('fs');

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

/**
 * TODO this will be calculated from package.json dynamically
 */
const _exports = require('../../../dist/exports.json');

module.exports = function replaceImport(originalPath, callingFileName, options) {
  /** remove extension to normalise the path */
  // let parsedPath = path.parse(originalPath);
  const replacedPath = _exports[originalPath] || _exports[originalPath + '.js'];
  originalPath = replacedPath ? `${process.env.MODULE_URL}${replacedPath}` : originalPath;
  const ext = path.parse(originalPath).ext;
  if (ext) {
    /** remove double extension from path */
    originalPath = originalPath.replace(ext + ext, ext);
  }

  return originalPath;
};
