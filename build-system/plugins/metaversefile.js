const MetaverseFile = {
  name: '.metaversefile',
  setup: build => {
    build.onResolve({filter: /\.metaversefile$/}, args => {
      console.log(args);
    });
  },
};

module.exports = MetaverseFile;
