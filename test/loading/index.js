/* eslint-disable no-new */
const puppeteer = require('puppeteer-extra');
const {performance} = require('perf_hooks');
const scenes = require('../../scenes/scenes.json');

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


const ignoreErrors= [
  /** Internal ThreeJS error sometimes gets caught in the extendTexture */
  'at GLTFTextureTransformExtension.extendTexture'
]

let self;

module.exports = class LoadTester {

  ignoreList = [
    'blob'
  ]

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


  requestFinishedListener = (request) => {
    if (request.resolver) {
      request.resolver();
      delete request.resolver;
    }
  };

  requestFailedListener = (request) => {
    if (request.resolver) {
      request.resolver();
      delete request.resolver;
    }
    this.stats.network.push(`Failed Request `+ request.url());
  };

  requestListener = (request) => {
    if (request.resourceType() === 'xhr') {
      const index = ignoreList.indexOf(request.url());
      if (index < 0) {
      this.requestPromises.push(
        new Promise(resolve => {
          request.resolver = resolve;
        }),
      );
      }
    }
  };

  async waitForLoadToComplete() {
    if (this.requestPromises.length === 0) {
      return;
    }
    await Promise.all(this.requestPromises);
    this.requestPromises = [];
  }



  waitForRequests = (page, ignoreList) => {
    return;
    page.on('request', request => {
      if (request.resourceType() === "xhr") {
        // check if request is in observed list
        const index = ignoreList.indexOf(request.url());
        if (index < 0) {
        this.requestPromises.push(
          new Promise(resolve => {
            request.resolver = resolve;
          }),
        );
        }
      }
      request.continue();
    })
  }

  MochaIntercept(){

  }

  PromiseIntercept(value){
    let reportError = false;
    try{
      console.error('Promise Error Intercepted ',  JSON.parse(value,null, 4));
    }catch(e){
      console.error('Promise Error Intercepted ',  JSON.stringify(value));
    }finally{
      try{
        self.stats.errors.push(value);
      }catch(e){
        console.log('internal emit',e);
      }
    }
    for (const error of ignoreErrors) {
      if(typeof value !== 'string'){
        value = JSON.stringify(value);
      }
      if(value.includes(error)){
        reportError = true;
      }
    }

    if(reportError){
      self.MochaIntercept();
    }
    
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true, // change to false for debug
      defaultViewport: null,
      ignoreHTTPSErrors: true, 
      dumpio: false,
      args: [		
      // '--use-gl=egl',
      '--disable-gpu',
      '--enable-webgl',
      '--no-sandbox',
      '--enable-precise-memory-info',
      '--enable-begin-frame-control',
      '--enable-surface-synchronization',
      '--run-all-compositor-stages-before-draw',
      '--disable-threaded-animation',
      '--disable-threaded-scrolling',
      '--disable-checker-imaging'],
    });
    self = this;

    this.page = await this.browser.newPage();


    // this.devtools = await this.page.target().createCDPSession();
    // await this.devtools.send( 'HeadlessExperimental.enable' );
    // await this.devtools.send( 'HeapProfiler.enable' );

    await this.page.setDefaultNavigationTimeout(0);

    this.page
      .on('console', message => {
        if (message.type().substr(0, 3).toUpperCase() === 'ERR') {
          this.addStat('ERROR', 'Page-Error: ' + message.text());
        }
      })
      .on('requestfailed', request => {
        this.addStat('NETWORK', `Request-Error: ${request.failure().errorText} ${request.url()}`);
      });

    this.setupRequestInterception();

      await this.page.exposeFunction('PromiseIntercept', this.PromiseIntercept);

      await this.page.evaluateOnNewDocument(() => {
        Error.stackTraceLimit = 1000;
        ((Promise) => {

          let originalOnFailure;

          const customFailure = (onFailure)=>{
              if(typeof onFailure === 'function'){
                originalOnFailure = onFailure;
                // console.log('OnFailure was a function');
                return customFailureCaller;
              }else if(typeof originalOnFailure === 'function'){
                // console.log('originalOnFailure was a function',originalOnFailure);
                // console.log('onFailure was a value',onFailure);
                //PromiseIntercept(originalOnFailure.toString());                
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

  setupRequestInterception(){
    this.page.on('request',this.requestListener);
    this.page.on('requestfailed', this.requestFailedListener);
    this.page.on('requestfinished', this.requestFinishedListener);
  }

  async testScene(sceneUrl) {
    await sleep(5);
    const t0 = performance.now();
    try{
      this.page.goto(sceneUrl,{
        waitUntil: 'networkidle2',
        // timeout: 60000
      }).catch((e)=>{
        console.log(e);
      });
        
    }catch(e){

    }

    /** Wait for Request Fill in  */
    await sleep(15);

    await this.waitForLoadToComplete();

    //setupRequestInterception();

    const t1 = performance.now();
    this.addStat('PERFORMANCE', `Scene Loaded in ${(Number(t1 - t0).toFixed(0) / 1000)-15}s`);
  }

  async test() {
    for (const scene of scenes) {
      const sceneUrl = `${this.config.host}?src=${this.config.host}/scenes/${scene}`;
      await this.testScene(sceneUrl);
      console.log(scene, this.stats);
      this.scenes.push(this.stats);
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
    this.scenes = [];
    this.requestPromises = [];
  }

  async finish() {
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