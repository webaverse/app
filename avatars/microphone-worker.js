class MicrophoneWorker extends EventTarget {
  constructor(options = {}) {
    super();

    this.live = true;
    // this.mediaStreamSource = null;
    this.audioWorkletNode = null;

    // console.log('load module', options.microphoneWorkletUrl || 'avatars/microphone-worklet.js');
    this.loadPromise = (async () => {
      await options.audioContext.audioWorklet.addModule(options.microphoneWorkletUrl || 'avatars/microphone-worklet.js');
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
                data: e.data.data,
              }));
              break;
            }
          default: {
            console.warn('invalid microhpone worklet message', e.data);
          }
        }
      };
      // console.log('connect', mediaStreamSource);

      this.audioWorkletNode = audioWorkletNode;
      this.audioWorkletNode.connect(options.audioContext.destination);
    })();
  }
  getInput() {
    return this.audioWorkletNode;
  }
  close() {
    this.live = false;
    // this.mediaStreamSource && this.mediaStreamSource.disconnect();
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.onmessage = null;
    }
  }
  waitForLoad() {
    return this.loadPromise;
  }
}
export default MicrophoneWorker;