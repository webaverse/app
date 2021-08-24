const numTicks = 1;

class WsWorklet extends AudioWorkletProcessor {
  constructor (...args) {
    super(...args);
    
    this.buffers = [];
    this.tick = 0;
    this.sampleSum = 0;
    this.numSamples = 0;
    // this.muted = false;
    
    this.port.onmessage = e => {
      this.buffers.push(e.data);
    };
  }
  process(inputs, outputs, parameters) {
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
            const v = buffer[frameIndex++];
            frames[i] = v;
            this.sampleSum += Math.abs(v);
            this.numSamples++;
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

    if (++this.tick >= numTicks) {
      this.port.postMessage({
        method: 'volume',
        args: {
          value: this.numSamples > 0 ?
            this.sampleSum / this.numSamples
          :
            0,
        },
      });

      this.tick = 0;
      this.sampleSum = 0;
      this.numSamples = 0;
    }
    
    return true;
  }
}
registerProcessor('ws-worklet', WsWorklet);