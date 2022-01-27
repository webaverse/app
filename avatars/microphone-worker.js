class MicrophoneWorker extends EventTarget {
  constructor(options = {}) {
    super();

    this.audioWorkletNode = null;

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
          console.warn('invalid microphone worklet message', e.data);
        }
      }
    };

    this.audioWorkletNode = audioWorkletNode;
    this.audioWorkletNode.connect(options.audioContext.destination);
  }
  getInput() {
    return this.audioWorkletNode;
  }
  close() {
    // this.mediaStreamSource && this.mediaStreamSource.disconnect();
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.onmessage = null;
    }
  }
}
export default MicrophoneWorker;