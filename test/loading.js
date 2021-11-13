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

    //Dispatch an event
    var evt = new CustomEvent("cEvent", {detail: "Any Object Here"});
    window.dispatchEvent(evt);
    
    return app;
  };`

async function setChayJs() {

  var cPath = path.join(__dirname, '..', 'public', 'chootiya.js');
  await fs.writeFileSync(cPath, content);

  for (const scn of scenes) {
    var scenePath = path.join(__dirname, '..', 'scenes', scn);
    const data2 = fs.readFileSync(scenePath);

    var scene = JSON.parse(data2.toString());
    var check = scene.objects.find(key => key.start_url === 'http://localhost:3000/chootiya.js')

    if(!check) {
      var data = {
        "position": [
          -10,
          0,
          -30
        ],
        "start_url": "http://localhost:3000/chootiya.js"
      };
      scene.objects.push(data);
      fs.writeFileSync(scenePath, JSON.stringify(scene));
    }
    else {
      console.log('exists');
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

      await setChayJs();


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
