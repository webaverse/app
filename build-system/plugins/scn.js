const MetaverseFile = {
  name: '.metaversefile',
  setup: build => {
    console.log("SCN Plugin")
    build.onResolve({filter: /\.scn$/, namespace: 'file'}, args => {
      console.log("SCN FILES", args);
    });
  },
};

module.exports = MetaverseFile;
