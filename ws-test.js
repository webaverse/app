window.addEventListener('click', async e => {
  const ws = await new Promise((accept, reject) => {
    const ws = new WebSocket('wss://' + window.location.host);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', () => {
      accept(ws);
    });
    ws.addEventListener('error', reject);
  });
  // console.log('got ws', ws);
  let lastMessage = null;
  ws.addEventListener('message', e => {
    if (typeof e.data === 'string') {
      lastMessage = e.data;
    } else {
      // console.log('got e', e.data, lastMessage);
      const j = JSON.parse(lastMessage);
      lastMessage = null;
      const {type, timestamp, duration} = j;
      const {data} = e;
      const encodedAudioChunk = new EncodedAudioChunk({
        type,
        timestamp,
        duration,
        data: e.data,
      });
      audioDecoder.decode(encodedAudioChunk);
    }
  });
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const audioTracks = mediaStream.getAudioTracks();
  const audioTrack = audioTracks[0];
  const audioTrackSettings = audioTrack.getSettings();
  const audio = (new MediaStreamTrackProcessor(audioTrack)).readable;
  // console.log('got media', audioTrack, audioTrack.getSettings(), audio);

  const audioEncoder = new AudioEncoder({
    output: muxAndSend,
    error: onEncoderError,
  });
  await audioEncoder.configure({
    codec: 'opus',
    numberOfChannels: audioTrackSettings.channelCount,
    sampleRate: audioTrackSettings.sampleRate,
    bitrate: 60_000,
    /* tuning: {
      bitrate: 60_000,
    }, */
  });

  const audioDecoder = new AudioDecoder({
    output: demuxAndPlay,
    error: onDecoderError,
  });
  await audioDecoder.configure({
    codec: 'opus',
    numberOfChannels: audioTrackSettings.channelCount,
    sampleRate: audioTrackSettings.sampleRate,
    /* tuning: {
      bitrate: 60_000,
    }, */
  });  
  
  function muxAndSend(encodedChunk) {
    const {type, timestamp, duration, data} = encodedChunk;
    ws.send(JSON.stringify({
      type,
      timestamp,
      duration,
    }));
    ws.send(data);
    // audioDecoder.decode(encodedChunk);
  }
  function onEncoderError(err) {
    console.warn('encoder error', err);
  }
  async function readAndEncode(reader, encoder) {
    const result = await reader.read();
    if (!result.done) {
      encoder.encode(result.value);
      readAndEncode(reader, encoder);
    }
  }
  // let playing = false;
  const buffers = [];
  const _flushBuffers = () => {
    while (buffers.length > 0) {
      const source = audioCtx.createBufferSource();
      source.buffer = buffers.shift();
      source.connect(audioCtx.destination);
      source.start();
      /* source.onended = () => {
        // source.disconnect();
        playing = false;
        _flushBuffers();
      }; */
      // playing = true;
    }
  };
  function demuxAndPlay(audioData) {
    const audioBuffer = audioData.buffer;
    // console.log('demux', audioBuffer);
    buffers.push(audioBuffer);
    _flushBuffers();
  }
  function onDecoderError(err) {
    console.warn('decoder error', err);
  }
  
  readAndEncode(audio.getReader(), audioEncoder);

  const audioCtx = new AudioContext();
});