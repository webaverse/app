var assert = require('assert');
const LoadTester = require('./loading/index');

describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {
      let error = false;
      const appTester = new LoadTester({
        slowMo: 0,
        host: 'https://app.webaverse.com',
      })

      appTester.MochaIntercept = ()=>{
        error = true;
      }

      await appTester.run();
      assert.equal(error,false);
      done();
    });
  });
});