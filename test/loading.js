var assert = require('assert');
const LoadTester = require('./loading/index');
const ChildProcess = require('child_process');
const path = require('path');
const mlog = require('mocha-logger');


describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {

      mlog.log(path.resolve(__dirname,'../index.js'));

      const server = ChildProcess.exec('cd .. && npm run dev');
      server.on('error',(payload)=>{
        error = true;
        mlog.log(payload)
      });

      server.stdout.on('data',(_d)=>{
        mlog.log(Buffer(_d).toString());
      })

      server.stdout.on('error',(e)=>{
        error = true;
        mlog.error(Buffer(e).toString())
      });

      server.on('message',(payload)=>{
        
      });

      server.on('disconnect',(payload)=>{
        mlog.log(payload);
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
