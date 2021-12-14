const workerUrl = './public/pocketsphinx.js/webapp/js/recognizer.js';
const u = '/sounds/pissbaby.mp3';

console.log('initialize');

let recognizer;
function spawnWorker(workerurl, onReady) {
  recognizer = new Worker(workerurl, {
    // type: 'module',
  });
  recognizer.onmessage = function(event) {
      recognizer.onmessage = null;
      // onReady will be called when there is a message
      // back
      onReady(recognizer);
  };
  recognizer.postMessage({
    'pocketsphinx.js': 'pocketsphinx.js',
    'pocketsphinx.wasm': 'pocketsphinx.wasm',
  });
}
spawnWorker(workerUrl, recognizer => {
  console.log('got recognizer', recognizer);


  class CallbackManager {
    constructor() {
      this.callbackIds = 0;
      this.callbacks = {};
    }
    add(callback) {
      const id = ++this.callbackIds;
      this.callbacks[id] = callback;
      return id;
    }
    get(callbackId) {
      const result = this.callbacks[callbackId];
      delete this.callbacks[callbackId];
      return result;
    }
  }
  const callbackManager = new CallbackManager();
  function updateCount(newCount) {
    console.log('update count', newCount);
  }
  function updateStatus(newStatus) {
    console.log('update status', newStatus);
  }
  recognizer.onmessage = function(e) {
    console.log('got message', e.data);

    // This is the case when we have a callback id to be called
    if (e.data.hasOwnProperty('id')) {
      var clb = callbackManager.get(e.data['id']);
      var data = {};
      if ( e.data.hasOwnProperty('data')) data = e.data.data;
      if(clb) clb(data);
    }
    // This is a case when the recognizer has a new count number
    if (e.data.hasOwnProperty('hyp')) {
      var newCount = e.data.hyp;
      if (e.data.hasOwnProperty('final') &&  e.data.final) newCount = "Final: " + newCount;
      updateCount(newCount);
    }
    // This is the case when we have an error
    if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
      updateStatus("Error in " + e.data.command + " with code " + e.data.code);
    }
};
  function postRecognizerJob(message, callback) {
    var msg = message || {};
    msg.callbackId = callbackManager.add(callback);
    recognizer.postMessage(msg);
  }
  function initRecognizer() {
    postRecognizerJob({
      command: 'lazyLoad',
      data: {
        // pocketsphinx/model/en-us/en-us-phone.lm.bin
        // folders: [["/", "zh_broadcastnews_ptm256_8000"]],
        folders: [],
        files: [
          ["/", "en-us-phone.lm.bin", "../model/en-us/en-us-phone.lm.bin"],
          /* ["/zh_broadcastnews_ptm256_8000", "means", "../zh_broadcastnews_ptm256_8000/means"],
          ["/zh_broadcastnews_ptm256_8000", "variances", "../zh_broadcastnews_ptm256_8000/variances"],
          ["/zh_broadcastnews_ptm256_8000", "transition_matrices", "../zh_broadcastnews_ptm256_8000/transition_matrices"],
          ["/zh_broadcastnews_ptm256_8000", "sendump", "../zh_broadcastnews_ptm256_8000/sendump"],
          ["/zh_broadcastnews_ptm256_8000", "mdef", "../zh_broadcastnews_ptm256_8000/mdef"],
          ["/zh_broadcastnews_ptm256_8000", "feat.params", "../zh_broadcastnews_ptm256_8000/feat.params"],
          ["/zh_broadcastnews_ptm256_8000", "mixture_weights", "../zh_broadcastnews_ptm256_8000/mixture_weights"],
          ["/zh_broadcastnews_ptm256_8000", "noisedict", "../zh_broadcastnews_ptm256_8000/noisedict"] */
        ],
      },
    }, () => {
      console.log('lazy loaded');

      // You can pass parameters to the recognizer, such as : {command: 'initialize', data: [["-hmm", "my_model"], ["-fwdflat", "no"]]}
      postRecognizerJob({
        command: 'initialize',
        data: [["-kws_threshold", "1e-25", '-allphone', 'en-us-phone.lm.bin']],

        // pocketsphinx/model/en-us/en-us-phone.lm.bin

        // data: [['-allophone']],
      },
        function() {
          console.log('audio recognizer loaded');

          window.addEventListener('keydown', async e => {
            // console.log('got which', e.which);
            if (e.which === 80) {
              const context = new AudioContext();

              const response = await fetch(u)
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await context.decodeAudioData(arrayBuffer);
              console.log('got audio buffer', audioBuffer);

              recognizer.postMessage({
                command: 'start',
                data: 1,
                /* data: {
                  lol: 'zol',
                }, */
              });
              const data = new Uint16Array(4096);
              recognizer.postMessage({
                command: 'process',
                data,
              }, [data.buffer]);
              recognizer.postMessage({
                command: 'stop',
              });
              /* playButton.disabled = false;
              yodelBuffer = audioBuffer; */

              /* if (recorder) {
                recorder.consumers = [recognizer];
              }
              feedWords(wordList); */
            }
          });
        });
      }
    );
  }
  initRecognizer();
});