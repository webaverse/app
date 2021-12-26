// import {makePromise} from './util.js';

class CallbackManager {
  constructor() {
    this.currentId = 0;
    this.callbackPool = {};
  }
  add(clb) {
    var id = this.currentId;
    this.callbackPool[id] = clb;
    this.currentId++;
    return id;
  }
  get(id) {
    const clb = this.callbackPool[id];
    if (clb) {
      delete this.callbackPool[id];
      return clb;
    } else {
      return null;
    }
  }
}
class AudioRecognizer extends EventTarget {
  constructor({sampleRate}) {
    super();

    this.callbackManager = new CallbackManager();
    this.loadPromise = makePromise();

    const workerURL = '/pocketsphinx.js/webapp/js/recognizer.js';
    this.worker = new Worker(workerURL);
    this.worker.onmessage = e => {
      this.worker.onmessage = e => {
        // This is the case when we have a callback id to be called
        if (e.data.hasOwnProperty('id')) {
          var clb = this.callbackManager.get(e.data['id']);
          var data = {};
          if ( e.data.hasOwnProperty('data')) data = e.data.data;
          if(clb) clb(data);
        }
        /* // This is a case when the recognizer has a new hypothesis
        if (e.data.hasOwnProperty('hyp')) {
          var newHyp = e.data.hyp;
          if (e.data.hasOwnProperty('final') &&  e.data.final) newHyp = "Final: " + newHyp;
          updateHyp(newHyp);
        } */
        // This is a case when the recognizer has a new result
        if (e.data.hasOwnProperty('result')) {
          // console.log('got result', e.data.result);
          this.dispatchEvent(new MessageEvent('result', {
            data: e.data.result,
          }));
        }
        // This is the case when we have an error
        if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
          // updateStatus("Error in " + e.data.command + " with code " + e.data.code);
          this.dispatchEvent(new MessageEvent('error', {
            data: e.data,
          }));
        }
      };

      (async () => {
        this.worker.postMessage({ command: 'configure', data: {
          sampleRate,
        } });
        await this.postRecognizerJob({
          command: 'lazyLoad',
          data: {
            // pocketsphinx/model/en-us/en-us-phone.lm.bin
            // folders: [["/", "zh_broadcastnews_ptm256_8000"]],
            folders: [],
            files: [
              ["/", "en-us-phone.lm.bin", "../../model/en-us/en-us-phone.lm.bin"],
              /* ["/zh_broadcastnews_ptm256_8000", "means", "../zh_broadcastnews_ptm256_8000/means"],
              ["/zh_broadcastnews_ptm256_8000", "variances", "../zh_broadcastnews_ptm256_8000/variances"],
              ["/zh_broadcastnews_ptm256_8000", "transition_matrices", "../zh_broadcastnews_ptm256_8000/transition_matrices"],
              ["/zh_broadcastnews_ptm256_8000", "sendump", "../zh_broadcastnews_ptm256_8000/sendump"],
              ["/zh_broadcastnews_ptm256_8000", "mdef", "../zh_broadcastnews_ptm256_8000/mdef"],
              ["/zh_broadcastnews_ptm256_8000", "feat.params", "../zh_broadcastnews_ptm256_8000/feat.params"],
              ["/zh_broadcastnews_ptm256_8000", "mixture_weights", "../zh_broadcastnews_ptm256_8000/mixture_weights"],
              ["/zh_broadcastnews_ptm256_8000", "noisedict", "../zh_broadcastnews_ptm256_8000/noisedict"] */
              // ["/", "kws.txt", "../kws.txt"],
              // ["/", "kws.dict", "../kws.dict"],
            ],
          },
        });
        await this.postRecognizerJob(
          {
            command: 'initialize',
            data: [/*["-kws", "kws.txt"], ["-dict","kws.dict"], */ ['-allphone', 'en-us-phone.lm.bin'], ['-logfn', '/dev/null']],
          }
        );

        this.worker.postMessage({ command: 'start', data: '' });

        this.loadPromise.accept();
      })();
    };

    this.worker.postMessage({
      'pocketsphinx.js': 'pocketsphinx.js',
      'pocketsphinx.wasm': 'pocketsphinx.wasm',
    });
  }
  waitForLoad() {
    return this.loadPromise;
  }
  postRecognizerJob(message) {
    return new Promise((accept, reject) => {
      var msg = message || {};
      msg.callbackId = this.callbackManager.add(accept);
      this.worker.postMessage(msg);
    });
  }
  send(result) {
    this.worker.postMessage({
      command: 'process',
      data: result,
    }, [result.buffer]);
  }
  destroy() {
    this.worker.postMessage({ command: 'stop' });
  }
}

export {
  AudioRecognizer,
};