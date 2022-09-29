class VolumeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.numTicks = 1;
    this.tick = 0;
    this.sampleSum = 0;
    this.muted = true;
    this.emitVolume = false;
    this.emitBuffer = false;
    this.queue = [];
    this.queueLength = 0;
    this.maxQueueLength = 4000;

    this.port.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      const {method} = data;
      if (method === 'options') {
        const {args} = data;
        if (args.muted !== undefined) {
          this.muted = args.muted;
        }
        if (args.emitVolume !== undefined) {
          this.emitVolume = args.emitVolume;
        }
        if (args.emitBuffer !== undefined) {
          this.emitBuffer = args.emitBuffer;
        }
      }
    });
    this.port.start();
  }

  process(inputs, outputs) {
    const _emitVolume = () => {
      {
        for (const channels of inputs) {
          for (const samples of channels) {
            for (let j = 0; j < samples.length; j++) {
              this.sampleSum += Math.abs(samples[j]);
            }
            this.numSamples += samples.length;
          }
        }
      }

      if (++this.tick >= this.numTicks) {
        const value = this.sampleSum > 0 ? this.sampleSum / this.numSamples : 0;
        this.port.postMessage({
          method: 'volume',
          data: value,
        });

        this.tick = 0;
        this.sampleSum = 0;
        this.numSamples = 0;
      }
    };
    this.emitVolume && _emitVolume();

    // merge the channels
    const sampleLength =
      (inputs && inputs[0] && inputs[0][0] && inputs[0][0].length) ?? 0;
    if (sampleLength > 0) {
      const _mergeOutput = () => {
        const mergedChannels = Array(2);
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
          const mergedChannel = new Float32Array(sampleLength);
          mergedChannels[channelIndex] = mergedChannel;

          for (const channels of inputs) {
            for (const samples of channels) {
              for (let j = 0; j < samples.length; j++) {
                mergedChannel[j] += samples[j] / channels.length;
              }
            }
          }
        }

        this.queue.push(mergedChannels);
        this.queueLength += sampleLength;

        while (this.queueLength > this.maxQueueLength) {
          const channels = this.queue.shift();
          this.queueLength -= channels[0].length;
          for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            for (
              let channelIndex = 0;
              channelIndex < output.length;
              channelIndex++
            ) {
              output[channelIndex] &&
                output[channelIndex].set(mergedChannels[channelIndex]);
            }
          }
        }
      };
      !this.muted && _mergeOutput();

      const _emitBuffer = () => {
        const mergedSamples = new Float32Array(sampleLength);
        for (const channels of inputs) {
          for (const samples of channels) {
            for (let j = 0; j < samples.length; j++) {
              mergedSamples[j] += samples[j] / channels.length;
            }
          }
        }
        this.port.postMessage(
          {
            method: 'buffer',
            data: mergedSamples,
          },
          [mergedSamples.buffer],
        );
      };
      this.emitBuffer && _emitBuffer();
    }

    return true;
  }
}
registerProcessor('volume-processor', VolumeProcessor);
