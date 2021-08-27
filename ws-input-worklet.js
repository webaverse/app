const bufferSize = 4096;

class WsInputWorklet extends AudioWorkletProcessor {
  constructor (...args) {
    super(...args);

    this.buffer = new Float32Array(bufferSize);
    this.bufferIndex = 0;
  }
  process(inputs, outputs, parameters) {
    const channels = inputs[0];
    const firstChannel = channels[0];
    for (let i = 0; i < firstChannel.length; i++) {
      this.buffer[this.bufferIndex++] = firstChannel[i];
      if (this.bufferIndex >= this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(bufferSize);
        this.bufferIndex = 0;
      }
    }
    
    return true;
  }
}
registerProcessor('ws-input-worklet', WsInputWorklet);