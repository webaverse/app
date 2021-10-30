var assert = require('assert');
const LoadTester = require('./loading/index');
const mlog = require('mocha-logger');

describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {
      let error = false;
      const appTester = new LoadTester({
        slowMo: 0,
        host: 'https://localhost:3000',
      })

      appTester.MochaIntercept = ()=>{
        error = true;
      }

      await appTester.run();
      if(error){
        mlog.error(JSON.stringify(appTester.scenes,null, 5))
      }else{
        mlog.success(JSON.stringify(appTester.scenes,null, 5))
      }

      assert.equal(error,false);
      //done();
    });
  });
});