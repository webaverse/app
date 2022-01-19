/* eslint-disable no-useless-escape */
const LoadTester = require('../loading/index');
const mlog = require('mocha-logger');
const {spawn} = require('child_process');
let {before, after, describe, it} = require('mocha');
const SeleniumDriver = require('../drivers/slenium');
const axios = require('axios');
const {readFileSync} = require('fs');
const {Builder, By, Key, until} = require('selenium-webdriver');
const path = require('path');

let error = false;
const url = process.env.URL || 'https://local.webaverse.com/?src=.%2Fscenes%2Fgrid.scn';
process.env.URL = url;
let appTester, testProcess;
describe = process.env.RUN_LOAD_TEST ? describe : describe.skip;
let driver;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/932642796530180146/U7i_TUmW8vxMI4rdIKO74r2jWxWt5EcGYPHb-dOQgczOmE41Nr59g3mT2jcewRMCw04J';

before(() => {
  return new Promise(resolve => {
    appTester = new LoadTester({
      slowMo: 0,
      host: url,
    });

    const stdout = require('child_process').execSync('git rev-parse HEAD').toString();
    appTester.addStatErr('HASH', stdout);
    console.log('Last commit hash on this branch is:', stdout);

    appTester.init().then(e => {
      resolve();
    }).catch(async e => {
      /** Close previous puppeteer instance */
      appTester.finish();
      /** Server don't exitst create one */
      process.chdir('..');
      testProcess = spawn('node', ['index.mjs', '-p']);
      testProcess.stderr.on('data', data => {
        //appTester.addStatErr('ERROR', data);
        console.log(`stderr: ${data}`);
      });
      testProcess.on('spawn', async function() {
        appTester.MochaIntercept = () => {
          error = true;
        };
        await appTester.init().catch(e => {
          testProcess.kill('SIGINT');
          process.exit(1);
        });
        driver = new SeleniumDriver();
        await appTester.finish();
        driver.init().then(_driver => {
          driver = _driver;
          resolve();
        }).catch(e => {
          testProcess.kill('SIGINT');
          process.exit(1);
        });
      });
    });
  });
});

after(() => {
  return new Promise(async resolve => {
    try {
      await driver.quit();
    } catch (e) {
      console.log(e);
    }
    testProcess.kill('SIGINT');
    axios.post(WEBHOOK_URL, {content: '\n' + readFileSync(path.resolve('./test/report')).toString()}).then(resolve).catch(() => process.exit(0));
  });
});
