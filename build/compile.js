import Babel from '@babel/core';

export const compile = (id, _code) => {
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
