class MicrophoneWorker extends EventTarget {
  constructor(mediaStream, options = {}) {
    super();

    this.live = true;

    const audio = document.createElement('audio');
    audio.srcObject = mediaStream;
    audio.muted = true;
    this.audioContext = new AudioContext();
    const mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);

    this.audioContext.audioWorklet.addModule(options.microphoneWorkletUrl || 'microphone-worklet.js')
      .then(() => {
        const audioWorkletNode = new AudioWorkletNode(this.audioContext, 'volume-processor');
        if (options.muted === false) {
          audioWorkletNode.port.postMessage(JSON.stringify({
            method: 'muted',
            muted: false,
          }));
        }
        audioWorkletNode.port.onmessage = e => {
          if (this.live) {
            this.dispatchEvent(new MessageEvent('volume', {
              data: e.data,
            }));
          }
        };
        mediaStreamSource.connect(audioWorkletNode).connect(this.audioContext.destination);
      });
  }
  close() {
    this.live = false;
    this.audioContext.close();
  }
}
export default MicrophoneWorker;