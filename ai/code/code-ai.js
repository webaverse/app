import {codeAiHost} from '../../constants.js';

const generateStream = prompt => {
  const es = new EventSource(`${codeAiHost}?p=${encodeURIComponent(prompt)}`);
  let fullS = '';
  es.addEventListener('message', e => {
    const s = e.data;
    if (s !== '[DONE]') {
      const j = JSON.parse(s);
      const {choices} = j;
      const {text} = choices[0];
      fullS += text;
      if (!fullS) {
        fullS = '// nope';
      }
      result.dispatchEvent(new MessageEvent('update', {
        data: fullS,
      }));
    } else {
      es.close();
      result.dispatchEvent(new MessageEvent('done'));
    }
  });
  const result = new EventTarget();
  result.destroy = () => {
    es.close();
  };
  return result;
};

export {
  generateStream,
};
