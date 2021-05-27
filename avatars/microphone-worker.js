class MicrophoneWorker extends EventTarget {
  constructor(o, options = {}) {
    super();

    this.live = true;

    if (o instanceof MediaStream) {
      const audio = document.createElement('audio');
      audio.srcObject = o;
      audio.muted = true;
    } else {
      const oldO = o;
      oldO.play = (play => function() {
        play.apply(oldO, arguments);
        play.apply(o, arguments);
      })(oldO.play);
      oldO.pause = (pause => function() {
        pause.apply(oldO, arguments);
        pause.apply(o, arguments);
      })(oldO.pause);
      o = o.cloneNode();
    }
    this.audioContext = new AudioContext();
    const mediaStreamSource = (() => {
      if (o instanceof MediaStream) {
        return this.audioContext.createMediaStreamSource(o);
      } else {
        return this.audioContext.createMediaElementSource(o);
      }
    })();

    this.audioContext.audioWorklet.addModule(options.microphoneWorkletUrl || 'avatars/microphone-worklet.js')
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