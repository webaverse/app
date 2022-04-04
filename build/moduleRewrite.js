const path = require('path');
const fs = require('fs');

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
