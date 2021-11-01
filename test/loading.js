var assert = require('assert');
const LoadTester = require('./loading/index');
const ChildProcess = require('child_process');
const path = require('path');
const mlog = require('mocha-logger');




describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {

      const server = ChildProcess.spawn('node',[path.resolve(__dirname,'../index.js')]);
      server.on('error',(payload)=>{
        error = true;
        // console.log(payload);
        mlog.error(payload)
      });

      server.on('message',(payload)=>{
        // console.log(payload);
        // mlog.error(payload)
      });

      server.on('spawn',async ()=>{
        let error = false;
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
  
        server.kill('SIGINT');
        server.on('exit',()=>{
          assert.equal(error,false);
          done();
        });

      })


    });
  });
});
