/* eslint-disable no-new */
const puppeteer = require('puppeteer-extra');
const {performance} = require('perf_hooks');
const scenes = require('../../scenes/scenes.json');

const ignoreErrors=  [
  /** Internal ThreeJS error sometimes gets caught in the extendTexture */
  // 'at GLTFTextureTransformExtension.extendTexture'
];

let self;

class LoadTester {

  ignoreList = [
    'blob'
  ]


  timeOfLastRequest = 0;
  timeOfSecondLastRequest = 0;
  lastCheckedAt = 0;
  lastActivityAt = 0;

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

  waitForServerBoot = ()=>{
    let retries = 5;
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    return new Promise((resolve,reject)=>{

      let outInterval = setInterval(async () => {
        try{


              if(retries < 0){
                clearInterval(outInterval);
                return reject();  
              }

              const res = await fetch(self.config.host);
              if(res.ok){
                console.log('Webaverse is running tests. Sit tight! :)');
                clearInterval(outInterval);
                return resolve();  
              }

          
        }catch(e){
          console.warn(e);

        }finally{
          retries--;
        }
      }, 1000);
    });
  }
  

  waitForNetworkIdle = ()=>{
    self.timeOfSecondLastRequest = 0;
    self.timeOfLastRequest = 0;
    self.lastCheckedAt = 0;
    return new Promise((resolve)=>{

      let outInterval = setInterval(() => {
        try{
          if(self.timeOfLastRequest > 0  && self.timeOfSecondLastRequest > 0){
            //console.log(`Time Diff between last requests is `,self.timeOfLastRequest - self.timeOfSecondLastRequest,'s' , 'and last checked at' ,self.lastCheckedAt - self.lastActivityAt , 's');            
            if(self.lastCheckedAt - self.lastActivityAt > 10000){
              clearInterval(outInterval);
              resolve();
            }  
          }
          self.lastCheckedAt = performance.now();

          
        }catch(e){
          console.warn(e);
        }
      }, 400);
    });
  }

  requestFinishedListener = (request) => {
    this.timeOfSecondLastRequest = this.timeOfLastRequest;
    this.timeOfLastRequest = performance.now();
  };

  requestFailedListener = (request) => {
    this.timeOfSecondLastRequest = this.timeOfLastRequest;
    this.timeOfLastRequest = performance.now();
    this.stats.network.push(`Failed Request `+ request.url());
    this.MochaIntercept();
  };

  requestListener = (request) => {
    this.lastActivityAt = performance.now();

    request.continue();
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
    }catch(e){
      console.warn(e);
    }finally{
      try{
        self.stats.errors.push(value);
      }catch(e){
        console.warn(e);
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
    await this.waitForServerBoot();
    this.browser = await puppeteer.launch({
      headless: true, // change to false for debug
      defaultViewport: null,
      ignoreHTTPSErrors: true, 
      dumpio: false,
      args: [		
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

    this.page = await this.browser.newPage();

    await this.page.setDefaultNavigationTimeout(60000);

    this.page
      .on('console', message => {
        if (message.type().substr(0, 3).toUpperCase() === 'ERR') {
          this.addStat('ERROR', 'Page-Error: ' + message.text());
        }
      })
      .on('requestfailed', request => {
        this.addStat('NETWORK', `Request-Error: ${request.failure().errorText} ${request.url()}`);
      });

    await this.setupRequestInterception();

    await this.page.exposeFunction('PromiseIntercept', this.PromiseIntercept);

      await this.page.evaluateOnNewDocument(() => {
        Error.stackTraceLimit = 1000;
        ((Promise) => {

          let originalOnFailure;

          const customFailure = (onFailure)=>{
              if(typeof onFailure === 'function'){
                originalOnFailure = onFailure;
                return customFailureCaller;
              }else if(typeof originalOnFailure === 'function'){
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

  async setupRequestInterception(){
    await this.page.setRequestInterception(true);
    this.page.on('request',this.requestListener);
    this.page.on('requestfailed', this.requestFailedListener);
    this.page.on('requestfinished', this.requestFinishedListener);
  }

  async testScene(sceneUrl) {
    const t0 = performance.now();
    try{
      await this.page.goto(sceneUrl,{
        waitUntil: 'domcontentloaded',
      });

      await this.waitForNetworkIdle();

      await this.waitForLoadToComplete();
      
      const t1 = performance.now();
      this.addStat('PERFORMANCE', `Scene Loaded in ${Number(t1 - t0).toFixed(0) / 1000}s`);

    }catch(e){
      const t1 = performance.now();
      this.addStat('PERFORMANCE', `Failed to load scene at ${sceneUrl} in ${Number(t1 - t0).toFixed(0) / 1000}s`);
      /** Signa the Mocha Intercept */
      this.MochaIntercept();
    }
  }

  async test() {
    for (const scene of scenes) {
      const sceneUrl = `${this.config.host}?src=${this.config.host}/scenes/${scene}`;
      await this.testScene(sceneUrl);
      this.scenes.push(this.stats);
      this.stats = {
        errors: [],
        network: [],
        performance: [],
      };
    }

    try{
      this.finish();      
    }catch(e){
      console.warn(e);
      //finish may throw error;
    }
  }

  async run() {
    await this.init();
    await this.test();
  }

  constructor(config) {
    this.config = config;
    this.scenes = [];
    self = this;
    this.requestPromises = [];
  }

  async finish() {
    try{
      await this.browser.close();
    }catch(e){
      console.warn(e);
      //close may throw error;
    }
    this.browser = null;
  }
}


module.exports = LoadTester;
