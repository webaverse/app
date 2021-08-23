window.addEventListener('click', async e => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const audioTracks = mediaStream.getAudioTracks();
  const audioTrack = audioTracks[0];
  const audioTrackSettings = audioTrack.getSettings();
  const audio = (new MediaStreamTrackProcessor(audioTrack)).readable;
  console.log('got media', audioTrack, audioTrack.getSettings(), audio);

  const audioEncoder = new AudioEncoder({
    output: muxAndSend,
    error: onEncoderError,
  });
  await audioEncoder.configure({
    codec: 'opus',
    numberOfChannels: audioTrackSettings.channelCount,
    sampleRate: audioTrackSettings.sampleRate,
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
    audioDecoder.decode(encodedChunk);
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
  function demuxAndPlay(encodedChunk) {
    console.log('demux encodedChunk', encodedChunk);
  }
  function onDecoderError(err) {
    console.warn('decoder error', err);
  }
  
  readAndEncode(audio.getReader(), audioEncoder);
});