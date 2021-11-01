var assert = require('assert');
const LoadTester = require('./loading/index');
const ChildProcess = require('child_process');
const path = require('path');
const mlog = require('mocha-logger');


describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {

      const appTester = new LoadTester({
        slowMo: 0,
        host: 'http://localhost:3000',
      })

      appTester.MochaIntercept = ()=>{
        error = true;
      }

      try{
        await appTester.run();
      }catch(e){
        //digest pupeteer crash error that comes up very rare.
      }


      if(error){
        mlog.error(JSON.stringify(appTester.scenes,null, 5))
      }else{
        mlog.success(JSON.stringify(appTester.scenes,null, 5))
      }

      assert.equal(error,false);
    });
  });
});
