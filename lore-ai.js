import {loreAiEndpoint} from './constants.js';

class LoreAI {
  generate(prompt, {
    end,
    maxTokens = 25,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (prompt) {    
        const url = new URL(loreAiEndpoint);
        url.searchParams.set('p', prompt);
        url.searchParams.set('l', maxTokens);
        if (typeof end !== 'undefined') {
          url.searchParams.set('e', end);
        }
        // console.log('got url', url);
      
        // prompt = `# Scene 1\n\nThe characters are having a conversation.\n\nCharacter 1: ${prompt}\nCharacter 2:`;
        const es = new EventSource(url);
        let fullS = '';
        es.addEventListener('message', e => {
          const s = e.data;
          // console.log('got s', s);
          if (s !== '[DONE]') {
            const j = JSON.parse(s);
            // console.log(j.choices);
            const {choices} = j;
            const {text} = choices[0];
            fullS += text;
      
            const endIndex = fullS.indexOf(end);
            // console.log('got end index', {fullS, end, endIndex});
            if (endIndex !== -1) {
              es.close();
              resolve(fullS.substring(0, endIndex));
            }
          } else {
            // console.log('close');
            es.close();
            resolve(fullS);
          }
      
          // console.log(JSON.stringify(prompt + fullS));
        });
        es.addEventListener('error', err => {
          console.log('lore event source error', err);
          es.close();
          reject(err);
        });
      } else {
        reject(new Error('prompt is required'));
      }
    });
  }
};
const loreAI = new LoreAI();
export default loreAI;