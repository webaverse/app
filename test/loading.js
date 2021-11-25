var assert = require('assert');
const LoadTester = require('./loading/index');
const mlog = require('mocha-logger');
const { spawn } = require('child_process');
const scenes = require('../scenes/scenes.json');
const fs = require('fs');
var path = require('path');

const content = `import metaversefile from 'metaversefile';
const {useApp, usePhysics, useCleanup, useFrame, useActivate, useLoaders} = metaversefile;

export default () => {
    const app = useApp();

    setTimeout(() => {
      var evt = new CustomEvent("cEvent", {detail: "Any Object Here"});
      window.dispatchEvent(evt);
    }, 40 * 1000)
    //Dispatch an event
    
    return app;
  };`

async function setTestCase() {

  var cPath = path.join(__dirname, '..', 'public', 'testCase.mjs');
  await fs.writeFileSync(cPath, content);

  for (const scn of scenes) {
    var scenePath = path.join(__dirname, '..', 'scenes', scn);
    const data2 = fs.readFileSync(scenePath);

    var scene = JSON.parse(data2.toString());
    var check = scene.objects.find(key => key.start_url === 'http://localhost:3000/testCase.mjs')

    if(!check) {
      var data = {
        "position": [
          -10,
          0,
          -30
        ],
        "start_url": "http://localhost:3000/testCase.mjs"
      };
      scene.objects.push(data);
      fs.writeFileSync(scenePath, JSON.stringify(scene));
    }
  }
}

describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async (done) => {
      let error = false;
      const appTester = new LoadTester({
        slowMo: 0,
        host: 'http://localhost:3000',
      })

      require('child_process').exec('git rev-parse HEAD', function(err, stdout) {
        console.log('Last commit hash on this branch is:', stdout);
        appTester.addStatErr('HASH', stdout);
      });

      await setTestCase();

      process.chdir('..');

      const testProcess = spawn('node', ['index.mjs']);

      testProcess.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
      });

      testProcess.stderr.on('data', (data) => {
        appTester.addStatErr('ERROR', data)
        // console.log(`stderr: ${data}`);
      });

      testProcess.on('close', (code) => {
        assert.equal(error,false);
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
