// import audioManager from '../../audio-manager.js';
import {audioAIEndpointUrl} from '../../constants.js';

class AudioAI {
  async txt2sound(prompt) {
    const url = new URL(audioAIEndpointUrl);
    url.pathname = '/sound';
    url.searchParams.set('s', prompt);

    const res = await fetch(url);
    const blob = await res.blob();
    return blob;
    /* const audioContext = audioManager.getAudioContext();
    const audioData = await audioContext.decodeAudioData(arrayBuffer);
    return audioData; */
  }
}
const audioAI = new AudioAI();
export default audioAI;