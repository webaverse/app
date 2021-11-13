/* eslint-disable no-new */
const puppeteer = require('puppeteer-extra');
const {performance} = require('perf_hooks');
const scenes = require('../../scenes/scenes.json');
const axios = require('axios');

const ignoreErrors=  [
  /** Internal ThreeJS error sometimes gets caught in the extendTexture */
  // 'at GLTFTextureTransformExtension.extendTexture'
];

let self;

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class LoadTester {

  ignoreList = [
    'blob'
  ]


  timeOfLastRequest = 0;
  timeOfSecondLastRequest = 0;
  lastCheckedAt = 0;
  lastActivityAt = 0;

  // WEBHOOK_URL="https://discord.com/api/webhooks/908401493009391687/ZSmNJyB5ED9gPiNt0oBIDpAfSdBZJFSUhDFcP_0Q2vrfs-Mozh55uAlEJlvP1ngjlgjR"
  WEBHOOK_URL="https://discord.com/api/webhooks/908078345193930762/m7yVzm8QoTbjhNGJ9NXmOEJTeYSSY1wvX4GlypqLhaxK8MLKnOGiNw7BqXtKRX2z9pu0"

  addStatErr(stat) {
    if (!this.statsErr) {
      this.statsErr = [];
    }
    var data;
    var match = /\n/.exec(stat.toString());
    if (match) {
      data = `++++ **${this.scene_name}** ++++ [ERROR] ++++ File has thrown error \n ${stat} ++++ **${this.scene_name}** ++++ [ERROR] ++++ END ERROR`;
    }
    else {
      data = `++++ **${this.scene_name}** ++++ [ERROR] ++++ \n ${stat}`;
    }
    this.statsErr.push(data);
  }

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
    let _fetch = false;
    return new Promise((resolve,reject)=>{

      let outInterval = setInterval(async () => {
        try{


              if(retries < 0){
                clearInterval(outInterval);
                return reject();  
              }
              if(!_fetch) {
                const res = await fetch(self.config.host);
                if(res.ok){
                  _fetch = true;
                  retries = 120; // wait for 120 seconds
                  console.log('fetch completed')
                  await this.page.goto(this.config.host,{
                    waitUntil: 'domcontentloaded',
                  });

                }
              }

              if(_fetch){
                let __THREE__ =  await this.page.evaluate(()=>{
                  return window.__THREE__;                 
                });
                console.log('__THREE__', __THREE__);
                if(__THREE__ === '133'){
                  console.log('Webaverse is running tests. Sit tight! :)');
                  clearInterval(outInterval);
                  return resolve();  
                }
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

  waitForLoadToComplete() {
    return new Promise((resolve, reject) => {
      self.resolve = resolve;
      const currTimeout = setTimeout(()=>{
        reject();
      }, 120 * 1000);
      self.currTimeout = currTimeout;
    })
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

  sceneSuccess() {
    if(self.resolve) {
      self.resolve();
    }
    if(self.currTimeout) {
      clearTimeout(self.currTimeout);
    }
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
    this.browser = await puppeteer.launch({
      headless: false, // change to false for debug
      defaultViewport: null,
      ignoreHTTPSErrors: true, 
      dumpio: false,
      devtools: true,
      args: [		
      // '--disable-gpu',
      '--enable-webgl',
      '--use-cmd-decoder=passthrough'
      // '--no-sandbox',
      // '--enable-precise-memory-info',
      // '--enable-begin-frame-control',
      // '--enable-surface-synchronization',
      // '--run-all-compositor-stages-before-draw',
      // '--disable-threaded-animation',
      // '--disable-threaded-scrolling',
      // '--disable-checker-imaging'
    ],
    });

    this.page = await this.browser.newPage();
    await this.waitForServerBoot();

    await this.page.setDefaultNavigationTimeout(500000);

    this.page
      .on('console', message => {
        if (message.type().substr(0, 3).toUpperCase() === 'ERR') {
          this.addStat('ERROR', 'Page-Error: ' + message.text());
          this.addStatErr(message.text())
        }
      })
      .on('requestfailed', request => {
        this.addStat('NETWORK', `Request-Error: ${request.failure().errorText} ${request.url()}`);
        this.addStatErr(`${request.failure().errorText} ${request.url()}`)
      });

      
      await this.page.exposeFunction('SceneLoadedSuccessfully', this.sceneSuccess);
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
                  debugger;
                  return originalOnFailure(onFailure);
                }else if(typeof onFailure === 'object'){
                  PromiseIntercept(JSON.stringify(onFailure, Object.getOwnPropertyNames(onFailure)));
                  debugger;
                  return onFailure;
                }
                return originalOnFailure || onFailure;
            }
        

            const customFailureCaller = (e) =>{
              PromiseIntercept(e);
              debugger;
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
        
        window.addEventListener("cEvent", SceneLoadedSuccessfully, false);
      })


  }

  async testScene(sceneUrl) {
    const t0 = performance.now();
    try{
      await this.page.goto(sceneUrl,{
        waitUntil: 'domcontentloaded'
      });
      // await this.waitForNetworkIdle();
      await this.waitForLoadToComplete();
      const t1 = performance.now();
      this.addStat('PERFORMANCE', `Scene Loaded in ${Number(t1 - t0).toFixed(0) / 1000}s`);

    }catch(e){
      const t1 = performance.now();
      this.addStat('PERFORMANCE', `Failed to load scene at ${sceneUrl} in ${Number(t1 - t0).toFixed(0) / 1000}s`);
      this.addStatErr(`Failed to load scene at ${sceneUrl} in ${Number(t1 - t0).toFixed(0) / 1000}s`)

      /** Signa the Mocha Intercept */
      this.MochaIntercept();
    }
  }

  async test() {
    for (const scene of scenes) {
      this.scene_name = scene;
      const sceneUrl = `${this.config.host}?src=${this.config.host}/scenes/${scene}`;
      await this.testScene(sceneUrl);
      this.scenes.push(this.stats);
      this.stats = {
        errors: [],
        network: [],
        performance: [],
      };
    }

    var statsErrNew = [];
    try {
      for(let err of this.statsErr) {
        if(err.includes("net::ERR_ABORTED")) {
          const strCopy = err.split('net::ERR_ABORTED ');
          if(!strCopy[1].includes('blob'))
          {
            const res = await fetch(strCopy[1]);
            if(res.status != 200) {
              statsErrNew.push(err);
            }
          }
        }
        else {
          statsErrNew.push(err);
        }
      }  
    }

    catch (error) {
      console.log(error)
    }

    for(let err of statsErrNew) {
      await axios.post(this.WEBHOOK_URL, { content: err })
    }

    try {
      this.finish();      
    }
    catch(e){
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
