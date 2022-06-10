var assert = require('assert');
const LoadTester = require('./loading/index');
const mlog = require('mocha-logger');
const {spawn} = require('child_process');
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
};`;

async function setTestCase(url) {
  var cPath = path.join(__dirname, '..', 'public', 'testCase.mjs');
  await fs.writeFileSync(cPath, content);

  process.env.HTTP_ONLY = true;

  for (const scn of scenes) {
    var scenePath = path.join(__dirname, '..', 'scenes', scn);
    const data2 = fs.readFileSync(scenePath);

    var scene = JSON.parse(data2.toString());
    var check = scene.objects.find(key => key.start_url === `${url}/testCase.mjs`);

    if (!check) {
      var data = {
        position: [
          -10,
          0,
          -30,
        ],
        start_url: `${url}/testCase.mjs`,
      };
      scene.objects.push(data);
      fs.writeFileSync(scenePath, JSON.stringify(scene));
    }
  }
}

describe('Running Pupeeteer', function() {
  describe('Loading Test Suite', function() {
    it('Checking Scenes', async done => {
      let error = false;
      let url = process.env.URL || `http://localhost:${process.env.PORT || 3000}`;
      const appTester = new LoadTester({
        slowMo: 0,
        host: url,
      });

      require('child_process').exec('git rev-parse HEAD', function(_err, stdout) {
        console.log('Last commit hash on this branch is:', stdout);
        appTester.addStatErr('HASH', stdout);
      });

      await appTester.init().then(e => {
        process.exit(0);
      }).catch(async e => {
        url = `https://localhost:${process.env.PORT || 3000}`;
        /** Server don't exitst create one */
        await setTestCase(url);
        process.chdir('..');

        const testProcess = spawn('node', ['index.mjs']);

        testProcess.stdout.on('data', data => {
          console.log(`stdout: ${data}`);
        });

        testProcess.stderr.on('data', data => {
          appTester.addStatErr('ERROR', data);
          // console.log(`stderr: ${data}`);
        });

        testProcess.on('close', code => {
          assert.equal(error, false);
        });

        testProcess.on('exit', code => {
          assert.equal(error, false);
        });

        testProcess.on('spawn', async function() {
          appTester.MochaIntercept = () => {
            error = true;
          };

          try {
            await appTester.run();
          } catch (e) {
            mlog.log(e);
            // digest pupeteer crash error that comes up very rare.
          }

          testProcess.kill('SIGINT');
        });
      });
    });
  });
});
