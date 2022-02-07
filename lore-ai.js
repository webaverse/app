import {loreAiEndpoint} from './constants.js';

class LoreAI {
  generate(prompt, {
    maxTokens = 25,
    end,
  } = {}) {
    return new Promise((resolve, reject) => {
      if (prompt) {    
        const url = new URL(loreAiEndpoint);
        url.searchParams.set('p', prompt);
        url.searchParams.set('l', maxTokens);
        if (typeof end !== 'undefined') {
          url.searchParams.set('e', end);
        }
      
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
            if (endIndex !== -1) {
              resolve(fullS.substring(0, endIndex));
            }
          } else {
            es.close();
            resolve(fullS);
          }
      
          console.log(JSON.stringify(prompt + fullS));
        });
      } else {
        reject(new Error('prompt is required'));
      }
    });
  }
};
const loreAI = new LoreAI();
export default loreAI;