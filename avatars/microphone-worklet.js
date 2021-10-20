const numTicks = 1;

let tick = 0;
let sampleSum = 0;
let numSamples = 0;
let muted = true;

class VolumeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.port.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      const {method} = data;
      if (method === 'muted') {
        muted = data.muted;
      }
    });
    this.port.start();
  }
  process(inputs, outputs) {
    const channels = inputs[0];
    // const output = outputs[0];

    // for (let i = 0; i < channels.length; i++) {
      const i = 0;
      const samples = channels[i];
      for (let j = 0; j < samples.length; j++) {
        sampleSum += Math.abs(samples[j]);
      }
      numSamples += samples.length;
    // }

    if (++tick >= numTicks) {
      this.port.postMessage(sampleSum / numSamples);

      tick = 0;
      sampleSum = 0;
      numSamples = 0;
    }

    if (!muted) {
      for (let i = 0; i < outputs.length; i++) {
        const input = inputs[i];
        const output = outputs[i];

        for (let channel = 0; channel < output.length; channel++) {
          output[channel].set(input[channel]);
        }
      }
    }

    return true;
  }
}
registerProcessor('volume-processor', VolumeProcessor);