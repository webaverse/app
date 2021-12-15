class MicrophoneWorker extends EventTarget {
  constructor(o, options = {}) {
    super();

    this.live = true;
    this.mediaStreamSource = null;
    this.audioWorkletNode = null;

    if (o instanceof MediaStream) {
      const audio = document.createElement('audio');
      audio.srcObject = o;
      audio.muted = true;
    } else {
      /* const oldO = o;
      oldO.play = (play => function() {
        play.apply(oldO, arguments);
        play.apply(o, arguments);
      })(oldO.play);
      oldO.pause = (pause => function() {
        pause.apply(oldO, arguments);
        pause.apply(o, arguments);
      })(oldO.pause);
      o = o.cloneNode(); */
    }
    const mediaStreamSource = (() => {
      if (o instanceof MediaStream) {
        return options.audioContext.createMediaStreamSource(o);
      } else {
        return options.audioContext.createMediaElementSource(o);
      }
    })();
    this.mediaStreamSource = mediaStreamSource;

    // console.log('load module', options.microphoneWorkletUrl || 'avatars/microphone-worklet.js');
    this.loadPromise = options.audioContext.audioWorklet.addModule(options.microphoneWorkletUrl || 'avatars/microphone-worklet.js')
      .then(() => {
        if (!this.live) {
          return;
        }

        const audioWorkletNode = new AudioWorkletNode(options.audioContext, 'volume-processor');
        audioWorkletNode.port.postMessage(JSON.stringify({
          method: 'options',
          args: {
            muted: options.muted,
            emitVolume: options.emitVolume,
            emitBuffer: options.emitBuffer,
          },
        }));
        audioWorkletNode.port.onmessage = e => {
          switch (e.data.method) {
            case 'volume':
            case 'buffer':
              {
                this.dispatchEvent(new MessageEvent(e.data.method, {
                  data: e.data,
                }));
                break;
              }
            default: {
              console.warn('invalid microhpone worklet message', e.data);
            }
          }
        };
        // console.log('connect', mediaStreamSource);
        mediaStreamSource.connect(audioWorkletNode).connect(options.audioContext.destination);

        this.audioWorkletNode = audioWorkletNode;
      });
  }
  close() {
    this.live = false;
    this.mediaStreamSource && this.mediaStreamSource.disconnect();
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.onmessage = null;
    }
  }
  async waitForLoad() {
    await this.loadPromise;
  }
}
export default MicrophoneWorker;