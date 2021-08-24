class WsWorklet extends AudioWorkletProcessor {
  constructor (...args) {
    super(...args);
    this.buffers = [];
    this.port.onmessage = e => {
      this.buffers.push(e.data);
    };
  }
  process(inputs, outputs, parameters) {
    // if (this.buffers.length >= 3) {
      const output = outputs[0];
      /* for (const frames of output) {
        frames.fill(0);
      } */
      // console.log('outputs', outputs.length);
      let bufferIndex, frameIndex;
      for (const frames of output) {
        bufferIndex = 0;
        frameIndex = 0;
        if (bufferIndex < this.buffers.length) {
          for (let i = 0; i < frames.length; i++) {
            const buffer = this.buffers[bufferIndex];
            if (frameIndex < buffer.length) {
              // console.log('set frame', frames, buffer);
              frames[i] = buffer[frameIndex++];
            } else {
              bufferIndex++;
              frameIndex = 0;
              if (bufferIndex < this.buffers.length) {
                i--;
                continue;
              } else {
                break;
              }
            }
          }
        }
      }
      if (bufferIndex > 0) {
        // console.log('finished buffer', bufferIndex);
        this.buffers.splice(0, bufferIndex);
      }
      if (frameIndex > 0) {
        this.buffers[0] = this.buffers[0].slice(frameIndex);
        if (this.buffers[0].length === 0) {
          this.buffers.shift();
        }
      }
    // }
    return true;
  }
}
registerProcessor('ws-worklet', WsWorklet);