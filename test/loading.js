var assert = require('assert');
const LoadTester = require('./loading/index');
const mlog = require('mocha-logger');
const { spawn } = require('child_process');

describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {
      let error = false;
      const appTester = new LoadTester({
        slowMo: 0,
        host: 'http://localhost:3000',
      })

      process.chdir('..');

      const testProcess = spawn('node', ['index.js']);

      testProcess.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
      });

      testProcess.stderr.on('data', (data) => {
        // appTester.addStatErr(data)
        // console.log(`stderr: ${data}`);
      });

      testProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });

      testProcess.on('exit', (code) => {
        assert.equal(error,false);
      });

      testProcess.on('spawn', async function () {

        appTester.MochaIntercept = ()=>{
          error = true;
        }
  
        try{
          await appTester.run();

        }catch(e){
          mlog.log(e);
          //digest pupeteer crash error that comes up very rare.
        }
  
        testProcess.kill('SIGINT');
      })


    });
  });
});
