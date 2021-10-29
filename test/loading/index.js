/* eslint-disable no-new */
const puppeteer = require('puppeteer-extra');
const {performance} = require('perf_hooks');
const scenes = require('../../scenes/scenes.json');

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

module.exports = class LoadTester {
  async addStat(type, stat) {
    if (!this.stats) {
      this.stats = {
        errors: [],
        network: [],
        performance: [],
      };
    }
    if (type === 'ERROR') {
      this.stats.errors.push(stat);
    } else if (type === 'NETWORK') {
      this.stats.network.push(stat);
    } else if (type === 'PERFORMANCE') {
      this.stats.performance.push(stat);
    } else {
      this.stats[type] = stat;
    }
  }

  PromiseIntercept(value){
    try{
      console.log('Promise Error Intercepted ',  JSON.parse(value,null, 4));
    }catch(e){
      console.log('Promise Error Intercepted ',  JSON.stringify(value));
    }finally{
      this.stats.errors.push(value);
    }
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true, // change to false for debug
      slowMo: this.config.slowMo,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
    });
    var self = this;

    this.page = await this.browser.newPage();
    await this.page.setDefaultNavigationTimeout(0);

    this.errorIndex = 0;
    this.page
      .on('console', message => {
        if (message.type().substr(0, 3).toUpperCase() === 'ERR') {
          this.addStat('ERROR', 'Page-Error: ' + message.text());
        }
      })
      .on('requestfailed', request => {
        this.addStat('NETWORK', `Request-Error: ${request.failure().errorText} ${request.url()}`);
      });

      await this.page.exposeFunction('PromiseIntercept', this.PromiseIntercept);

      await this.page.evaluateOnNewDocument(() => {
        ((Promise) => {

          let originalOnFailure;

          const customFailure = (onFailure)=>{
              if(typeof onFailure === 'function'){
                originalOnFailure = onFailure;
                console.log('OnFailure was a function');
                return customFailureCaller;
              }else if(typeof originalOnFailure === 'function'){
                console.log('originalOnFailure was a function',originalOnFailure);
                console.log('onFailure was a value',onFailure);
                PromiseIntercept(JSON.stringify(onFailure, Object.getOwnPropertyNames(onFailure)));
                return originalOnFailure(onFailure);
              }else if(typeof onFailure === 'object'){
                PromiseIntercept(JSON.stringify(onFailure, Object.getOwnPropertyNames(onFailure)));
                return onFailure;
              }
              return originalOnFailure || onFailure;
          }
      

          const customFailureCaller = (e) =>{
            PromiseIntercept(e);
            originalOnFailure(e);
          }

          var originalThen = Promise.prototype.then;
          Promise.prototype.then = function(onFulfilled, onFailure) {
             return originalThen.call(this, function(value) {
              if(onFulfilled){
                  return onFulfilled(value);   
              }
              if(onFailure){
                originalOnFailure = onFailure;
              }
             }, customFailure);
          };
      })(this.Promise)
      })
  }

  async testScene(sceneUrl) {
    const t0 = performance.now();

    await this.page.goto(sceneUrl, {
      waitUntil: 'networkidle0',
    });

    const t1 = performance.now();
    this.addStat('PERFORMANCE', `Street Scene Loaded in ${Number(t1 - t0).toFixed(0) / 1000}s`);
  }

  async test() {
    for (const scene of scenes) {
      const sceneUrl = `${this.config.host}?src=${this.config.host}/scenes/${scene}`;
      await this.testScene(sceneUrl);
      console.log(scene, this.stats);
      this.stats = {
        errors: [],
        network: [],
        performance: [],
      };
    }

    this.finish();
  }

  async run() {
    await this.init();
    await this.test();
  }

  constructor(config) {
    this.config = config;
  }

  async finish() {
    console.log(this.stats);
    this.browser.close();
    this.browser = null;
  }
}

// new LoadTester(
//   {
//     slowMo: 0,
//     host: 'http://localhost:3000',
//   },
// );