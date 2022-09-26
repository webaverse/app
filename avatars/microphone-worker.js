class MicrophoneWorker extends EventTarget {
  constructor(options = {}) {
    super();

    const gainNode = new GainNode(options.audioContext);
    this.gainNode = gainNode;

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

    gainNode.connect(audioWorkletNode);
    audioWorkletNode.connect(options.audioContext.gain);
  }

  getInput() {
    return this.gainNode;
  }

  close() {
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.onmessage = null;
    }
  }
}
export default MicrophoneWorker;
